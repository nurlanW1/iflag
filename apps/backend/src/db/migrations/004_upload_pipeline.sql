-- =============================================================================
-- Upload pipeline tables (chunked upload + processing queue + quarantine)
-- Safe to apply on top of existing schema (idempotent IF NOT EXISTS).
--
-- Adapted from src/db/schema-upload.sql + schema-assets.sql so the chunked
-- upload routes work out of the box. FKs to media_assets are omitted because
-- that table lives in the schema-v2 data model which is optional.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Temporary upload tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS upload_temp_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_id VARCHAR(64) UNIQUE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  format_code VARCHAR(20) NOT NULL,
  temp_path TEXT NOT NULL,
  checksum VARCHAR(64),
  metadata JSONB,
  extracted_metadata JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'validating', 'scanning', 'processing', 'completed', 'failed', 'quarantined')),
  processing_error TEXT,
  asset_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_upload_temp_files_upload_id ON upload_temp_files (upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_temp_files_status ON upload_temp_files (status);
CREATE INDEX IF NOT EXISTS idx_upload_temp_files_expires_at ON upload_temp_files (expires_at);

-- -----------------------------------------------------------------------------
-- Chunked upload sessions (used when a single transfer is split into chunks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_id VARCHAR(64) UNIQUE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  total_chunks INTEGER NOT NULL,
  chunks_received INTEGER DEFAULT 0,
  temp_path TEXT NOT NULL,
  metadata JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploading', 'completed', 'failed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_upload_id ON upload_sessions (upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions (status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires_at ON upload_sessions (expires_at);

-- -----------------------------------------------------------------------------
-- Quarantined files (virus scanner output)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quarantined_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_path TEXT NOT NULL,
  quarantine_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  detected_viruses TEXT[],
  upload_id VARCHAR(64),
  admin_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quarantined_files_upload_id ON quarantined_files (upload_id);
CREATE INDEX IF NOT EXISTS idx_quarantined_files_created_at ON quarantined_files (created_at);

-- -----------------------------------------------------------------------------
-- Asset processing queue (referenced by upload pipeline + admin bulk upload)
-- Mirrors the columns used by src/assets/processing-queue.service.ts.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_processing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID,
  asset_file_id UUID,
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER NOT NULL DEFAULT 5,
  parameters JSONB DEFAULT '{}'::jsonb,
  progress_percent INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3
);

CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON asset_processing_queue (status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_priority ON asset_processing_queue (priority, created_at);
CREATE INDEX IF NOT EXISTS idx_processing_queue_asset_id ON asset_processing_queue (asset_id);

-- -----------------------------------------------------------------------------
-- Asset files (per-format variants generated by the pipeline)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL,
  format VARCHAR(20) NOT NULL,
  variant VARCHAR(50) NOT NULL DEFAULT 'original',
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  checksum VARCHAR(64),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_files_asset_id ON asset_files (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_files_format ON asset_files (format);
CREATE INDEX IF NOT EXISTS idx_asset_files_variant ON asset_files (variant);

-- Trigger for updated_at (function defined in baseline schema.sql)
DROP TRIGGER IF EXISTS update_asset_files_updated_at ON asset_files;
CREATE TRIGGER update_asset_files_updated_at BEFORE UPDATE ON asset_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_upload_temp_files_updated_at ON upload_temp_files;
CREATE TRIGGER update_upload_temp_files_updated_at BEFORE UPDATE ON upload_temp_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
