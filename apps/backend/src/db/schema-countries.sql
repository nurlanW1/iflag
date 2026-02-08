-- Countries Management Table
-- This table stores country information for organizing flag assets

CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name_alt TEXT[], -- Alternative names (e.g., ["United States", "USA", "US"])
  
  -- ISO Codes
  iso_alpha_2 VARCHAR(2) UNIQUE, -- ISO 3166-1 alpha-2 (e.g., 'US')
  iso_alpha_3 VARCHAR(3) UNIQUE, -- ISO 3166-1 alpha-3 (e.g., 'USA')
  iso_numeric VARCHAR(3), -- ISO 3166-1 numeric (e.g., '840')
  
  -- Classification
  region VARCHAR(100), -- e.g., 'Europe', 'Asia', 'Africa', 'Americas', 'Oceania'
  subregion VARCHAR(100), -- e.g., 'Western Europe', 'South Asia'
  category VARCHAR(50) DEFAULT 'country' 
    CHECK (category IN ('country', 'autonomy', 'organization', 'historical')),
  
  -- Metadata
  description TEXT,
  flag_emoji VARCHAR(10), -- Unicode flag emoji
  thumbnail_url TEXT, -- URL to thumbnail image
  
  -- Status & Control
  status VARCHAR(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- Statistics (denormalized for performance)
  flag_count INTEGER DEFAULT 0, -- Total number of flag assets
  published_flag_count INTEGER DEFAULT 0, -- Published flag assets
  
  -- SEO
  keywords TEXT[],
  search_vector tsvector, -- Full-text search vector
  
  -- Admin Tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_countries_slug ON countries(slug);
CREATE INDEX IF NOT EXISTS idx_countries_iso_alpha_2 ON countries(iso_alpha_2);
CREATE INDEX IF NOT EXISTS idx_countries_iso_alpha_3 ON countries(iso_alpha_3);
CREATE INDEX IF NOT EXISTS idx_countries_status ON countries(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);
CREATE INDEX IF NOT EXISTS idx_countries_category ON countries(category);
CREATE INDEX IF NOT EXISTS idx_countries_display_order ON countries(display_order);
CREATE INDEX IF NOT EXISTS idx_countries_search_vector ON countries USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_countries_keywords ON countries USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_countries_created_at ON countries(created_at DESC);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION countries_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.name_alt, ARRAY[]::TEXT[]), ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.keywords, ARRAY[]::TEXT[]), ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER countries_search_vector_trigger 
  BEFORE INSERT OR UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION countries_search_vector_update();

-- Update updated_at trigger
CREATE TRIGGER update_countries_updated_at 
  BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Country Flag Files Table
-- Stores individual flag files (variants/formats) for each country
CREATE TABLE IF NOT EXISTS country_flag_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  
  -- File Information
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Format & Variant
  format VARCHAR(20) NOT NULL CHECK (format IN ('png', 'svg', 'jpg', 'jpeg', 'webp', 'eps', 'pdf')),
  variant_name VARCHAR(100), -- e.g., 'flat', 'waving', 'round', 'square', 'vertical', 'banner'
  ratio VARCHAR(20), -- e.g., '1:1', '3:2', '16:9', '4:3', '21:9'
  
  -- Dimensions (for raster images)
  width INTEGER,
  height INTEGER,
  aspect_ratio DECIMAL(5, 2),
  dpi INTEGER,
  
  -- Pricing & Access
  premium_tier VARCHAR(20) DEFAULT 'free' 
    CHECK (premium_tier IN ('free', 'freemium', 'paid')),
  price_cents INTEGER DEFAULT 0, -- Price if paid (0 = included in subscription)
  watermark_enabled BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  tags TEXT[],
  metadata JSONB, -- Additional metadata (color_mode, has_transparency, etc.)
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Processing
  processing_status VARCHAR(20) DEFAULT 'completed' 
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  thumbnail_url TEXT, -- Generated thumbnail URL
  checksum VARCHAR(64), -- File checksum for deduplication
  
  -- Admin Tracking
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT positive_file_size CHECK (file_size_bytes > 0),
  CONSTRAINT positive_dimensions CHECK (
    (width IS NULL OR width > 0) AND (height IS NULL OR height > 0)
  ),
  CONSTRAINT unique_country_variant_format UNIQUE(country_id, variant_name, format, ratio)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_country_flag_files_country_id ON country_flag_files(country_id);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_format ON country_flag_files(format);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_variant ON country_flag_files(variant_name);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_status ON country_flag_files(status);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_premium_tier ON country_flag_files(premium_tier);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_tags ON country_flag_files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_metadata ON country_flag_files USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_checksum ON country_flag_files(checksum);

-- Update updated_at trigger
CREATE TRIGGER update_country_flag_files_updated_at 
  BEFORE UPDATE ON country_flag_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update country flag counts
CREATE OR REPLACE FUNCTION update_country_flag_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE countries 
    SET flag_count = flag_count + 1,
        published_flag_count = published_flag_count + CASE WHEN NEW.status = 'published' THEN 1 ELSE 0 END
    WHERE id = NEW.country_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != NEW.status THEN
      UPDATE countries 
      SET published_flag_count = published_flag_count + 
        CASE 
          WHEN NEW.status = 'published' AND OLD.status != 'published' THEN 1
          WHEN NEW.status != 'published' AND OLD.status = 'published' THEN -1
          ELSE 0
        END
      WHERE id = NEW.country_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE countries 
    SET flag_count = GREATEST(0, flag_count - 1),
        published_flag_count = GREATEST(0, published_flag_count - CASE WHEN OLD.status = 'published' THEN 1 ELSE 0 END)
    WHERE id = OLD.country_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER country_flag_count_update
  AFTER INSERT OR UPDATE OR DELETE ON country_flag_files
  FOR EACH ROW EXECUTE FUNCTION update_country_flag_count();
