# Database Schema Design
## Flag Stock Marketplace - Relational Database Architecture

### Design Principles
- **Normalization**: 3NF (Third Normal Form) with strategic denormalization for performance
- **Referential Integrity**: Foreign keys with appropriate CASCADE/SET NULL behaviors
- **Audit Trail**: Created/updated timestamps on all tables
- **Soft Deletes**: Archive instead of hard delete for data recovery
- **Performance**: Strategic indexing for common query patterns
- **Scalability**: Partitioning-ready design for large datasets

---

## Core Tables

### 1. flags
**Purpose**: Master table for flag entities (e.g., "United States Flag")

```sql
CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Classification
  country_code VARCHAR(3), -- ISO 3166-1 alpha-3 (e.g., 'USA')
  organization_name VARCHAR(255), -- For international orgs (e.g., 'United Nations')
  
  -- Metadata
  keywords TEXT[], -- Full-text search keywords
  search_vector tsvector, -- Pre-computed for full-text search
  
  -- Status & Control
  status VARCHAR(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived', 'pending_review')),
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Admin Tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT flags_country_or_org CHECK (
    country_code IS NOT NULL OR organization_name IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_flags_slug ON flags(slug);
CREATE INDEX idx_flags_status ON flags(status) WHERE status = 'published';
CREATE INDEX idx_flags_country_code ON flags(country_code);
CREATE INDEX idx_flags_organization ON flags(organization_name);
CREATE INDEX idx_flags_created_at ON flags(created_at DESC);
CREATE INDEX idx_flags_search_vector ON flags USING GIN(search_vector);
CREATE INDEX idx_flags_keywords ON flags USING GIN(keywords);
CREATE INDEX idx_flags_featured ON flags(is_featured) WHERE is_featured = TRUE;

-- Full-text search trigger
CREATE TRIGGER flags_search_vector_update BEFORE INSERT OR UPDATE ON flags
  FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(
    search_vector, 'pg_catalog.english', title, description
  );
```

**Example Data:**
```
id: 550e8400-e29b-41d4-a716-446655440000
title: "United States Flag"
slug: "united-states-flag"
description: "The national flag of the United States of America"
country_code: "USA"
status: "published"
created_at: 2024-01-15 10:30:00+00
```

---

### 2. flag_variants
**Purpose**: Different styles/versions of the same flag (flat, waving, round, etc.)

```sql
CREATE TABLE flag_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  
  -- Variant Identity
  variant_type VARCHAR(50) NOT NULL 
    CHECK (variant_type IN ('flat', 'waving', 'round', 'heart', 'icon', 'mockup', 'fx', 'animated')),
  variant_name VARCHAR(100), -- Optional custom name (e.g., "Waving in Wind")
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  description TEXT,
  preview_url TEXT, -- Quick preview image/video URL
  
  -- Status
  is_default BOOLEAN DEFAULT FALSE, -- Primary variant for display
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_flag_variant_type UNIQUE(flag_id, variant_type),
  CONSTRAINT only_one_default_per_flag EXCLUDE USING btree (flag_id WITH =) 
    WHERE (is_default = TRUE)
);

-- Indexes
CREATE INDEX idx_flag_variants_flag_id ON flag_variants(flag_id);
CREATE INDEX idx_flag_variants_type ON flag_variants(variant_type);
CREATE INDEX idx_flag_variants_active ON flag_variants(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_flag_variants_default ON flag_variants(flag_id, is_default) WHERE is_default = TRUE;
```

**Example Data:**
```
id: 660e8400-e29b-41d4-a716-446655440001
flag_id: 550e8400-e29b-41d4-a716-446655440000
variant_type: "flat"
is_default: TRUE
display_order: 1

id: 660e8400-e29b-41d4-a716-446655440002
flag_id: 550e8400-e29b-41d4-a716-446655440000
variant_type: "waving"
is_default: FALSE
display_order: 2
```

---

### 3. media_assets
**Purpose**: Physical file storage references and metadata

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES flag_variants(id) ON DELETE CASCADE,
  format_id UUID NOT NULL REFERENCES media_formats(id) ON DELETE RESTRICT,
  
  -- File Information
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Storage path (S3 key or local path)
  file_url TEXT NOT NULL, -- Public CDN URL
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Dimensions & Quality
  width INTEGER,
  height INTEGER,
  aspect_ratio DECIMAL(5, 2), -- width/height, pre-calculated
  dpi INTEGER, -- For print formats
  duration_seconds INTEGER, -- For video formats
  bitrate_kbps INTEGER, -- For video formats
  codec VARCHAR(50), -- For video formats
  
  -- Variant Information
  quality_level VARCHAR(20), -- 'original', 'high', 'medium', 'low'
  is_watermarked BOOLEAN DEFAULT FALSE,
  color_mode VARCHAR(20), -- 'rgb', 'cmyk', 'grayscale'
  has_transparency BOOLEAN DEFAULT FALSE,
  
  -- Processing Status
  processing_status VARCHAR(20) DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- Metadata
  metadata JSONB, -- Flexible storage for format-specific metadata
  checksum VARCHAR(64), -- SHA-256 for integrity verification
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT positive_file_size CHECK (file_size_bytes > 0),
  CONSTRAINT positive_dimensions CHECK (
    (width IS NULL OR width > 0) AND (height IS NULL OR height > 0)
  )
);

-- Indexes
CREATE INDEX idx_media_assets_variant_id ON media_assets(variant_id);
CREATE INDEX idx_media_assets_format_id ON media_assets(format_id);
CREATE INDEX idx_media_assets_processing ON media_assets(processing_status) 
  WHERE processing_status IN ('pending', 'processing');
CREATE INDEX idx_media_assets_quality ON media_assets(variant_id, quality_level);
CREATE INDEX idx_media_assets_watermarked ON media_assets(is_watermarked);
CREATE INDEX idx_media_assets_metadata ON media_assets USING GIN(metadata);
CREATE INDEX idx_media_assets_checksum ON media_assets(checksum);
```

**Example Data:**
```
id: 770e8400-e29b-41d4-a716-446655440003
variant_id: 660e8400-e29b-41d4-a716-446655440001
format_id: [SVG format UUID]
file_name: "usa-flag-flat.svg"
file_path: "assets/vectors/usa-flag/original/usa-flag-flat.svg"
file_url: "https://cdn.flagstock.com/assets/vectors/usa-flag/original/usa-flag-flat.svg"
file_size_bytes: 15234
mime_type: "image/svg+xml"
quality_level: "original"
has_transparency: TRUE
processing_status: "completed"
```

---

### 4. media_formats
**Purpose**: Reference table for supported media formats

```sql
CREATE TABLE media_formats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Format Identity
  format_code VARCHAR(20) UNIQUE NOT NULL, -- 'svg', 'png', 'jpg', 'mp4', etc.
  format_name VARCHAR(100) NOT NULL, -- 'Scalable Vector Graphics', 'PNG Image', etc.
  mime_type VARCHAR(100) NOT NULL,
  file_extension VARCHAR(10) NOT NULL,
  
  -- Classification
  format_category VARCHAR(50) NOT NULL 
    CHECK (format_category IN ('vector', 'raster', 'video', 'audio', 'document')),
  is_lossless BOOLEAN DEFAULT FALSE,
  supports_transparency BOOLEAN DEFAULT FALSE,
  supports_animation BOOLEAN DEFAULT FALSE,
  
  -- Capabilities
  max_dimensions_width INTEGER,
  max_dimensions_height INTEGER,
  recommended_qualities INTEGER[], -- For formats with quality settings [75, 85, 90]
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_downloadable BOOLEAN DEFAULT TRUE, -- Some formats may be preview-only
  
  -- Metadata
  description TEXT,
  technical_specs JSONB, -- Format-specific technical information
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_media_formats_code ON media_formats(format_code);
CREATE INDEX idx_media_formats_category ON media_formats(format_category);
CREATE INDEX idx_media_formats_active ON media_formats(is_active) WHERE is_active = TRUE;
```

**Example Data:**
```
id: 880e8400-e29b-41d4-a716-446655440004
format_code: "svg"
format_name: "Scalable Vector Graphics"
mime_type: "image/svg+xml"
file_extension: ".svg"
format_category: "vector"
is_lossless: TRUE
supports_transparency: TRUE
supports_animation: TRUE
is_active: TRUE
```

---

### 5. categories
**Purpose**: Hierarchical category system

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0, -- Depth in hierarchy (0 = root)
  path TEXT, -- Materialized path (e.g., '/continents/north-america')
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  icon_url TEXT,
  image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Statistics (denormalized for performance)
  asset_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_path ON categories(path);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_categories_display_order ON categories(parent_id, display_order);
```

**Example Data:**
```
id: 990e8400-e29b-41d4-a716-446655440005
name: "North America"
slug: "north-america"
parent_id: [Continents category UUID]
level: 2
path: "/continents/north-america"
display_order: 1
asset_count: 45
```

---

### 6. flag_categories
**Purpose**: Many-to-many relationship between flags and categories

```sql
CREATE TABLE flag_categories (
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE, -- Primary category for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (flag_id, category_id)
);

-- Indexes
CREATE INDEX idx_flag_categories_flag_id ON flag_categories(flag_id);
CREATE INDEX idx_flag_categories_category_id ON flag_categories(category_id);
CREATE INDEX idx_flag_categories_primary ON flag_categories(flag_id, is_primary) 
  WHERE is_primary = TRUE;
```

---

### 7. tags
**Purpose**: Flexible tagging system for search and filtering

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  -- Metadata
  description TEXT,
  color VARCHAR(7), -- Hex color for UI display (optional)
  
  -- Statistics (denormalized)
  usage_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX idx_tags_active ON tags(is_active) WHERE is_active = TRUE;
```

---

### 8. flag_tags
**Purpose**: Many-to-many relationship between flags and tags

```sql
CREATE TABLE flag_tags (
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (flag_id, tag_id)
);

-- Indexes
CREATE INDEX idx_flag_tags_flag_id ON flag_tags(flag_id);
CREATE INDEX idx_flag_tags_tag_id ON flag_tags(tag_id);
```

---

### 9. users
**Purpose**: User accounts (customers and admins)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  
  -- Role & Permissions
  role VARCHAR(20) NOT NULL DEFAULT 'user' 
    CHECK (role IN ('user', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Preferences
  preferences JSONB, -- User preferences (language, notifications, etc.)
  
  -- Statistics
  total_downloads INTEGER DEFAULT 0,
  last_download_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_email_verified ON users(email_verified) 
  WHERE email_verified = TRUE;
```

---

### 10. subscriptions
**Purpose**: User subscription plans

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  
  -- Subscription Details
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'trialing')),
  
  -- Billing
  stripe_subscription_id VARCHAR(255) UNIQUE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, status, current_period_end) 
  WHERE status = 'active' AND current_period_end > CURRENT_TIMESTAMP;
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
```

---

### 11. subscription_plans
**Purpose**: Available subscription plans

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  
  -- Pricing
  duration_days INTEGER NOT NULL, -- 7 for weekly, 30 for monthly
  price_cents INTEGER NOT NULL, -- Price in cents (e.g., 999 = $9.99)
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Stripe Integration
  stripe_price_id VARCHAR(255) UNIQUE,
  stripe_product_id VARCHAR(255),
  
  -- Features
  features JSONB, -- Plan features (unlimited downloads, etc.)
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) 
  WHERE is_active = TRUE;
```

---

### 12. prices
**Purpose**: Pricing per format (allows different prices for different formats)

```sql
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  format_id UUID NOT NULL REFERENCES media_formats(id) ON DELETE CASCADE,
  
  -- Pricing
  price_cents INTEGER NOT NULL, -- Price in cents
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Access Control
  requires_subscription BOOLEAN DEFAULT TRUE, -- Premium format
  subscription_tier VARCHAR(50), -- Required subscription tier (if any)
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_flag_format_price UNIQUE(flag_id, format_id),
  CONSTRAINT positive_price CHECK (price_cents >= 0)
);

-- Indexes
CREATE INDEX idx_prices_flag_id ON prices(flag_id);
CREATE INDEX idx_prices_format_id ON prices(format_id);
CREATE INDEX idx_prices_subscription_required ON prices(requires_subscription) 
  WHERE requires_subscription = TRUE;
CREATE INDEX idx_prices_active ON prices(is_active) WHERE is_active = TRUE;
```

**Example Data:**
```
id: aa0e8400-e29b-41d4-a716-446655440006
flag_id: 550e8400-e29b-41d4-a716-446655440000
format_id: [SVG format UUID]
price_cents: 0
requires_subscription: FALSE
is_active: TRUE

id: aa0e8400-e29b-41d4-a716-446655440007
flag_id: 550e8400-e29b-41d4-a716-446655440000
format_id: [High-res PNG format UUID]
price_cents: 299
requires_subscription: TRUE
is_active: TRUE
```

---

### 13. downloads
**Purpose**: Download tracking and analytics

```sql
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  
  -- Download Details
  download_type VARCHAR(20) NOT NULL 
    CHECK (download_type IN ('free', 'premium', 'watermarked', 'preview')),
  format_id UUID NOT NULL REFERENCES media_formats(id) ON DELETE RESTRICT,
  
  -- Analytics
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country_code VARCHAR(2), -- ISO 3166-1 alpha-2 (from IP geolocation)
  
  -- Billing (if applicable)
  price_paid_cents INTEGER, -- Amount paid for this download
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_media_asset_id ON downloads(media_asset_id);
CREATE INDEX idx_downloads_format_id ON downloads(format_id);
CREATE INDEX idx_downloads_type ON downloads(download_type);
CREATE INDEX idx_downloads_created_at ON downloads(created_at DESC);
CREATE INDEX idx_downloads_country ON downloads(country_code);
CREATE INDEX idx_downloads_subscription ON downloads(subscription_id);

-- Partitioning (for large scale)
-- Consider partitioning by created_at (monthly partitions) for tables > 10M rows
```

---

## Relationships Diagram

```
flags (1) ──< (many) flag_variants
flag_variants (1) ──< (many) media_assets
media_assets (many) ──> (1) media_formats
flags (many) ──< (many) categories [via flag_categories]
flags (many) ──< (many) tags [via flag_tags]
flags (1) ──< (many) prices
prices (many) ──> (1) media_formats
users (1) ──< (many) subscriptions
subscriptions (many) ──> (1) subscription_plans
users (1) ──< (many) downloads
downloads (many) ──> (1) media_assets
downloads (many) ──> (1) media_formats
categories (1) ──< (many) categories [self-referential, parent_id]
```

---

## Indexing Strategy

### Primary Indexes
- All primary keys (automatic)
- All foreign keys (for JOIN performance)
- Unique constraints (automatic)

### Performance Indexes
- **Status filters**: Partial indexes on `status = 'published'` (smaller, faster)
- **Full-text search**: GIN indexes on `search_vector` and `keywords[]`
- **Date ranges**: B-tree indexes on `created_at DESC` for recent items
- **Composite indexes**: For common query patterns (e.g., `(flag_id, is_default)`)

### Selective Indexes
- **Active items**: Partial indexes `WHERE is_active = TRUE`
- **Processing queue**: Partial index on `processing_status IN ('pending', 'processing')`
- **Active subscriptions**: Composite partial index for subscription checks

### Index Maintenance
- **VACUUM**: Regular vacuuming for updated/deleted rows
- **ANALYZE**: Regular statistics updates
- **REINDEX**: Periodic reindexing for heavily updated tables

---

## Performance Considerations

### 1. Query Optimization

**Common Queries:**
```sql
-- Get published flags with variants and formats
SELECT f.*, fv.*, ma.*, mf.*
FROM flags f
JOIN flag_variants fv ON f.id = fv.flag_id
JOIN media_assets ma ON fv.id = ma.variant_id
JOIN media_formats mf ON ma.format_id = mf.id
WHERE f.status = 'published'
  AND fv.is_active = TRUE
  AND ma.processing_status = 'completed'
ORDER BY f.created_at DESC
LIMIT 20;

-- Optimized with indexes on:
-- - flags.status (partial)
-- - flag_variants.flag_id, is_active
-- - media_assets.variant_id, processing_status
```

### 2. Denormalization Strategy

**Strategic Denormalization:**
- `categories.asset_count`: Updated via trigger (trade space for speed)
- `tags.usage_count`: Updated via trigger
- `flags.search_vector`: Pre-computed full-text search vector
- `media_assets.aspect_ratio`: Pre-calculated (width/height)

**Triggers for Denormalization:**
```sql
-- Update category asset count
CREATE OR REPLACE FUNCTION update_category_asset_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories SET asset_count = asset_count + 1
    WHERE id IN (SELECT category_id FROM flag_categories WHERE flag_id = NEW.id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories SET asset_count = asset_count - 1
    WHERE id IN (SELECT category_id FROM flag_categories WHERE flag_id = OLD.id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flag_category_count_update
  AFTER INSERT OR DELETE ON flag_categories
  FOR EACH ROW EXECUTE FUNCTION update_category_asset_count();
```

### 3. Partitioning Strategy

**Large Tables (Future):**
- `downloads`: Partition by `created_at` (monthly partitions)
- `media_assets`: Consider partitioning by `created_at` if > 10M rows

**Partitioning Example:**
```sql
-- Monthly partitions for downloads
CREATE TABLE downloads_2024_01 PARTITION OF downloads
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 4. Caching Strategy

**Application-Level Caching:**
- Category tree (rarely changes)
- Media format definitions (static)
- Subscription plans (rarely changes)
- Popular flags (Redis cache)

**Database-Level:**
- Materialized views for complex aggregations
- Query result caching for expensive queries

### 5. Connection Pooling

- **PgBouncer**: For connection pooling
- **Pool Size**: 20-50 connections per application instance
- **Statement Timeout**: 30 seconds for long-running queries

### 6. Read Replicas

**For Scale:**
- Primary: Write operations
- Replicas: Read operations (reporting, analytics)
- Load balancing for read queries

---

## Data Integrity Constraints

### Check Constraints
- Positive values (file_size_bytes > 0, width > 0, height > 0)
- Valid status values (enums via CHECK)
- Country code OR organization (flags table)
- Only one default variant per flag (EXCLUDE constraint)

### Foreign Key Cascades
- **CASCADE**: flag_variants → flags (delete flag, delete variants)
- **CASCADE**: media_assets → flag_variants (delete variant, delete assets)
- **RESTRICT**: media_assets → media_formats (prevent format deletion if in use)
- **SET NULL**: flags.created_by → users (preserve flag if admin deleted)

### Unique Constraints
- `flags.slug`: Unique flag identifiers
- `flag_variants(flag_id, variant_type)`: One variant type per flag
- `prices(flag_id, format_id)`: One price per flag-format combination

---

## Example Queries

### Get Flag with All Variants and Formats
```sql
SELECT 
  f.id as flag_id,
  f.title,
  fv.variant_type,
  mf.format_code,
  ma.file_url,
  ma.quality_level,
  p.price_cents,
  p.requires_subscription
FROM flags f
JOIN flag_variants fv ON f.id = fv.flag_id
JOIN media_assets ma ON fv.id = ma.variant_id
JOIN media_formats mf ON ma.format_id = mf.id
LEFT JOIN prices p ON f.id = p.flag_id AND mf.id = p.format_id
WHERE f.slug = 'united-states-flag'
  AND f.status = 'published'
  AND fv.is_active = TRUE
  AND ma.processing_status = 'completed'
ORDER BY fv.display_order, mf.format_code;
```

### Check User Download Access
```sql
SELECT 
  ma.id,
  ma.file_url,
  p.requires_subscription,
  CASE 
    WHEN p.requires_subscription = FALSE THEN 'free'
    WHEN EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = $1
        AND s.status = 'active'
        AND s.current_period_end > CURRENT_TIMESTAMP
    ) THEN 'premium'
    ELSE 'watermarked'
  END as access_level
FROM media_assets ma
JOIN flag_variants fv ON ma.variant_id = fv.id
JOIN flags f ON fv.flag_id = f.id
JOIN prices p ON f.id = p.flag_id AND ma.format_id = p.format_id
WHERE ma.id = $2
  AND f.status = 'published';
```

### Get Popular Flags
```sql
SELECT 
  f.id,
  f.title,
  f.slug,
  COUNT(d.id) as download_count,
  COUNT(DISTINCT d.user_id) as unique_downloaders
FROM flags f
JOIN flag_variants fv ON f.id = fv.flag_id
JOIN media_assets ma ON fv.id = ma.variant_id
LEFT JOIN downloads d ON ma.id = d.media_asset_id
WHERE f.status = 'published'
  AND d.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY f.id, f.title, f.slug
ORDER BY download_count DESC
LIMIT 20;
```

---

## Migration Strategy

### Phase 1: Core Tables
1. users, subscription_plans, subscriptions
2. categories, tags
3. flags, flag_variants
4. media_formats, media_assets

### Phase 2: Relationships
1. flag_categories, flag_tags
2. prices
3. downloads

### Phase 3: Indexes & Optimization
1. Create all indexes
2. Add triggers for denormalization
3. Set up partitioning (if needed)

### Phase 4: Data Migration
1. Migrate existing data
2. Validate relationships
3. Update statistics

---

## Monitoring & Maintenance

### Key Metrics
- **Table Sizes**: Monitor growth rates
- **Index Usage**: Identify unused indexes
- **Query Performance**: Slow query log
- **Connection Count**: Prevent connection exhaustion
- **Lock Contention**: Monitor for deadlocks

### Maintenance Tasks
- **Daily**: VACUUM ANALYZE on high-traffic tables
- **Weekly**: REINDEX on heavily updated indexes
- **Monthly**: Review and optimize slow queries
- **Quarterly**: Archive old downloads data

---

This schema provides a solid foundation for a scalable, performant flag stock marketplace with proper normalization, strategic denormalization, and comprehensive indexing.
