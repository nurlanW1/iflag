// Countries Service - Manage countries and their flag files

import pool from '../db.js';
import { createHash } from 'crypto';

export interface Country {
  id: string;
  name: string;
  slug: string;
  name_alt: string[];
  iso_alpha_2: string | null;
  iso_alpha_3: string | null;
  iso_numeric: string | null;
  region: string | null;
  subregion: string | null;
  category: 'country' | 'autonomy' | 'organization' | 'historical';
  description: string | null;
  flag_emoji: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  display_order: number;
  flag_count: number;
  published_flag_count: number;
  keywords: string[];
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  archived_at: Date | null;
}

export interface CreateCountryData {
  name: string;
  slug?: string;
  name_alt?: string[];
  iso_alpha_2?: string;
  iso_alpha_3?: string;
  iso_numeric?: string;
  region?: string;
  subregion?: string;
  category?: 'country' | 'autonomy' | 'organization' | 'historical';
  description?: string;
  flag_emoji?: string;
  thumbnail_url?: string;
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  display_order?: number;
  keywords?: string[];
}

export interface UpdateCountryData extends Partial<CreateCountryData> {
  updated_by?: string;
}

export interface CountryFlagFile {
  id: string;
  country_id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  format: 'png' | 'svg' | 'jpg' | 'jpeg' | 'webp' | 'eps' | 'pdf';
  variant_name: string | null;
  ratio: string | null;
  width: number | null;
  height: number | null;
  aspect_ratio: number | null;
  dpi: number | null;
  premium_tier: 'free' | 'freemium' | 'paid';
  price_cents: number;
  watermark_enabled: boolean;
  tags: string[];
  metadata: Record<string, any> | null;
  status: 'draft' | 'published' | 'archived';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  thumbnail_url: string | null;
  checksum: string | null;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFlagFileData {
  country_id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  format: 'png' | 'svg' | 'jpg' | 'jpeg' | 'webp' | 'eps' | 'pdf';
  variant_name?: string;
  ratio?: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  dpi?: number;
  premium_tier?: 'free' | 'freemium' | 'paid';
  price_cents?: number;
  watermark_enabled?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  status?: 'draft' | 'published' | 'archived';
  uploaded_by: string;
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Get all countries with optional filters
export async function getCountries(filters: {
  search?: string;
  region?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: 'name' | 'created_at' | 'display_order';
} = {}): Promise<{ countries: Country[]; total: number; page: number; limit: number }> {
  const {
    search,
    region,
    category,
    status,
    page = 1,
    limit = 50,
    sort = 'name',
  } = filters;

  let query = 'SELECT * FROM countries WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND search_vector @@ plainto_tsquery('english', $${paramIndex})`;
    params.push(search);
    paramIndex++;
  }

  if (region) {
    query += ` AND region = $${paramIndex}`;
    params.push(region);
    paramIndex++;
  }

  if (category) {
    query += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (status) {
    query += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Add sorting
  const sortMap: Record<string, string> = {
    name: 'name ASC',
    created_at: 'created_at DESC',
    display_order: 'display_order ASC, name ASC',
  };
  query += ` ORDER BY ${sortMap[sort] || 'name ASC'}`;

  // Add pagination
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, (page - 1) * limit);

  const result = await pool.query(query, params);

  return {
    countries: result.rows.map(row => ({
      ...row,
      name_alt: row.name_alt || [],
      keywords: row.keywords || [],
    })),
    total,
    page,
    limit,
  };
}

// Get country by ID
export async function getCountryById(id: string): Promise<Country | null> {
  const result = await pool.query('SELECT * FROM countries WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ...row,
    name_alt: row.name_alt || [],
    keywords: row.keywords || [],
  };
}

// Get country by slug
export async function getCountryBySlug(slug: string): Promise<Country | null> {
  const result = await pool.query('SELECT * FROM countries WHERE slug = $1', [slug]);
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ...row,
    name_alt: row.name_alt || [],
    keywords: row.keywords || [],
  };
}

// Create new country
export async function createCountry(
  data: CreateCountryData,
  userId: string
): Promise<Country> {
  const slug = data.slug || generateSlug(data.name);

  // Check if slug already exists
  const existing = await pool.query('SELECT id FROM countries WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    throw new Error(`Country with slug "${slug}" already exists`);
  }

  // Check for duplicate ISO codes if provided
  if (data.iso_alpha_2) {
    const existingCode = await pool.query(
      'SELECT id FROM countries WHERE iso_alpha_2 = $1',
      [data.iso_alpha_2]
    );
    if (existingCode.rows.length > 0) {
      throw new Error(`Country with ISO alpha-2 code "${data.iso_alpha_2}" already exists`);
    }
  }

  if (data.iso_alpha_3) {
    const existingCode = await pool.query(
      'SELECT id FROM countries WHERE iso_alpha_3 = $1',
      [data.iso_alpha_3]
    );
    if (existingCode.rows.length > 0) {
      throw new Error(`Country with ISO alpha-3 code "${data.iso_alpha_3}" already exists`);
    }
  }

  const result = await pool.query(
    `INSERT INTO countries (
      name, slug, name_alt, iso_alpha_2, iso_alpha_3, iso_numeric,
      region, subregion, category, description, flag_emoji, thumbnail_url,
      status, is_featured, display_order, keywords, created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) RETURNING *`,
    [
      data.name,
      slug,
      data.name_alt || [],
      data.iso_alpha_2 || null,
      data.iso_alpha_3 || null,
      data.iso_numeric || null,
      data.region || null,
      data.subregion || null,
      data.category || 'country',
      data.description || null,
      data.flag_emoji || null,
      data.thumbnail_url || null,
      data.status || 'draft',
      data.is_featured || false,
      data.display_order || 0,
      data.keywords || [],
      userId,
    ]
  );

  const row = result.rows[0];
  return {
    ...row,
    name_alt: row.name_alt || [],
    keywords: row.keywords || [],
  };
}

// Update country
export async function updateCountry(
  id: string,
  data: UpdateCountryData,
  userId: string
): Promise<Country> {
  const country = await getCountryById(id);
  if (!country) {
    throw new Error('Country not found');
  }

  // Check slug uniqueness if changed
  if (data.slug && data.slug !== country.slug) {
    const existing = await pool.query('SELECT id FROM countries WHERE slug = $1 AND id != $2', [
      data.slug,
      id,
    ]);
    if (existing.rows.length > 0) {
      throw new Error(`Country with slug "${data.slug}" already exists`);
    }
  }

  // Check ISO code uniqueness if changed
  if (data.iso_alpha_2 && data.iso_alpha_2 !== country.iso_alpha_2) {
    const existing = await pool.query(
      'SELECT id FROM countries WHERE iso_alpha_2 = $1 AND id != $2',
      [data.iso_alpha_2, id]
    );
    if (existing.rows.length > 0) {
      throw new Error(`Country with ISO alpha-2 code "${data.iso_alpha_2}" already exists`);
    }
  }

  if (data.iso_alpha_3 && data.iso_alpha_3 !== country.iso_alpha_3) {
    const existing = await pool.query(
      'SELECT id FROM countries WHERE iso_alpha_3 = $1 AND id != $2',
      [data.iso_alpha_3, id]
    );
    if (existing.rows.length > 0) {
      throw new Error(`Country with ISO alpha-3 code "${data.iso_alpha_3}" already exists`);
    }
  }

  // Build update query dynamically
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(data.name);
  }
  if (data.slug !== undefined) {
    updates.push(`slug = $${paramIndex++}`);
    params.push(data.slug);
  }
  if (data.name_alt !== undefined) {
    updates.push(`name_alt = $${paramIndex++}`);
    params.push(data.name_alt);
  }
  if (data.iso_alpha_2 !== undefined) {
    updates.push(`iso_alpha_2 = $${paramIndex++}`);
    params.push(data.iso_alpha_2 || null);
  }
  if (data.iso_alpha_3 !== undefined) {
    updates.push(`iso_alpha_3 = $${paramIndex++}`);
    params.push(data.iso_alpha_3 || null);
  }
  if (data.iso_numeric !== undefined) {
    updates.push(`iso_numeric = $${paramIndex++}`);
    params.push(data.iso_numeric || null);
  }
  if (data.region !== undefined) {
    updates.push(`region = $${paramIndex++}`);
    params.push(data.region || null);
  }
  if (data.subregion !== undefined) {
    updates.push(`subregion = $${paramIndex++}`);
    params.push(data.subregion || null);
  }
  if (data.category !== undefined) {
    updates.push(`category = $${paramIndex++}`);
    params.push(data.category);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(data.description || null);
  }
  if (data.flag_emoji !== undefined) {
    updates.push(`flag_emoji = $${paramIndex++}`);
    params.push(data.flag_emoji || null);
  }
  if (data.thumbnail_url !== undefined) {
    updates.push(`thumbnail_url = $${paramIndex++}`);
    params.push(data.thumbnail_url || null);
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    params.push(data.status);
    if (data.status === 'published' && country.status !== 'published') {
      updates.push(`published_at = CURRENT_TIMESTAMP`);
    }
    if (data.status === 'archived' && country.status !== 'archived') {
      updates.push(`archived_at = CURRENT_TIMESTAMP`);
    }
  }
  if (data.is_featured !== undefined) {
    updates.push(`is_featured = $${paramIndex++}`);
    params.push(data.is_featured);
  }
  if (data.display_order !== undefined) {
    updates.push(`display_order = $${paramIndex++}`);
    params.push(data.display_order);
  }
  if (data.keywords !== undefined) {
    updates.push(`keywords = $${paramIndex++}`);
    params.push(data.keywords);
  }

  updates.push(`updated_by = $${paramIndex++}`);
  params.push(userId);

  if (updates.length === 1) {
    // Only updated_by, no actual changes
    return country;
  }

  params.push(id);
  const query = `UPDATE countries SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

  const result = await pool.query(query, params);
  const row = result.rows[0];
  return {
    ...row,
    name_alt: row.name_alt || [],
    keywords: row.keywords || [],
  };
}

// Delete country (soft delete)
export async function deleteCountry(id: string, userId: string): Promise<void> {
  const country = await getCountryById(id);
  if (!country) {
    throw new Error('Country not found');
  }

  await pool.query(
    `UPDATE countries 
     SET status = 'archived', archived_at = CURRENT_TIMESTAMP, updated_by = $1 
     WHERE id = $2`,
    [userId, id]
  );
}

// Restore archived country
export async function restoreCountry(id: string, userId: string): Promise<Country> {
  const country = await getCountryById(id);
  if (!country) {
    throw new Error('Country not found');
  }

  const result = await pool.query(
    `UPDATE countries 
     SET status = 'draft', archived_at = NULL, updated_by = $1 
     WHERE id = $2 
     RETURNING *`,
    [userId, id]
  );

  const row = result.rows[0];
  return {
    ...row,
    name_alt: row.name_alt || [],
    keywords: row.keywords || [],
  };
}

// Get flag files for a country
export async function getCountryFlagFiles(
  countryId: string,
  filters: {
    format?: string;
    variant_name?: string;
    status?: string;
    premium_tier?: string;
  } = {}
): Promise<CountryFlagFile[]> {
  let query = 'SELECT * FROM country_flag_files WHERE country_id = $1';
  const params: any[] = [countryId];
  let paramIndex = 2;

  if (filters.format) {
    query += ` AND format = $${paramIndex++}`;
    params.push(filters.format);
  }
  if (filters.variant_name) {
    query += ` AND variant_name = $${paramIndex++}`;
    params.push(filters.variant_name);
  }
  if (filters.status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters.premium_tier) {
    query += ` AND premium_tier = $${paramIndex++}`;
    params.push(filters.premium_tier);
  }

  query += ' ORDER BY variant_name, format, created_at DESC';

  const result = await pool.query(query, params);
  return result.rows.map(row => ({
    ...row,
    tags: row.tags || [],
    metadata: row.metadata || null,
  }));
}

// Create flag file
export async function createFlagFile(
  data: CreateFlagFileData
): Promise<CountryFlagFile> {
  // Check for duplicate: same country + variant + format + ratio
  if (data.variant_name && data.ratio) {
    const existing = await pool.query(
      `SELECT id FROM country_flag_files 
       WHERE country_id = $1 AND variant_name = $2 AND format = $3 AND ratio = $4`,
      [data.country_id, data.variant_name, data.format, data.ratio]
    );
    if (existing.rows.length > 0) {
      throw new Error(
        `Flag file with same variant (${data.variant_name}), format (${data.format}), and ratio (${data.ratio}) already exists for this country`
      );
    }
  }

  // Calculate checksum for deduplication
  const checksum = createHash('sha256')
    .update(`${data.country_id}-${data.file_name}-${data.file_size_bytes}`)
    .digest('hex');

  const result = await pool.query(
    `INSERT INTO country_flag_files (
      country_id, file_name, file_path, file_url, file_size_bytes, mime_type,
      format, variant_name, ratio, width, height, aspect_ratio, dpi,
      premium_tier, price_cents, watermark_enabled, tags, metadata,
      status, uploaded_by, checksum
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
    ) RETURNING *`,
    [
      data.country_id,
      data.file_name,
      data.file_path,
      data.file_url,
      data.file_size_bytes,
      data.mime_type,
      data.format,
      data.variant_name || null,
      data.ratio || null,
      data.width || null,
      data.height || null,
      data.aspect_ratio || null,
      data.dpi || null,
      data.premium_tier || 'free',
      data.price_cents || 0,
      data.watermark_enabled || false,
      data.tags || [],
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.status || 'draft',
      data.uploaded_by,
      checksum,
    ]
  );

  const row = result.rows[0];
  return {
    ...row,
    tags: row.tags || [],
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

// Update flag file
export async function updateFlagFile(
  id: string,
  updates: Partial<CreateFlagFileData>
): Promise<CountryFlagFile> {
  const updatesList: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (updates.variant_name !== undefined) {
    updatesList.push(`variant_name = $${paramIndex++}`);
    params.push(updates.variant_name || null);
  }
  if (updates.ratio !== undefined) {
    updatesList.push(`ratio = $${paramIndex++}`);
    params.push(updates.ratio || null);
  }
  if (updates.premium_tier !== undefined) {
    updatesList.push(`premium_tier = $${paramIndex++}`);
    params.push(updates.premium_tier);
  }
  if (updates.price_cents !== undefined) {
    updatesList.push(`price_cents = $${paramIndex++}`);
    params.push(updates.price_cents);
  }
  if (updates.watermark_enabled !== undefined) {
    updatesList.push(`watermark_enabled = $${paramIndex++}`);
    params.push(updates.watermark_enabled);
  }
  if (updates.tags !== undefined) {
    updatesList.push(`tags = $${paramIndex++}`);
    params.push(updates.tags);
  }
  if (updates.metadata !== undefined) {
    updatesList.push(`metadata = $${paramIndex++}`);
    params.push(updates.metadata ? JSON.stringify(updates.metadata) : null);
  }
  if (updates.status !== undefined) {
    updatesList.push(`status = $${paramIndex++}`);
    params.push(updates.status);
  }

  if (updatesList.length === 0) {
    // No updates, return existing
    const existing = await pool.query('SELECT * FROM country_flag_files WHERE id = $1', [id]);
    if (existing.rows.length === 0) throw new Error('Flag file not found');
    const row = existing.rows[0];
    return {
      ...row,
      tags: row.tags || [],
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  params.push(id);
  const query = `UPDATE country_flag_files SET ${updatesList.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

  const result = await pool.query(query, params);
  if (result.rows.length === 0) {
    throw new Error('Flag file not found');
  }

  const row = result.rows[0];
  return {
    ...row,
    tags: row.tags || [],
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

// Delete flag file
export async function deleteFlagFile(id: string): Promise<void> {
  const result = await pool.query('DELETE FROM country_flag_files WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    throw new Error('Flag file not found');
  }
}
