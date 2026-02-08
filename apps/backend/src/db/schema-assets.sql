-- Enhanced Asset Schema for Multi-Format Support

-- Asset files table (stores all file variants)
CREATE TABLE asset_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  -- File identification
  format VARCHAR(20) NOT NULL,
  variant VARCHAR(50) NOT NULL, -- 'original', 'optimized', 'converted', 'preview', 'watermarked', etc.
  size VARCHAR(50), -- 'original', '1920x1280', '1080p', '480p', etc.
  quality INTEGER, -- For JPEG (75-100)
  
  -- File properties
  color_mode VARCHAR(20), -- 'rgb', 'cmyk', 'grayscale'
  transparency VARCHAR(20), -- 'transparent', 'opaque', 'mixed'
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  
  -- Dimensions
  width INTEGER,
  height INTEGER,
  dpi INTEGER, -- For print formats
  
  -- Video-specific
  duration_seconds INTEGER,
  bitrate_kbps INTEGER,
  codec VARCHAR(50),
  has_audio BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  CONSTRAINT unique_asset_file UNIQUE(asset_id, format, variant, size, quality)
);

CREATE INDEX idx_asset_files_asset_id ON asset_files(asset_id);
CREATE INDEX idx_asset_files_format ON asset_files(format);
CREATE INDEX idx_asset_files_variant ON asset_files(variant);

-- Update assets table with format metadata
ALTER TABLE assets ADD COLUMN IF NOT EXISTS primary_format VARCHAR(20);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS available_formats TEXT[];
ALTER TABLE assets ADD COLUMN IF NOT EXISTS color_mode VARCHAR(20);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS transparency VARCHAR(20);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS aspect_ratio DECIMAL(10, 4);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS has_transparent_version BOOLEAN DEFAULT FALSE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS has_opaque_version BOOLEAN DEFAULT FALSE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS available_resolutions TEXT[];
ALTER TABLE assets ADD COLUMN IF NOT EXISTS available_qualities INTEGER[];
ALTER TABLE assets ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT FALSE;

-- Processing queue for async asset processing
CREATE TABLE asset_processing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_file_id UUID REFERENCES asset_files(id) ON DELETE CASCADE,
  
  -- Processing details
  job_type VARCHAR(50) NOT NULL, -- 'preview', 'watermark', 'convert', 'optimize', 'resize'
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5, -- 1-10, lower is higher priority
  
  -- Processing parameters
  parameters JSONB,
  
  -- Progress tracking
  progress_percent INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

CREATE INDEX idx_asset_processing_queue_status ON asset_processing_queue(status);
CREATE INDEX idx_asset_processing_queue_priority ON asset_processing_queue(priority, created_at);
CREATE INDEX idx_asset_processing_queue_asset_id ON asset_processing_queue(asset_id);

-- Asset format statistics (for analytics)
CREATE TABLE asset_format_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  format VARCHAR(20) NOT NULL,
  variant VARCHAR(50) NOT NULL,
  
  -- Download statistics
  download_count INTEGER DEFAULT 0,
  total_bytes_downloaded BIGINT DEFAULT 0,
  
  -- Performance metrics
  avg_download_time_ms INTEGER,
  cache_hit_rate DECIMAL(5, 2),
  
  -- Timestamps
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_format_stats_asset_id ON asset_format_stats(asset_id);
CREATE INDEX idx_asset_format_stats_format ON asset_format_stats(format);
