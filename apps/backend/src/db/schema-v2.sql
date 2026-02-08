-- Flag Stock Marketplace - Complete Database Schema v2
-- Optimized for: One flag → many variants → many formats

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'user' 
    CHECK (role IN ('user', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB,
  total_downloads INTEGER DEFAULT 0,
  last_download_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- Subscription Plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_price_id VARCHAR(255) UNIQUE,
  stripe_product_id VARCHAR(255),
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = TRUE;

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'trialing')),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, status, current_period_end) 
  WHERE status = 'active' AND current_period_end > CURRENT_TIMESTAMP;

-- Categories (hierarchical)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  path TEXT,
  display_order INTEGER DEFAULT 0,
  icon_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  asset_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_path ON categories(path);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);

-- Media Formats (reference table)
CREATE TABLE media_formats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  format_code VARCHAR(20) UNIQUE NOT NULL,
  format_name VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_extension VARCHAR(10) NOT NULL,
  format_category VARCHAR(50) NOT NULL 
    CHECK (format_category IN ('vector', 'raster', 'video', 'audio', 'document')),
  is_lossless BOOLEAN DEFAULT FALSE,
  supports_transparency BOOLEAN DEFAULT FALSE,
  supports_animation BOOLEAN DEFAULT FALSE,
  max_dimensions_width INTEGER,
  max_dimensions_height INTEGER,
  recommended_qualities INTEGER[],
  is_active BOOLEAN DEFAULT TRUE,
  is_downloadable BOOLEAN DEFAULT TRUE,
  description TEXT,
  technical_specs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_formats_code ON media_formats(format_code);
CREATE INDEX idx_media_formats_category ON media_formats(format_category);

-- Flags (master table)
CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  country_code VARCHAR(3),
  organization_name VARCHAR(255),
  keywords TEXT[],
  search_vector tsvector,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived', 'pending_review')),
  is_featured BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT flags_country_or_org CHECK (
    country_code IS NOT NULL OR organization_name IS NOT NULL
  )
);

CREATE INDEX idx_flags_slug ON flags(slug);
CREATE INDEX idx_flags_status ON flags(status) WHERE status = 'published';
CREATE INDEX idx_flags_country_code ON flags(country_code);
CREATE INDEX idx_flags_organization ON flags(organization_name);
CREATE INDEX idx_flags_created_at ON flags(created_at DESC);
CREATE INDEX idx_flags_search_vector ON flags USING GIN(search_vector);
CREATE INDEX idx_flags_keywords ON flags USING GIN(keywords);
CREATE INDEX idx_flags_featured ON flags(is_featured) WHERE is_featured = TRUE;

-- Flag Variants (one flag → many variants)
CREATE TABLE flag_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL 
    CHECK (variant_type IN ('flat', 'waving', 'round', 'heart', 'icon', 'mockup', 'fx', 'animated')),
  variant_name VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  description TEXT,
  preview_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_flag_variant_type UNIQUE(flag_id, variant_type)
);

CREATE INDEX idx_flag_variants_flag_id ON flag_variants(flag_id);
CREATE INDEX idx_flag_variants_type ON flag_variants(variant_type);
CREATE INDEX idx_flag_variants_active ON flag_variants(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_flag_variants_default ON flag_variants(flag_id, is_default) WHERE is_default = TRUE;

-- Media Assets (one variant → many formats)
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES flag_variants(id) ON DELETE CASCADE,
  format_id UUID NOT NULL REFERENCES media_formats(id) ON DELETE RESTRICT,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,
  aspect_ratio DECIMAL(5, 2),
  dpi INTEGER,
  duration_seconds INTEGER,
  bitrate_kbps INTEGER,
  codec VARCHAR(50),
  quality_level VARCHAR(20),
  is_watermarked BOOLEAN DEFAULT FALSE,
  color_mode VARCHAR(20),
  has_transparency BOOLEAN DEFAULT FALSE,
  processing_status VARCHAR(20) DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  metadata JSONB,
  checksum VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT positive_file_size CHECK (file_size_bytes > 0),
  CONSTRAINT positive_dimensions CHECK (
    (width IS NULL OR width > 0) AND (height IS NULL OR height > 0)
  )
);

CREATE INDEX idx_media_assets_variant_id ON media_assets(variant_id);
CREATE INDEX idx_media_assets_format_id ON media_assets(format_id);
CREATE INDEX idx_media_assets_processing ON media_assets(processing_status) 
  WHERE processing_status IN ('pending', 'processing');
CREATE INDEX idx_media_assets_quality ON media_assets(variant_id, quality_level);
CREATE INDEX idx_media_assets_watermarked ON media_assets(is_watermarked);
CREATE INDEX idx_media_assets_metadata ON media_assets USING GIN(metadata);
CREATE INDEX idx_media_assets_checksum ON media_assets(checksum);

-- ============================================================================
-- RELATIONSHIP TABLES
-- ============================================================================

-- Flag Categories (many-to-many)
CREATE TABLE flag_categories (
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (flag_id, category_id)
);

CREATE INDEX idx_flag_categories_flag_id ON flag_categories(flag_id);
CREATE INDEX idx_flag_categories_category_id ON flag_categories(category_id);
CREATE INDEX idx_flag_categories_primary ON flag_categories(flag_id, is_primary) 
  WHERE is_primary = TRUE;

-- Flag Tags (many-to-many)
CREATE TABLE flag_tags (
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (flag_id, tag_id)
);

CREATE INDEX idx_flag_tags_flag_id ON flag_tags(flag_id);
CREATE INDEX idx_flag_tags_tag_id ON flag_tags(tag_id);

-- Prices (pricing per format)
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  format_id UUID NOT NULL REFERENCES media_formats(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  requires_subscription BOOLEAN DEFAULT TRUE,
  subscription_tier VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_flag_format_price UNIQUE(flag_id, format_id),
  CONSTRAINT positive_price CHECK (price_cents >= 0)
);

CREATE INDEX idx_prices_flag_id ON prices(flag_id);
CREATE INDEX idx_prices_format_id ON prices(format_id);
CREATE INDEX idx_prices_subscription_required ON prices(requires_subscription) 
  WHERE requires_subscription = TRUE;

-- Downloads (tracking)
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  download_type VARCHAR(20) NOT NULL 
    CHECK (download_type IN ('free', 'premium', 'watermarked', 'preview')),
  format_id UUID NOT NULL REFERENCES media_formats(id) ON DELETE RESTRICT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country_code VARCHAR(2),
  price_paid_cents INTEGER,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_media_asset_id ON downloads(media_asset_id);
CREATE INDEX idx_downloads_format_id ON downloads(format_id);
CREATE INDEX idx_downloads_type ON downloads(download_type);
CREATE INDEX idx_downloads_created_at ON downloads(created_at DESC);
CREATE INDEX idx_downloads_country ON downloads(country_code);
CREATE INDEX idx_downloads_subscription ON downloads(subscription_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_flags_updated_at BEFORE UPDATE ON flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flag_variants_updated_at BEFORE UPDATE ON flag_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Full-text search vector update
CREATE OR REPLACE FUNCTION flags_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.keywords, ARRAY[]::TEXT[]), ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flags_search_vector_trigger BEFORE INSERT OR UPDATE ON flags
  FOR EACH ROW EXECUTE FUNCTION flags_search_vector_update();

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

-- Update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flag_tag_usage_update
  AFTER INSERT OR DELETE ON flag_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Ensure only one default variant per flag
CREATE OR REPLACE FUNCTION ensure_single_default_variant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE flag_variants 
    SET is_default = FALSE 
    WHERE flag_id = NEW.flag_id AND id != NEW.id AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_default_variant_trigger
  BEFORE INSERT OR UPDATE ON flag_variants
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_variant();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, duration_days, price_cents, currency) VALUES
  ('Weekly Premium', 'weekly-premium', 7, 999, 'USD'),
  ('Monthly Premium', 'monthly-premium', 30, 2999, 'USD');

-- Insert default categories
INSERT INTO categories (name, slug, level, path, display_order) VALUES
  ('Country Flags', 'country-flags', 0, '/country-flags', 1),
  ('International Organizations', 'international-organizations', 0, '/international-organizations', 2),
  ('Coat of Arms', 'coat-of-arms', 0, '/coat-of-arms', 3),
  ('Emblems', 'emblems', 0, '/emblems', 4),
  ('Animated Flags', 'animated-flags', 0, '/animated-flags', 5);

-- Insert default media formats
INSERT INTO media_formats (format_code, format_name, mime_type, file_extension, format_category, supports_transparency, supports_animation) VALUES
  ('svg', 'Scalable Vector Graphics', 'image/svg+xml', '.svg', 'vector', TRUE, TRUE),
  ('eps', 'Encapsulated PostScript', 'application/postscript', '.eps', 'vector', TRUE, FALSE),
  ('png', 'Portable Network Graphics', 'image/png', '.png', 'raster', TRUE, TRUE),
  ('jpg', 'JPEG Image', 'image/jpeg', '.jpg', 'raster', FALSE, FALSE),
  ('tiff', 'Tagged Image File Format', 'image/tiff', '.tiff', 'raster', TRUE, FALSE),
  ('mp4', 'MPEG-4 Video', 'video/mp4', '.mp4', 'video', FALSE, TRUE),
  ('webm', 'WebM Video', 'video/webm', '.webm', 'video', TRUE, TRUE);
