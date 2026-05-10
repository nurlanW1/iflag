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
  /** `countries.region` is VARCHAR(100) in Postgres — keep in sync */
  region: z.string().max(100).optional().nullable(),
  /** Maps to `countries.category` enum when creating/finding country */
  category: z.enum(COUNTRY_CATEGORIES).default('country'),
  flag_title: z.string().min(1).max(100),
  format: z.enum(FORMATS),
  premium_tier: z.enum(PREMIUM),
  price_cents: z.coerce.number().int().min(0),
  tags: z.string().optional(),
  /** draft | published stored on country_flag_files.status */
  status: z.enum(['draft', 'published']).default('published'),
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
function isPgLikeError(err: unknown): err is { code?: string; message?: string } {
  return typeof err === 'object' && err !== null && ('code' in err || 'message' in err);
}

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

  if (!process.env.DATABASE_URL?.trim()) {
    console.error('[admin/flag-files/upload] DATABASE_URL is not set');
    return NextResponse.json(
      { error: 'Database is not configured on the server.', code: 'config' },
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
    status: String(formData.get('status') ?? 'published'),
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

    /** Postgres numeric error codes (`pg` errors and some Node errors) */
    const pgCode = isPgLikeError(err) && err.code ? String(err.code) : '';
    const pgMessage =
      process.env.NODE_ENV !== 'production' && isPgLikeError(err) && err.message
        ? String(err.message)
        : undefined;

    if (pgCode === '23505') {
      return NextResponse.json(
        {
          error:
            'A flag file already exists for this country with the same title, format, and ratio. Change the flag title or format.',
          code: 'duplicate',
        },
        { status: 409 }
      );
    }

    if (pgCode === '22001' || pgCode === '22003') {
      return NextResponse.json(
        {
          error: 'A field exceeds the maximum length allowed by the database. Shorten region or titles.',
          code: 'validation',
          ...(pgMessage ? { detail: pgMessage } : {}),
        },
        { status: 400 }
      );
    }

    if (pgCode === '42703' || pgCode === '42P01' || pgCode === '42883' || pgCode === '42P17') {
      return NextResponse.json(
        {
          error: 'Database schema or extension mismatch. Run migrations and ensure Postgres extensions exist.',
          code: 'database_schema',
          ...(pgMessage ? { detail: pgMessage } : {}),
        },
        { status: 503 }
      );
    }

    if (pgCode === 'ECONNREFUSED' || pgCode === 'ENOTFOUND' || pgCode === '57P01') {
      return NextResponse.json(
        { error: 'Could not connect to the database. Check DATABASE_URL and network access.', code: 'database_unavailable' },
        { status: 503 }
      );
    }

    if (err instanceof Error) {
      const m = err.message;
      if (/blob|@vercel\/blob|Vercel/i.test(m)) {
        return NextResponse.json(
          {
            error: 'File storage failed. Verify BLOB_READ_WRITE_TOKEN on the server.',
            code: 'blob_error',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Upload failed',
        code: 'server_error',
        ...(pgMessage ? { detail: pgMessage } : {}),
      },
      { status: 500 }
    );
  }
}
