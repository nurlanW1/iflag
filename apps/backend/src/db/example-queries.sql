-- Example Queries for Flag Stock Marketplace
-- Demonstrates common query patterns and optimizations

-- ============================================================================
-- FLAG RETRIEVAL QUERIES
-- ============================================================================

-- Get complete flag with all variants and formats
-- This is the most common query pattern
SELECT 
  f.id as flag_id,
  f.title,
  f.slug,
  f.description,
  f.country_code,
  f.status,
  fv.id as variant_id,
  fv.variant_type,
  fv.variant_name,
  fv.is_default,
  ma.id as asset_id,
  mf.format_code,
  mf.format_name,
  mf.format_category,
  ma.file_url,
  ma.file_size_bytes,
  ma.width,
  ma.height,
  ma.quality_level,
  ma.is_watermarked,
  p.price_cents,
  p.requires_subscription
FROM flags f
JOIN flag_variants fv ON f.id = fv.flag_id AND fv.is_active = TRUE
JOIN media_assets ma ON fv.id = ma.variant_id AND ma.processing_status = 'completed'
JOIN media_formats mf ON ma.format_id = mf.id AND mf.is_active = TRUE
LEFT JOIN prices p ON f.id = p.flag_id AND mf.id = p.format_id AND p.is_active = TRUE
WHERE f.slug = 'united-states-flag'
  AND f.status = 'published'
ORDER BY 
  fv.is_default DESC,
  fv.display_order,
  mf.format_category,
  mf.format_code;

-- Get flags by category with pagination
SELECT 
  f.id,
  f.title,
  f.slug,
  f.description,
  fv.preview_url,
  COUNT(DISTINCT d.id) as download_count
FROM flags f
JOIN flag_categories fc ON f.id = fc.flag_id
JOIN categories c ON fc.category_id = c.id
LEFT JOIN flag_variants fv ON f.id = fv.flag_id AND fv.is_default = TRUE
LEFT JOIN media_assets ma ON fv.id = ma.variant_id
LEFT JOIN downloads d ON ma.id = d.media_asset_id
WHERE c.slug = 'country-flags'
  AND f.status = 'published'
GROUP BY f.id, f.title, f.slug, f.description, fv.preview_url
ORDER BY download_count DESC, f.created_at DESC
LIMIT 20 OFFSET 0;

-- Search flags with full-text search
SELECT 
  f.id,
  f.title,
  f.slug,
  f.description,
  ts_rank(f.search_vector, plainto_tsquery('english', $1)) as rank
FROM flags f
WHERE f.status = 'published'
  AND f.search_vector @@ plainto_tsquery('english', $1)
ORDER BY rank DESC, f.created_at DESC
LIMIT 20;

-- ============================================================================
-- USER ACCESS & PERMISSIONS
-- ============================================================================

-- Check if user can download a specific format
-- Returns access level: 'free', 'premium', 'watermarked', or 'denied'
WITH user_subscription AS (
  SELECT 
    s.id,
    s.status,
    s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = $1
    AND s.status = 'active'
    AND s.current_period_end > CURRENT_TIMESTAMP
  LIMIT 1
)
SELECT 
  ma.id,
  ma.file_url,
  mf.format_code,
  p.requires_subscription,
  CASE 
    WHEN p.requires_subscription = FALSE THEN 'free'
    WHEN EXISTS (SELECT 1 FROM user_subscription) THEN 'premium'
    WHEN ma.is_watermarked = TRUE THEN 'watermarked'
    ELSE 'denied'
  END as access_level,
  CASE 
    WHEN p.requires_subscription = FALSE THEN ma.file_url
    WHEN EXISTS (SELECT 1 FROM user_subscription) THEN ma.file_url
    WHEN ma.is_watermarked = TRUE THEN ma.file_url
    ELSE NULL
  END as download_url
FROM media_assets ma
JOIN flag_variants fv ON ma.variant_id = fv.id
JOIN flags f ON fv.flag_id = f.id
JOIN media_formats mf ON ma.format_id = mf.id
LEFT JOIN prices p ON f.id = p.flag_id AND mf.id = p.format_id
WHERE ma.id = $2
  AND f.status = 'published'
  AND ma.processing_status = 'completed';

-- Get user's download history
SELECT 
  d.id,
  d.created_at,
  f.title as flag_title,
  fv.variant_type,
  mf.format_code,
  d.download_type,
  d.price_paid_cents
FROM downloads d
JOIN media_assets ma ON d.media_asset_id = ma.id
JOIN flag_variants fv ON ma.variant_id = fv.id
JOIN flags f ON fv.flag_id = f.id
JOIN media_formats mf ON d.format_id = mf.id
WHERE d.user_id = $1
ORDER BY d.created_at DESC
LIMIT 50;

-- ============================================================================
-- ADMIN QUERIES
-- ============================================================================

-- Get flag with all relationships for admin edit
SELECT 
  f.*,
  json_agg(DISTINCT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'slug', c.slug,
    'is_primary', fc.is_primary
  )) FILTER (WHERE c.id IS NOT NULL) as categories,
  json_agg(DISTINCT jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug
  )) FILTER (WHERE t.id IS NOT NULL) as tags,
  json_agg(DISTINCT jsonb_build_object(
    'id', fv.id,
    'variant_type', fv.variant_type,
    'variant_name', fv.variant_name,
    'is_default', fv.is_default,
    'is_active', fv.is_active,
    'assets', (
      SELECT json_agg(jsonb_build_object(
        'id', ma.id,
        'format_code', mf.format_code,
        'file_url', ma.file_url,
        'quality_level', ma.quality_level,
        'processing_status', ma.processing_status
      ))
      FROM media_assets ma
      JOIN media_formats mf ON ma.format_id = mf.id
      WHERE ma.variant_id = fv.id
    )
  )) FILTER (WHERE fv.id IS NOT NULL) as variants
FROM flags f
LEFT JOIN flag_categories fc ON f.id = fc.flag_id
LEFT JOIN categories c ON fc.category_id = c.id
LEFT JOIN flag_tags ft ON f.id = ft.flag_id
LEFT JOIN tags t ON ft.tag_id = t.id
LEFT JOIN flag_variants fv ON f.id = fv.flag_id
WHERE f.id = $1
GROUP BY f.id;

-- Get processing queue (pending/processing assets)
SELECT 
  ma.id,
  ma.file_name,
  ma.processing_status,
  ma.processing_error,
  f.title as flag_title,
  fv.variant_type,
  mf.format_code,
  ma.created_at,
  ma.updated_at
FROM media_assets ma
JOIN flag_variants fv ON ma.variant_id = fv.id
JOIN flags f ON fv.flag_id = f.id
JOIN media_formats mf ON ma.format_id = mf.id
WHERE ma.processing_status IN ('pending', 'processing')
ORDER BY ma.created_at ASC
LIMIT 100;

-- ============================================================================
-- ANALYTICS QUERIES
-- ============================================================================

-- Popular flags (by downloads in last 30 days)
SELECT 
  f.id,
  f.title,
  f.slug,
  COUNT(DISTINCT d.id) as download_count,
  COUNT(DISTINCT d.user_id) as unique_downloaders,
  SUM(CASE WHEN d.download_type = 'premium' THEN 1 ELSE 0 END) as premium_downloads,
  SUM(d.price_paid_cents) as revenue_cents
FROM flags f
JOIN flag_variants fv ON f.id = fv.flag_id
JOIN media_assets ma ON fv.id = ma.variant_id
JOIN downloads d ON ma.id = d.media_asset_id
WHERE f.status = 'published'
  AND d.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY f.id, f.title, f.slug
ORDER BY download_count DESC
LIMIT 20;

-- Format popularity
SELECT 
  mf.format_code,
  mf.format_name,
  COUNT(DISTINCT d.id) as download_count,
  COUNT(DISTINCT d.user_id) as unique_users,
  SUM(d.price_paid_cents) as revenue_cents
FROM downloads d
JOIN media_formats mf ON d.format_id = mf.id
WHERE d.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY mf.id, mf.format_code, mf.format_name
ORDER BY download_count DESC;

-- Variant popularity
SELECT 
  fv.variant_type,
  COUNT(DISTINCT d.id) as download_count,
  COUNT(DISTINCT fv.flag_id) as flag_count
FROM flag_variants fv
JOIN media_assets ma ON fv.id = ma.variant_id
JOIN downloads d ON ma.id = d.media_asset_id
WHERE d.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY fv.variant_type
ORDER BY download_count DESC;

-- Revenue by subscription plan
SELECT 
  sp.name as plan_name,
  COUNT(DISTINCT s.id) as total_subscriptions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions,
  SUM(sp.price_cents) FILTER (WHERE s.status = 'active') as monthly_revenue_cents,
  COUNT(DISTINCT d.id) as downloads_count
FROM subscription_plans sp
LEFT JOIN subscriptions s ON sp.id = s.plan_id
LEFT JOIN downloads d ON s.id = d.subscription_id
GROUP BY sp.id, sp.name
ORDER BY sp.duration_days;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Find orphaned media assets (variant deleted but assets remain)
SELECT ma.id, ma.file_name, ma.variant_id
FROM media_assets ma
LEFT JOIN flag_variants fv ON ma.variant_id = fv.id
WHERE fv.id IS NULL;

-- Find flags without variants
SELECT f.id, f.title, f.slug
FROM flags f
LEFT JOIN flag_variants fv ON f.id = fv.flag_id
WHERE fv.id IS NULL;

-- Find media assets stuck in processing
SELECT ma.id, ma.file_name, ma.processing_status, ma.created_at
FROM media_assets ma
WHERE ma.processing_status IN ('pending', 'processing')
  AND ma.created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- Update category asset counts (maintenance)
UPDATE categories c
SET asset_count = (
  SELECT COUNT(DISTINCT fc.flag_id)
  FROM flag_categories fc
  WHERE fc.category_id = c.id
);

-- Update tag usage counts (maintenance)
UPDATE tags t
SET usage_count = (
  SELECT COUNT(*)
  FROM flag_tags ft
  WHERE ft.tag_id = t.id
);

-- ============================================================================
-- PERFORMANCE TESTING QUERIES
-- ============================================================================

-- Explain analyze for flag retrieval
EXPLAIN ANALYZE
SELECT f.*, fv.*, ma.*, mf.*
FROM flags f
JOIN flag_variants fv ON f.id = fv.flag_id
JOIN media_assets ma ON fv.id = ma.variant_id
JOIN media_formats mf ON ma.format_id = mf.id
WHERE f.status = 'published'
  AND f.country_code = 'USA'
LIMIT 20;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
