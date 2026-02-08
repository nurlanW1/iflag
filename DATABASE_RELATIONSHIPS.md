# Database Relationships Diagram

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ id (PK)                                                    │ │
│  │ email, role, is_active                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                          │                                      │
│                          │ 1:N                                  │
│                          ▼                                      │
│                    SUBSCRIPTIONS                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ id (PK), user_id (FK), plan_id (FK)                       │ │
│  │ status, current_period_end                                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                          │                                      │
│                          │ N:1                                  │
│                          ▼                                      │
│                SUBSCRIPTION_PLANS                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         FLAGS                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ id (PK)                                                    │ │
│  │ title, slug, country_code, status                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                          │                                      │
│        ┌─────────────────┼─────────────────┐                  │
│        │ 1:N             │ 1:N             │ N:M              │
│        ▼                 ▼                 ▼                  │
│  FLAG_VARIANTS    FLAG_CATEGORIES    FLAG_TAGS               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ id (PK)     │  │ flag_id (FK) │  │ flag_id (FK) │        │
│  │ flag_id (FK)│  │ category_id  │  │ tag_id (FK)  │        │
│  │ variant_type│  │ (FK)        │  │              │        │
│  └─────────────┘  └──────────────┘  └──────────────┘        │
│        │                 │                  │                 │
│        │ 1:N             │ N:1              │ N:1             │
│        ▼                 ▼                  ▼                 │
│  MEDIA_ASSETS      CATEGORIES          TAGS                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ id (PK)     │  │ id (PK)      │  │ id (PK)      │        │
│  │ variant_id  │  │ name, slug   │  │ name, slug   │        │
│  │ format_id   │  │ parent_id    │  │ usage_count  │        │
│  │ file_url    │  │ (self-ref)   │  └──────────────┘        │
│  └─────────────┘  └──────────────┘                          │
│        │                                                      │
│        │ N:1                                                  │
│        ▼                                                      │
│  MEDIA_FORMATS                                                │
│  ┌─────────────┐                                             │
│  │ id (PK)     │                                             │
│  │ format_code │                                             │
│  │ format_name │                                             │
│  └─────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         PRICES                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ id (PK)                                                    │ │
│  │ flag_id (FK), format_id (FK)                              │ │
│  │ price_cents, requires_subscription                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│        │                    │                                   │
│        │ N:1                │ N:1                               │
│        ▼                    ▼                                   │
│     FLAGS            MEDIA_FORMATS                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       DOWNLOADS                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ id (PK)                                                    │ │
│  │ user_id (FK), media_asset_id (FK), format_id (FK)        │ │
│  │ download_type, subscription_id (FK)                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│        │                    │                    │             │
│        │ N:1                │ N:1                │ N:1         │
│        ▼                    ▼                    ▼             │
│     USERS            MEDIA_ASSETS         SUBSCRIPTIONS        │
└─────────────────────────────────────────────────────────────────┘
```

## Relationship Details

### One-to-Many Relationships

1. **users → subscriptions** (1:N)
   - One user can have multiple subscriptions (historical)
   - CASCADE delete: Delete user, delete subscriptions

2. **flags → flag_variants** (1:N)
   - One flag can have many variants (flat, waving, round, etc.)
   - CASCADE delete: Delete flag, delete all variants

3. **flag_variants → media_assets** (1:N)
   - One variant can have many formats (SVG, PNG, JPG, MP4, etc.)
   - CASCADE delete: Delete variant, delete all assets

4. **categories → categories** (1:N, self-referential)
   - Hierarchical categories (parent-child)
   - CASCADE delete: Delete parent, delete children

5. **flags → prices** (1:N)
   - One flag can have different prices per format
   - CASCADE delete: Delete flag, delete prices

6. **users → downloads** (1:N)
   - One user can have many downloads
   - SET NULL delete: Delete user, keep download records (analytics)

7. **media_assets → downloads** (1:N)
   - One asset can be downloaded many times
   - CASCADE delete: Delete asset, delete download records

### Many-to-Many Relationships

1. **flags ↔ categories** (N:M via flag_categories)
   - Flags can belong to multiple categories
   - Categories can contain multiple flags
   - `is_primary` flag indicates primary category

2. **flags ↔ tags** (N:M via flag_tags)
   - Flags can have multiple tags
   - Tags can be applied to multiple flags
   - No additional attributes needed

### Many-to-One Relationships

1. **flag_variants → flags** (N:1)
   - Many variants belong to one flag

2. **media_assets → flag_variants** (N:1)
   - Many assets belong to one variant

3. **media_assets → media_formats** (N:1)
   - Many assets use one format
   - RESTRICT delete: Cannot delete format if assets exist

4. **prices → flags** (N:1)
   - Many prices belong to one flag

5. **prices → media_formats** (N:1)
   - Many prices reference one format

6. **downloads → users** (N:1, nullable)
   - Many downloads belong to one user (or anonymous)

7. **downloads → media_assets** (N:1)
   - Many downloads reference one asset

8. **downloads → subscriptions** (N:1, nullable)
   - Many downloads can use one subscription

## Cardinality Summary

| Relationship | Type | Cardinality | Delete Behavior |
|-------------|------|-------------|-----------------|
| users → subscriptions | 1:N | One to Many | CASCADE |
| subscriptions → subscription_plans | N:1 | Many to One | RESTRICT |
| flags → flag_variants | 1:N | One to Many | CASCADE |
| flag_variants → media_assets | 1:N | One to Many | CASCADE |
| media_assets → media_formats | N:1 | Many to One | RESTRICT |
| flags ↔ categories | N:M | Many to Many | CASCADE |
| flags ↔ tags | N:M | Many to Many | CASCADE |
| flags → prices | 1:N | One to Many | CASCADE |
| prices → media_formats | N:1 | Many to One | RESTRICT |
| users → downloads | 1:N | One to Many | SET NULL |
| media_assets → downloads | 1:N | One to Many | CASCADE |
| downloads → subscriptions | N:1 | Many to One | SET NULL |
| categories → categories | 1:N | Self-referential | CASCADE |

## Query Patterns

### Pattern 1: Get Complete Flag Data
```
flags (1) → flag_variants (N) → media_assets (N) → media_formats (1)
         → flag_categories (N:M) → categories (1)
         → flag_tags (N:M) → tags (1)
         → prices (N) → media_formats (1)
```

### Pattern 2: Check Download Access
```
users (1) → subscriptions (N) → subscription_plans (1)
media_assets (1) → prices (N) → flags (1)
                  → media_formats (1)
```

### Pattern 3: Analytics Queries
```
downloads (N) → media_assets (1) → flag_variants (1) → flags (1)
            → users (1)
            → subscriptions (1) → subscription_plans (1)
```

## Performance Implications

### Join Depth
- **Shallow queries** (2-3 joins): Fast, use indexes
- **Deep queries** (4+ joins): May need optimization, consider materialized views

### Index Strategy
- **Foreign keys**: Always indexed for JOIN performance
- **Composite indexes**: For common query patterns
- **Partial indexes**: For filtered queries (status = 'published')

### Denormalization Opportunities
- Flag download count (updated via trigger)
- Category asset count (updated via trigger)
- Tag usage count (updated via trigger)
- Search vector (pre-computed full-text search)
