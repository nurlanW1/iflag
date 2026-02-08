# Admin Panel Documentation

## Overview

The Admin Panel is a private, secure content management system accessible only to the site owner (single admin). It provides comprehensive asset management, upload capabilities, and analytics.

## Security

### Access Control
- **Authentication Required**: All admin routes require valid JWT token
- **Role-Based Access**: Only users with `role = 'admin'` can access
- **Route Protection**: Frontend and backend both enforce admin role
- **Single Admin**: Designed for single admin use (can be extended for multiple admins)

### Security Features
- JWT token validation on every request
- Admin role verification middleware
- Secure file upload validation
- Input sanitization and validation
- SQL injection prevention (parameterized queries)

## Admin Routes

### Backend API Routes (`/api/admin/*`)

All routes require `Authorization: Bearer <token>` header and admin role.

#### Dashboard
- `GET /api/admin/stats` - Get dashboard statistics

#### Asset Management
- `GET /api/admin/assets` - List all assets (with filters)
- `GET /api/admin/assets/:id` - Get asset with all files
- `POST /api/admin/assets/upload` - Bulk upload assets
- `PUT /api/admin/assets/:id` - Update asset metadata
- `PATCH /api/admin/assets/:id/toggle` - Toggle asset status
- `DELETE /api/admin/assets/:id` - Safe delete (archive) asset
- `GET /api/admin/assets/:id/stats` - Get asset download statistics

#### Categories & Tags
- `GET /api/admin/categories` - Get all categories
- `GET /api/admin/tags` - Get all tags

#### Subscriptions
- `GET /api/admin/subscriptions` - Get subscription overview

### Frontend Routes (`/admin/*`)

- `/admin` - Dashboard
- `/admin/upload` - Upload assets
- `/admin/assets` - Manage assets (list view)
- `/admin/assets/[id]` - Edit asset
- `/admin/subscriptions` - Subscription management
- `/admin/analytics` - Analytics dashboard
- `/admin/settings` - Settings

## Features

### 1. Asset Upload

#### Multi-File Upload
- Upload up to 20 files at once
- Support for all formats:
  - **Vector**: SVG, EPS
  - **Raster**: PNG, JPG, TIFF
  - **Video**: MP4, WEBM
- Drag and drop support
- File size limit: 500MB per file

#### Metadata Assignment
- **Title** (required)
- **Description**
- **Asset Type**: Flag, Emblem, Coat of Arms, Symbol, Video, Animated
- **Category**: Select from existing categories
- **Country Code**: ISO 3166-1 alpha-3 (e.g., USA)
- **Organization Name**: For international organization flags
- **Style**: Flat, Waving, Icon, Round, Heart Shape, Mockup, FX/Stylized
- **Tags**: Comma-separated tags for search optimization
- **Pricing**: Free or Premium
- **Status**: Draft or Published

#### Upload Process
1. Select files (multiple files for one asset)
2. Fill in metadata
3. Submit upload
4. Files are processed asynchronously:
   - Preview generation
   - Watermarking (for premium assets)
   - Format conversion (EPS → SVG, etc.)
   - Multiple size variants

### 2. Asset Management

#### Asset List View
- **Filters**:
  - Search by title/description
  - Filter by asset type
  - Filter by status (Published, Draft, Archived)
  - Filter by pricing (Premium, Free)
- **Pagination**: 50 assets per page
- **Quick Actions**:
  - Edit asset
  - Toggle status (Enable/Disable)
  - Archive asset

#### Asset Edit View
- Edit all metadata
- View all file variants
- Download individual files
- View download statistics
- Update asset status

### 3. Dashboard

#### Statistics Display
- **Total Assets**: All assets count
- **Published Assets**: Currently published
- **Draft Assets**: Unpublished drafts
- **Premium/Free Breakdown**: Asset pricing distribution
- **Total Downloads**: All-time download count
- **Subscriptions**: Active and total subscriptions
- **Revenue**: Monthly recurring revenue
- **Assets by Type**: Distribution chart
- **Assets by Category**: Distribution chart
- **Recent Uploads**: Last 10 uploaded assets

### 4. Download Statistics

Per-asset statistics:
- Total downloads
- Unique users
- Premium downloads
- Free downloads
- Daily download trends (last 30 days)

### 5. Subscription Overview

- Plan breakdown
- Active vs canceled subscriptions
- Revenue by plan
- Subscription statistics

## Form Validation

### Client-Side Validation
- Required fields marked with *
- File type validation
- File size limits
- Country code format (3 letters)
- Tag format (comma-separated)

### Server-Side Validation
- File type verification
- File size limits
- Metadata validation
- SQL injection prevention
- XSS prevention

## Error Handling

### Upload Errors
- File type not supported
- File too large
- Missing required fields
- Processing failures

### API Errors
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Server errors (500)

### User Feedback
- Success messages (green)
- Error messages (red)
- Loading states
- Progress indicators

## UI/UX Features

### Layout
- **Sidebar Navigation**: Persistent sidebar with admin menu
- **Main Content Area**: Flexible content area
- **Responsive Design**: Works on desktop and tablet

### Components
- **File Upload Zone**: Drag and drop area
- **Form Inputs**: Consistent styling
- **Data Tables**: Sortable, filterable tables
- **Statistics Cards**: Visual stat display
- **Action Buttons**: Clear call-to-action buttons

### User Experience
- **Loading States**: Spinners during async operations
- **Progress Indicators**: Upload progress bars
- **Confirmation Dialogs**: For destructive actions
- **Success Feedback**: Confirmation messages
- **Error Messages**: Clear error descriptions

## File Processing

### Automatic Processing
When assets are uploaded, the system automatically:

1. **Detects Format**: Identifies file format from extension
2. **Extracts Metadata**: Gets dimensions, size, etc.
3. **Creates File Records**: Stores file information
4. **Queues Processing Jobs**:
   - Preview generation
   - Watermarking (if premium)
   - Format conversion (if needed)
   - Multiple size variants

### Processing Queue
- Async processing for heavy operations
- Priority-based queue
- Retry logic for failed jobs
- Progress tracking

## Best Practices

### Upload Workflow
1. Prepare files (correct formats, reasonable sizes)
2. Gather metadata (title, description, tags)
3. Select appropriate category
4. Set pricing (free vs premium)
5. Upload as draft first
6. Review and publish

### Asset Organization
- Use consistent naming
- Add relevant tags
- Categorize properly
- Use appropriate styles
- Set correct country codes

### Performance
- Upload files in batches
- Use appropriate file sizes
- Optimize images before upload
- Monitor processing queue

## API Usage Examples

### Upload Asset
```javascript
const formData = new FormData();
files.forEach(file => formData.append('files', file));
formData.append('title', 'United States Flag');
formData.append('asset_type', 'flag');
formData.append('is_premium', 'true');
formData.append('tags', 'usa, america, stars, stripes');

const response = await fetch('/api/admin/assets/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

### Update Asset
```javascript
const response = await fetch(`/api/admin/assets/${assetId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Updated Title',
    description: 'New description',
    is_premium: true,
    status: 'published',
  }),
});
```

### Toggle Status
```javascript
const response = await fetch(`/api/admin/assets/${assetId}/toggle`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ enabled: true }),
});
```

## Future Enhancements

- [ ] Bulk operations (bulk edit, bulk delete)
- [ ] Advanced search and filtering
- [ ] Asset duplication
- [ ] Version history
- [ ] Asset templates
- [ ] Automated tagging (AI)
- [ ] Batch upload from folder
- [ ] CSV import/export
- [ ] Advanced analytics
- [ ] User management (if multi-admin)

## Troubleshooting

### Upload Fails
- Check file format is supported
- Verify file size is under 500MB
- Ensure all required fields are filled
- Check network connection

### Processing Stuck
- Check processing queue status
- Verify worker processes are running
- Check server logs for errors
- Retry failed jobs

### Access Denied
- Verify user has admin role
- Check JWT token is valid
- Ensure token hasn't expired
- Re-login if needed

---

The Admin Panel provides a comprehensive, secure, and user-friendly interface for managing the flag stock marketplace content.
