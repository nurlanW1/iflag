import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireClerkAdminJson } from '@/lib/server/require-clerk-admin';
import { getDb } from '@/lib/server/db';

export const runtime = 'nodejs';
/** Allow larger vector/raster payloads on serverless hosts that support extended duration. */
export const maxDuration = 120;

const FORMATS = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'pdf', 'eps'] as const;
const PREMIUM = ['free', 'freemium', 'paid'] as const;
const COUNTRY_CATEGORIES = ['country', 'autonomy', 'organization', 'historical'] as const;

const bodySchema = z.object({
  country_name: z.string().min(1).max(255),
  country_slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
  region: z.string().max(120).optional().nullable(),
  /** Maps to `countries.category` enum when creating/finding country */
  category: z.enum(COUNTRY_CATEGORIES).default('country'),
  flag_title: z.string().min(1).max(100),
  format: z.enum(FORMATS),
  premium_tier: z.enum(PREMIUM),
  price_cents: z.coerce.number().int().min(0),
  tags: z.string().optional(),
  /** draft | published stored on country_flag_files.status */
  status: z.enum(['draft', 'published']).default('draft'),
});

async function resolveCountryId(
  pool: ReturnType<typeof getDb>,
  name: string,
  slug: string,
  region: string | null | undefined,
  category: string
): Promise<{ id: string; created: boolean }> {
  const found = await pool.query<{ id: string }>('SELECT id FROM countries WHERE lower(slug) = lower($1) LIMIT 1', [
    slug,
  ]);
  if (found.rows[0]?.id) {
    return { id: found.rows[0].id, created: false };
  }
  const ins = await pool.query<{ id: string }>(
    `INSERT INTO countries (name, slug, region, category, status)
     VALUES ($1, $2, $3, $4, 'draft')
     RETURNING id`,
    [name, slug.toLowerCase(), region?.trim() || null, category]
  );
  return { id: ins.rows[0]!.id, created: true };
}

function parseTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 50);
}

/**
 * Protected admin upload: Vercel Blob (public read) + `country_flag_files` row in Postgres.
 */
export async function POST(request: Request): Promise<Response> {
  const gate = await requireClerkAdminJson();
  if (!gate.ok) return gate.response;

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN is not configured.', code: 'config' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data.', code: 'bad_request' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof Blob) || typeof (file as File).name !== 'string') {
    return NextResponse.json({ error: 'Missing file.', code: 'validation' }, { status: 400 });
  }

  const fields = bodySchema.safeParse({
    country_name: String(formData.get('country_name') ?? ''),
    country_slug: String(formData.get('country_slug') ?? ''),
    region: formData.get('region') ? String(formData.get('region')) : '',
    category: String(formData.get('category') ?? 'country'),
    flag_title: String(formData.get('flag_title') ?? ''),
    format: String(formData.get('format') ?? ''),
    premium_tier: String(formData.get('premium_tier') ?? ''),
    price_cents: formData.get('price_cents') ?? '0',
    tags: formData.get('tags') ? String(formData.get('tags')) : undefined,
    status: String(formData.get('status') ?? 'draft'),
  });

  if (!fields.success) {
    return NextResponse.json(
      { error: 'Validation failed.', code: 'validation', details: fields.error.flatten() },
      { status: 400 }
    );
  }

  const v = fields.data;
  const mime = file.type?.trim() || 'application/octet-stream';
  const size = typeof (file as File).size === 'number' ? (file as File).size : NaN;

  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: 'Invalid file size.', code: 'validation' }, { status: 400 });
  }

  /** Basic MIME alignment with declared format */
  const ext = v.format === 'jpeg' ? 'jpeg' : v.format;

  try {
    const pool = getDb();

    const { id: countryId, created } = await resolveCountryId(
      pool,
      v.country_name.trim(),
      v.country_slug.trim(),
      v.region ?? null,
      v.category
    );

    const safeBase = `${v.country_slug.toLowerCase()}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const objectName = `flags/${safeBase}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await put(objectName, buffer, {
      access: 'public',
      token,
      contentType: mime,
    });

    const tagsArr = parseTags(v.tags);

    const metadataPayload = JSON.stringify({
      region: v.region ?? null,
      blob_pathname: uploaded.pathname,
      country_created_stub: created,
    });

    /** `variant_name`: flag display name per unique constraint */
    const ins = await pool.query<{
      id: string;
      file_url: string;
      file_name: string;
      created_at: string;
      status: string;
    }>(
      `INSERT INTO country_flag_files (
        country_id, file_name, file_path, file_url, file_size_bytes, mime_type,
        format, variant_name, ratio, premium_tier, price_cents, tags, metadata, status,
        processing_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, NULL, $9, $10, $11, $12::jsonb, $13,
        'completed'
      )
      RETURNING id, file_url, file_name, created_at, status`,
      [
        countryId,
        v.flag_title.trim(),
        uploaded.pathname,
        uploaded.url,
        size,
        mime,
        v.format,
        v.flag_title.trim(),
        v.premium_tier,
        v.price_cents,
        tagsArr,
        metadataPayload,
        v.status,
      ]
    );

    const row = ins.rows[0];
    return NextResponse.json({
      ok: true,
      file: row,
      country_id: countryId,
      blob_url: uploaded.url,
      country_created_stub: created,
    });
  } catch (err: unknown) {
    console.error('[admin/flag-files/upload]', err);

    /** Postgres unique_country_variant_format */
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';
    if (code === '23505') {
      return NextResponse.json(
        {
          error:
            'A flag file already exists for this country with the same title, format, and ratio. Change the flag title or format.',
          code: 'duplicate',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Upload failed', code: 'server_error' }, { status: 500 });
  }
}
