# Flag Detail Page - Data Flow Documentation

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Flag Detail Page Component                       │
│  /flags/[slug]                                                │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Load Flag    │   │ Check Premium│   │ Select Variant│
│ Data         │   │ Status       │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    API CLIENT                                │
│  GET /api/assets/slug/:slug                                  │
│  GET /api/subscriptions/check-premium                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                                │
│  Express Router                                               │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Database     │   │ Subscription │   │ Format       │
│ Query        │   │ Service      │   │ Filtering    │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## Detailed Flow Breakdown

### 1. Initial Page Load

**Trigger**: User navigates to `/flags/[slug]`

**Frontend Flow**:
```typescript
useEffect(() => {
  loadFlagData();        // Load flag with variants and formats
  checkPremium();        // Check user subscription status
}, [slug, user]);
```

**API Calls**:
1. `GET /api/assets/slug/:slug`
   - Returns: Flag metadata, variants, formats, prices
   - Response structure:
     ```json
     {
       "id": "uuid",
       "title": "United States Flag",
       "slug": "united-states-flag",
       "description": "...",
       "variants": [
         {
           "id": "uuid",
           "variant_type": "flat",
           "preview_url": "...",
           "assets": [
             {
               "id": "uuid",
               "format": { "format_code": "svg", "format_category": "vector" },
               "price": { "price_cents": 0, "requires_subscription": false }
             }
           ]
         }
       ]
     }
     ```

2. `GET /api/subscriptions/check-premium` (if authenticated)
   - Returns: `{ hasPremium: boolean }`

**State Updates**:
- `flag`: Set to loaded flag data
- `selectedVariantId`: Set to default variant
- `hasPremium`: Set based on subscription check
- `loading`: Set to false

---

### 2. Variant Selection

**Trigger**: User clicks variant in gallery

**Frontend Flow**:
```typescript
const handleVariantSelect = (variantId: string) => {
  setSelectedVariantId(variantId);
  // Automatically filters formats for selected variant
};
```

**Data Processing**:
- Filter `flag.variants` to find selected variant
- Extract `variant.assets` (formats)
- Update `variantFormats` state
- Re-filter formats by active tab

**No API Call**: Uses already loaded data

---

### 3. Format Tab Change

**Trigger**: User clicks Vector/Raster/Video tab

**Frontend Flow**:
```typescript
const handleTabChange = (tab: FormatTab) => {
  setActiveTab(tab);
  // Automatically filters formats
};
```

**Data Processing**:
```typescript
const filteredFormats = variantFormats.filter((asset) => {
  const category = asset.format?.format_category;
  switch (activeTab) {
    case 'vector': return category === 'vector';
    case 'raster': return category === 'raster';
    case 'video': return category === 'video';
  }
});
```

**URL Update**: Updates hash (`#vector`, `#raster`, `#video`)

**No API Call**: Client-side filtering

---

### 4. Download Flow

**Trigger**: User clicks download button

**Frontend Flow**:
```typescript
const handleDownload = async (assetId, formatId, requiresSubscription) => {
  // 1. Check access
  if (requiresSubscription && !hasPremium) {
    setShowPremiumCTA(true);
    return;
  }

  // 2. Initiate download
  setDownloading(prev => new Set(prev).add(assetId));
  
  // 3. Get download URL
  const { url } = await api.getDownloadUrl(assetId, formatId);
  
  // 4. Trigger browser download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};
```

**API Call**:
- `GET /api/assets/:id/download?format_id=xxx`
  - Backend checks:
    - User authentication
    - Subscription status (if premium)
    - Format pricing
  - Returns:
    ```json
    {
      "url": "https://cdn.example.com/assets/...",
      "type": "free" | "premium" | "watermarked",
      "filename": "flag.svg"
    }
    ```

**Backend Processing**:
1. Verify user has access
2. If premium required and not subscribed:
   - Return watermarked version (if available)
   - Or return 403 error
3. If access granted:
   - Generate signed URL (if S3)
   - Or return direct URL
   - Track download in database

**State Updates**:
- `downloading`: Add asset ID
- `downloading`: Remove asset ID after download

---

### 5. Premium CTA Flow

**Trigger**: User tries to download premium format without subscription

**Frontend Flow**:
```typescript
if (requiresSubscription && !hasPremium) {
  setShowPremiumCTA(true);
  // Show modal or banner
}
```

**User Actions**:
1. **Dismiss**: Close CTA, continue browsing
2. **Subscribe**: Navigate to `/subscriptions`
3. **After Subscription**: Return to flag page, enable downloads

**No API Call**: Uses existing state

---

### 6. Admin Controls Flow

**Trigger**: Admin clicks edit/stats/disable buttons

**Frontend Flow**:
```typescript
// Edit Metadata
const handleSaveMetadata = async () => {
  await adminApi.updateAsset(asset.id, formData);
  loadFlagData(); // Refresh
};

// Toggle Status
const handleToggleStatus = async () => {
  await adminApi.toggleAssetStatus(asset.id, !asset.status);
  loadFlagData(); // Refresh
};

// View Stats
const loadStats = async () => {
  const stats = await adminApi.getAssetStats(asset.id);
  setStats(stats);
  setShowStats(true);
};
```

**API Calls**:
1. `PUT /api/admin/assets/:id` - Update metadata
2. `PATCH /api/admin/assets/:id/toggle` - Toggle status
3. `GET /api/admin/assets/:id/stats` - Get statistics

**Backend Processing**:
- Verify admin role
- Update database
- Return updated data

**State Updates**:
- Refresh flag data after update
- Show stats modal
- Update UI optimistically

---

## State Management

### Component State Structure

```typescript
{
  // Data
  flag: Flag | null;
  loading: boolean;
  error: string | null;
  
  // Selection
  selectedVariantId: string | null;
  activeTab: 'vector' | 'raster' | 'video';
  
  // User Context
  user: User | null;
  hasPremium: boolean;
  
  // UI State
  previewZoom: number;
  isFullscreen: boolean;
  showPremiumCTA: boolean;
  downloading: Set<string>;
  
  // Admin
  editMode: 'metadata' | 'pricing' | null;
  showStats: boolean;
  stats: Stats | null;
}
```

### State Dependencies

```
flag
  └─> variants
      └─> selectedVariantId
          └─> variantFormats
              └─> activeTab
                  └─> filteredFormats
```

---

## Performance Optimizations

### 1. Data Caching
- Cache flag data for 5 minutes
- Cache variant previews
- Cache format lists

### 2. Lazy Loading
- Lazy load variant previews
- Lazy load admin components
- Lazy load stats modal

### 3. Optimistic Updates
- Update UI immediately on variant change
- Show loading states during downloads
- Update format list without API call

### 4. Code Splitting
- Split admin components
- Split stats modal
- Route-based splitting

---

## Error Handling

### Error Scenarios

1. **Flag Not Found (404)**
   - Show error message
   - Provide "Back to Assets" link
   - Suggest similar flags

2. **Download Failed**
   - Show error toast
   - Provide retry button
   - Log error for analytics

3. **Premium Required**
   - Show CTA modal
   - Provide subscribe link
   - Remember user intent

4. **Network Error**
   - Show retry button
   - Cache last successful state
   - Graceful degradation

---

## Security Considerations

### Access Control

1. **Public Access**:
   - View flag details
   - Download free formats
   - View watermarked previews

2. **Authenticated Access**:
   - Track downloads
   - Personalize experience
   - Save favorites

3. **Premium Access**:
   - Download premium formats
   - No watermarks
   - Commercial license

4. **Admin Access**:
   - Edit metadata
   - Change pricing
   - View statistics
   - Toggle status

### Data Validation

- Validate format IDs
- Verify subscription status
- Check download permissions
- Sanitize user inputs (admin)

---

This data flow ensures a smooth, performant, and secure user experience for both regular users and admins.
