import { z } from 'zod';
import { assertSafeObjectKey } from '@/lib/storage/public-urls';

const isoDateString = z.string().min(10, 'Use an ISO-8601 timestamp');

export const categoryKindSchema = z.enum([
  'country_flags',
  'historical_flags',
  'organization_flags',
  'other',
]);

export const catalogCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase slug segments (a-z0-9)'),
  description: z.string().nullable(),
  kind: categoryKindSchema,
  isApproved: z.boolean(),
  parentId: z.string().uuid().nullable(),
  displayOrder: z.number().int(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

const storageKeySchema = z.string()
  .min(1)
  .max(1024)
  .refine((k) => {
    try {
      assertSafeObjectKey(k);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid R2 key (empty, path traversal, or too long)');

const optionalUrl = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.union([z.string().url(), z.null()]).optional()
);

export const catalogProductFileSchema = z
  .object({
    id: z.string().uuid().optional(),
    tier: z.enum(['preview_free', 'pro']),
    format: z.string().min(1).max(32),
    qualityLabel: z.string().min(1).max(120),
    storageKey: storageKeySchema,
    publicUrl: optionalUrl,
    fileName: z.string().min(1).max(260),
    mimeType: z.string().min(1).max(120),
    bytes: z.number().int().nonnegative().nullable().optional(),
    sortOrder: z.number().int().nonnegative(),
  })
  .superRefine((f, ctx) => {
    if (f.tier === 'pro' && f.publicUrl != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'pro tier files must not expose publicUrl — keep masters private (null or omit)',
        path: ['publicUrl'],
      });
    }
  });

export const catalogProductSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(300),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase slug segments only'),
    description: z.string().nullable().optional(),
    countryCode: z
      .string()
      .regex(/^[a-zA-Z]{2}$/)
      .transform((s) => s.toUpperCase())
      .nullable()
      .optional(),
    region: z.string().max(200).nullable().optional(),
    categorySlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    tags: z
      .array(z.string().min(1).max(64))
      .max(40)
      .transform((tags) =>
        [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))]
      ),
    thumbnailUrl: optionalUrl,
    previewUrl: optionalUrl,
    license: z.object({
      summary: z.string().min(1).max(500),
      detail: z.string().nullable().optional(),
    }),
    pricing: z.object({
      priceCents: z.number().int().nonnegative(),
      currency: z
        .string()
        .length(3)
        .regex(/^[a-zA-Z]{3}$/)
        .transform((s) => s.toUpperCase()),
    }),
    flags: z.object({
      isFeatured: z.boolean(),
      isPublished: z.boolean(),
    }),
    seo: z
      .object({
        metaTitle: z.string().max(300).nullable().optional(),
        metaDescription: z.string().max(500).nullable().optional(),
        canonicalPath: z
          .string()
          .max(500)
          .nullable()
          .optional()
          .refine((p) => p == null || p.startsWith('/'), 'canonicalPath must start with /'),
        ogImageUrl: optionalUrl,
      })
      .optional(),
    timestamps: z
      .object({
        createdAt: isoDateString,
        updatedAt: isoDateString,
      })
      .optional(),
    files: z.array(catalogProductFileSchema).min(1, 'Add at least one file (preview and/or pro)'),
  })
  .superRefine((p, ctx) => {
    const sortOrders = p.files.map((f) => f.sortOrder);
    if (new Set(sortOrders).size !== sortOrders.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate sortOrder values — each file needs a unique sortOrder',
        path: ['files'],
      });
    }
    if (p.flags.isPublished) {
      const hasPreview = p.files.some((f) => f.tier === 'preview_free');
      if (!hasPreview) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Published products should include at least one preview_free file for storefront previews / free download',
          path: ['files'],
        });
      }
    }
    const hasPro = p.files.some((f) => f.tier === 'pro');
    if (!hasPro) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add at least one pro tier file (paid / subscription master assets)',
        path: ['files'],
      });
    }
  });

export type CatalogCategoryDraft = z.infer<typeof catalogCategorySchema>;
export type CatalogProductFileDraft = z.infer<typeof catalogProductFileSchema>;
export type CatalogProductDraft = z.infer<typeof catalogProductSchema>;

export function parseCatalogCategoriesJson(raw: unknown): CatalogCategoryDraft[] {
  return z.array(catalogCategorySchema).min(1).parse(raw);
}

export function parseCatalogProductJson(raw: unknown): CatalogProductDraft {
  return catalogProductSchema.parse(raw);
}

/** Safe parse for future admin UI — returns issues instead of throwing. */
export function safeParseCatalogProductJson(raw: unknown) {
  return catalogProductSchema.safeParse(raw);
}

export function safeParseCatalogCategoriesJson(raw: unknown) {
  return z.array(catalogCategorySchema).min(1).safeParse(raw);
}
