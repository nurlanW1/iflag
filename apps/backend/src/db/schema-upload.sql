-- Upload Pipeline Database Schema

-- Temporary upload files table
CREATE TABLE upload_temp_files (
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
  asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE INDEX idx_upload_temp_files_upload_id ON upload_temp_files(upload_id);
CREATE INDEX idx_upload_temp_files_status ON upload_temp_files(status);
CREATE INDEX idx_upload_temp_files_expires_at ON upload_temp_files(expires_at);

-- Upload sessions (for chunked uploads)
CREATE TABLE upload_sessions (
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

CREATE INDEX idx_upload_sessions_upload_id ON upload_sessions(upload_id);
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX idx_upload_sessions_expires_at ON upload_sessions(expires_at);

-- Quarantined files (virus detected)
CREATE TABLE quarantined_files (
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

CREATE INDEX idx_quarantined_files_upload_id ON quarantined_files(upload_id);
CREATE INDEX idx_quarantined_files_created_at ON quarantined_files(created_at);

-- Cleanup function for expired uploads
CREATE OR REPLACE FUNCTION cleanup_expired_uploads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired temp files
  DELETE FROM upload_temp_files
  WHERE expires_at < CURRENT_TIMESTAMP
    AND status NOT IN ('completed', 'quarantined');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete expired sessions
  DELETE FROM upload_sessions
  WHERE expires_at < CURRENT_TIMESTAMP
    AND status != 'completed';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
