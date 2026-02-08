# Admin Panel Setup Guide

This guide explains how to set up and use the Admin Panel for managing countries and flag assets.

## Overview

The Admin Panel provides a comprehensive interface for managing:
- **Countries**: Create, edit, and organize 250+ countries
- **Flag Files**: Upload and manage multiple flag formats/variants per country
- **Assets**: Manage all flag assets with metadata
- **Subscriptions**: View subscription statistics

## Prerequisites

1. Database is set up and running (PostgreSQL)
2. Backend server is running
3. Frontend server is running
4. You have admin access credentials

## Initial Setup

### 1. Run Database Migration

First, add the countries table to your database:

```bash
cd apps/backend
npm run build
node dist/db/migrate-countries.js
```

Or using TypeScript directly:

```bash
cd apps/backend
npx ts-node src/db/migrate-countries.ts
```

### 2. Create Admin User

Create your first admin user:

```bash
cd apps/backend
npx ts-node src/db/seed-admin.ts
```

Or set environment variables:

```bash
ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=secure-password npx ts-node src/db/seed-admin.ts
```

**Default credentials** (change immediately!):
- Email: `admin@example.com`
- Password: `admin123456`

### 3. Access Admin Panel

1. Log in to the website with your admin account
2. Navigate to `/admin` or click the "Admin Panel" button in your profile
3. You should see the admin dashboard

## Admin Panel Features

### Countries Management (`/admin/countries`)

**List View:**
- View all countries with search and filters
- Filter by region, category, and status
- See flag counts per country
- Quick edit and delete actions

**Create/Edit Country:**
- Country name and slug
- ISO codes (alpha-2, alpha-3, numeric)
- Region and category classification
- Status (draft/published/archived)
- Display order and featured flag

**Flag Files Management:**
- Upload multiple flag files per country
- Support formats: PNG, SVG, JPG, WEBP, EPS, PDF
- Set variant names (flat, waving, round, etc.)
- Set aspect ratios (1:1, 3:2, 16:9, etc.)
- Configure premium tiers (free/freemium/paid)
- Enable/disable watermarks

### Key Features

#### Duplicate Prevention
- System prevents duplicate flag files with same:
  - Country + Variant + Format + Ratio
- Warns before creating duplicates

#### Metadata Management
- Store file dimensions, DPI, file size
- Add tags and custom metadata
- Track upload history

#### Status Management
- **Draft**: Not visible in public gallery
- **Published**: Visible in public gallery
- **Archived**: Soft deleted, can be restored

## API Endpoints

### Countries

- `GET /api/admin/countries` - List countries (with filters)
- `GET /api/admin/countries/:id` - Get country details
- `POST /api/admin/countries` - Create new country
- `PUT /api/admin/countries/:id` - Update country
- `DELETE /api/admin/countries/:id` - Archive country
- `POST /api/admin/countries/:id/restore` - Restore archived country

### Flag Files

- `GET /api/admin/countries/:id/flags` - List flag files for country
- `POST /api/admin/countries/:id/flags` - Upload flag file
- `PUT /api/admin/countries/flags/:flagId` - Update flag file metadata
- `DELETE /api/admin/countries/flags/:flagId` - Delete flag file

## File Storage

### Development
Files are stored locally in:
- `public/uploads/countries/{countryId}/{filename}`

### Production
Configure cloud storage (S3-compatible) in:
- `apps/backend/src/storage/cloud-storage.ts`

## Security

### Access Control
- All admin routes require authentication
- Only users with `role = 'admin'` can access
- Non-admin users are redirected to login or shown 403

### File Upload Security
- File type validation (whitelist)
- File size limits (500MB per file, 20 files max)
- Filename sanitization
- Checksum verification for deduplication

## Sample Data

### Create Sample Countries

You can create sample countries via the admin panel or API:

```javascript
// Example: Create United States
{
  "name": "United States",
  "slug": "united-states",
  "iso_alpha_2": "US",
  "iso_alpha_3": "USA",
  "iso_numeric": "840",
  "region": "Americas",
  "category": "country",
  "status": "published"
}
```

### Upload Flag Files

1. Navigate to country detail page
2. Click "Upload Flag"
3. Select file (PNG, SVG, JPG, WEBP)
4. Set variant name (e.g., "flat", "waving")
5. Set ratio (e.g., "3:2", "16:9")
6. Configure premium tier
7. Save

## Integration with Gallery

The public gallery (`/gallery`) automatically reads from the countries table:
- Only published countries are shown
- Only published flag files are accessible
- Countries are organized by region and category

## Troubleshooting

### "Countries table does not exist"
- Run the migration script: `npx ts-node src/db/migrate-countries.ts`

### "Access denied" or 403 errors
- Ensure your user has `role = 'admin'` in database
- Check JWT token is valid
- Verify admin routes are protected

### File upload fails
- Check file size limits
- Verify file type is allowed
- Ensure storage directory exists and is writable

### Countries not showing in gallery
- Check country status is "published"
- Verify flag files are also published
- Clear cache if using CDN

## Best Practices

1. **Always use ISO codes** for countries when available
2. **Set proper slugs** - they're used in URLs
3. **Use consistent variant names** (flat, waving, round, etc.)
4. **Set appropriate ratios** for different use cases
5. **Test uploads** before publishing
6. **Keep backups** of your database
7. **Monitor file storage** usage

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API error messages
3. Check server logs
4. Contact system administrator
