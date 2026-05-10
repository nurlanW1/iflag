-- =============================================================================
-- Neon / Postgres safe migration: countries + country_flag_files
-- Matches apps/frontend admin upload + gallery-from-db + backend countries.service
--
-- SAFE: CREATE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS — does NOT DROP data.
--
-- HOW TO RUN IN NEON:
-- 1. Open Neon Dashboard → your project → SQL Editor.
-- 2. Paste this entire file → Run (or split by sections if the editor limits size).
-- 3. Retry admin upload; if a constraint fails (e.g. duplicate rows vs UNIQUE),
--    clean conflicting rows or ask for a follow-up migration.
--
-- PostgreSQL 11+ (triggers use EXECUTE PROCEDURE for broad Neon compatibility).

-- -----------------------------------------------------------------------------
-- 1) Extensions (uuid + optional crypto helpers)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 2) updated_at helper (required by triggers below)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 3) countries — create if missing (no FK to users: works on minimal Neon DBs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  name_alt TEXT[],

  iso_alpha_2 VARCHAR(2),
  iso_alpha_3 VARCHAR(3),
  iso_numeric VARCHAR(3),

  region VARCHAR(100),
  subregion VARCHAR(100),
  category VARCHAR(50) DEFAULT 'country'
    CHECK (category IN ('country', 'autonomy', 'organization', 'historical')),

  description TEXT,
  flag_emoji VARCHAR(10),
  thumbnail_url TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,

  flag_count INTEGER DEFAULT 0,
  published_flag_count INTEGER DEFAULT 0,

  keywords TEXT[],
  search_vector tsvector,

  -- Clerk / legacy app user ids without requiring a users table
  created_by UUID,
  updated_by UUID,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Unique slug (idempotent; fails only if duplicate slug values already exist — clean data first)
CREATE UNIQUE INDEX IF NOT EXISTS uq_countries_slug ON countries (slug);

-- -----------------------------------------------------------------------------
-- 4) countries — additive columns for older / partial schemas
-- -----------------------------------------------------------------------------
ALTER TABLE countries ADD COLUMN IF NOT EXISTS name_alt TEXT[];
ALTER TABLE countries ADD COLUMN IF NOT EXISTS iso_alpha_2 VARCHAR(2);
ALTER TABLE countries ADD COLUMN IF NOT EXISTS iso_alpha_3 VARCHAR(3);
ALTER TABLE countries ADD COLUMN IF NOT EXISTS iso_numeric VARCHAR(3);
ALTER TABLE countries ADD COLUMN IF NOT EXISTS subregion VARCHAR(100);
ALTER TABLE countries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS flag_emoji VARCHAR(10);
ALTER TABLE countries ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS published_flag_count INTEGER DEFAULT 0;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE countries ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- 5) country_flag_files — create if missing
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS country_flag_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,

  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,

  format VARCHAR(20) NOT NULL
    CHECK (format IN ('png', 'svg', 'jpg', 'jpeg', 'webp', 'eps', 'pdf')),
  variant_name VARCHAR(100),
  ratio VARCHAR(20),

  width INTEGER,
  height INTEGER,
  aspect_ratio DECIMAL(5, 2),
  dpi INTEGER,

  premium_tier VARCHAR(20) DEFAULT 'free'
    CHECK (premium_tier IN ('free', 'freemium', 'paid')),
  price_cents INTEGER DEFAULT 0,
  watermark_enabled BOOLEAN DEFAULT FALSE,

  tags TEXT[],
  metadata JSONB,

  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  processing_status VARCHAR(20) DEFAULT 'completed'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),

  thumbnail_url TEXT,
  checksum VARCHAR(64),

  uploaded_by UUID,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT positive_file_size CHECK (file_size_bytes > 0),
  CONSTRAINT positive_dimensions CHECK (
    (width IS NULL OR width > 0) AND (height IS NULL OR height > 0)
  )
);

-- -----------------------------------------------------------------------------
-- 6) country_flag_files — additive columns (fixes common 42703 errors)
-- -----------------------------------------------------------------------------
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS country_id UUID;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS format VARCHAR(20);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS premium_tier VARCHAR(20);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS ratio VARCHAR(20);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS aspect_ratio DECIMAL(5, 2);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS dpi INTEGER;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'completed';
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS checksum VARCHAR(64);
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS uploaded_by UUID;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE country_flag_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
-- Skip destructive updates; only set defaults where column was just added as nullable.

-- FK country_id → countries (if table was created without FK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'country_flag_files_country_id_fkey'
  ) THEN
    ALTER TABLE country_flag_files
      ADD CONSTRAINT country_flag_files_country_id_fkey
      FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'Could not add FK country_flag_files.country_id — verify child/parent rows.';
END $$;

-- Unique (country_id, variant_name, format, ratio) — admin duplicate protection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_country_variant_format'
  ) THEN
    ALTER TABLE country_flag_files
      ADD CONSTRAINT unique_country_variant_format
      UNIQUE (country_id, variant_name, format, ratio);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN unique_violation THEN
    RAISE NOTICE 'Could not add unique_country_variant_format — remove duplicate rows first.';
END $$;

-- -----------------------------------------------------------------------------
-- 7) Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_countries_iso_alpha_2 ON countries(iso_alpha_2);
CREATE INDEX IF NOT EXISTS idx_countries_iso_alpha_3 ON countries(iso_alpha_3);
CREATE INDEX IF NOT EXISTS idx_countries_status ON countries(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);
CREATE INDEX IF NOT EXISTS idx_countries_category ON countries(category);
CREATE INDEX IF NOT EXISTS idx_countries_display_order ON countries(display_order);
CREATE INDEX IF NOT EXISTS idx_countries_search_vector ON countries USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_countries_keywords ON countries USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_countries_created_at ON countries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_country_flag_files_country_id ON country_flag_files(country_id);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_format ON country_flag_files(format);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_variant ON country_flag_files(variant_name);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_status ON country_flag_files(status);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_premium_tier ON country_flag_files(premium_tier);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_tags ON country_flag_files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_metadata ON country_flag_files USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_country_flag_files_checksum ON country_flag_files(checksum);

-- -----------------------------------------------------------------------------
-- 8) Search vector trigger (countries)
-- -----------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS countries_search_vector_trigger ON countries;
CREATE TRIGGER countries_search_vector_trigger
  BEFORE INSERT OR UPDATE ON countries
  FOR EACH ROW
  EXECUTE PROCEDURE countries_search_vector_update();

DROP TRIGGER IF EXISTS update_countries_updated_at ON countries;
CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 9) Flag count denormalization trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_country_flag_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE countries
    SET flag_count = COALESCE(flag_count, 0) + 1,
        published_flag_count = COALESCE(published_flag_count, 0) + CASE WHEN NEW.status = 'published' THEN 1 ELSE 0 END
    WHERE id = NEW.country_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      UPDATE countries
      SET published_flag_count = COALESCE(published_flag_count, 0) +
        CASE
          WHEN NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN 1
          WHEN NEW.status IS DISTINCT FROM 'published' AND OLD.status = 'published' THEN -1
          ELSE 0
        END
      WHERE id = NEW.country_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE countries
    SET flag_count = GREATEST(0, COALESCE(flag_count, 0) - 1),
        published_flag_count = GREATEST(0, COALESCE(published_flag_count, 0) - CASE WHEN OLD.status = 'published' THEN 1 ELSE 0 END)
    WHERE id = OLD.country_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS country_flag_count_update ON country_flag_files;
CREATE TRIGGER country_flag_count_update
  AFTER INSERT OR UPDATE OR DELETE ON country_flag_files
  FOR EACH ROW
  EXECUTE PROCEDURE update_country_flag_count();

DROP TRIGGER IF EXISTS update_country_flag_files_updated_at ON country_flag_files;
CREATE TRIGGER update_country_flag_files_updated_at
  BEFORE UPDATE ON country_flag_files
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Done.
