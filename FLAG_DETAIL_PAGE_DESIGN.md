# Flag Detail Page Design
## User & Admin Views with Format Tabs

## Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  [Back]  Flag Detail: United States Flag    [Share] [❤] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Variant Gallery (Carousel)                       │ │
│  │  [Flat] [Waving] [Round] [Heart] [Icon] [Mockup] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Main Preview Area                                │ │
│  │  [Large Preview Image/Video]                      │ │
│  │  [Zoom Controls] [Fullscreen]                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Format Tabs                                      │ │
│  │  [Vector] [Raster] [Video]                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Format List (Active Tab)                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │ │
│  │  │ SVG      │ │ PNG      │ │ JPG      │         │ │
│  │  │ $0.00    │ │ $2.99    │ │ $2.99    │         │ │
│  │  │ [Download]│ │ [Download]│ │ [Download]│       │ │
│  │  └──────────┘ └──────────┘ └──────────┘         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Metadata & Info                                   │ │
│  │  Country: USA | Category: North America          │ │
│  │  Tags: [usa] [america] [stars] [stripes]         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Premium CTA (if not subscribed)                 │ │
│  │  [Get Premium Access - $9.99/week]               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## User View Components

### 1. Variant Gallery

**Purpose**: Display all available variants (flat, waving, round, etc.)

**UI Behavior**:
- Horizontal scrollable carousel
- Active variant highlighted
- Click to switch variant
- Smooth transition animation
- Thumbnail previews (64x40px)

**Data Flow**:
```
1. Load flag data → Get all variants
2. Filter active variants (is_active = true)
3. Display in carousel
4. On variant click → Update main preview
5. Update format tabs based on selected variant
```

**Component Structure**:
```typescript
<VariantGallery
  variants={flag.variants}
  selectedVariant={selectedVariantId}
  onVariantSelect={handleVariantSelect}
/>
```

### 2. Main Preview Area

**Purpose**: Large preview of selected variant

**UI Behavior**:
- Responsive container (max 1200px width)
- Maintain aspect ratio
- Zoom on hover/click
- Fullscreen mode
- Video autoplay (muted, looped) for animated variants
- Loading state while switching variants

**Data Flow**:
```
1. Selected variant changes
2. Load preview URL from variant
3. Show loading spinner
4. Display preview (image/video)
5. Cache preview for instant switching
```

**Component Structure**:
```typescript
<MainPreview
  variant={selectedVariant}
  previewUrl={selectedVariant.preview_url}
  isVideo={selectedVariant.variant_type === 'animated'}
  onZoom={handleZoom}
  onFullscreen={handleFullscreen}
/>
```

### 3. Format Tabs

**Purpose**: Organize formats by category

**UI Behavior**:
- Three tabs: Vector, Raster, Video
- Active tab highlighted
- Show count of formats per tab
- Smooth tab transition
- Remember last selected tab (localStorage)

**Data Flow**:
```
1. Load all formats for selected variant
2. Group by format_category
3. Display counts per category
4. On tab click → Filter and display formats
5. Update URL hash (#vector, #raster, #video)
```

**Component Structure**:
```typescript
<FormatTabs
  formats={variantFormats}
  activeTab={activeTab}
  onTabChange={handleTabChange}
/>
```

### 4. Format List

**Purpose**: Display available formats with pricing and download options

**UI Behavior**:
- Grid layout (3-4 columns)
- Format card shows:
  - Format name/icon
  - Dimensions/quality
  - Price (or "Free" badge)
  - Download button
  - Premium badge (if premium)
- Hover: Show format details
- Click download: Check access, show modal if needed

**Data Flow**:
```
1. Filter formats by active tab category
2. For each format:
   - Get price from prices table
   - Check user subscription status
   - Determine download access level
3. Render format cards
4. On download click:
   - Check access (free/premium/watermarked)
   - If premium required → Show CTA
   - If access granted → Initiate download
```

**Component Structure**:
```typescript
<FormatList
  formats={filteredFormats}
  userSubscription={userSubscription}
  onDownload={handleDownload}
/>
```

### 5. Format Card

**Purpose**: Individual format display

**UI Behavior**:
- Card layout with format icon
- Price display (prominent)
- Download button (primary CTA)
- Premium indicator
- Dimensions/quality info
- Hover: Show more details

**States**:
- Available: Normal state
- Premium Required: Disabled button, show CTA
- Processing: Loading state
- Downloading: Progress indicator

**Component Structure**:
```typescript
<FormatCard
  format={format}
  price={price}
  hasAccess={hasAccess}
  onDownload={handleDownload}
/>
```

### 6. Premium CTA

**Purpose**: Encourage subscription for premium formats

**UI Behavior**:
- Appears when:
  - User not subscribed
  - Selected variant has premium formats
  - User tries to download premium format
- Sticky banner or modal
- Clear pricing
- Benefits list
- Call-to-action button

**Data Flow**:
```
1. Check user subscription status
2. Check if variant has premium formats
3. If no subscription AND premium formats exist:
   - Show CTA banner
4. On CTA click → Navigate to subscriptions page
```

**Component Structure**:
```typescript
<PremiumCTA
  hasPremium={hasActiveSubscription}
  premiumFormatsCount={premiumFormatsCount}
  onSubscribe={handleSubscribe}
/>
```

### 7. Download Rules Display

**Purpose**: Show download permissions and rules

**UI Behavior**:
- Collapsible section
- Clear rules:
  - Free formats: Direct download
  - Premium formats: Subscription required
  - Watermarked previews: Available for free
- License information
- Usage rights

**Component Structure**:
```typescript
<DownloadRules
  rules={downloadRules}
  isExpanded={showRules}
  onToggle={handleToggleRules}
/>
```

---

## Admin View Components

### Additional Admin Controls

**Location**: Top-right corner, admin-only section

**Components**:

1. **Edit Button**
   - Opens edit modal/sidebar
   - Quick access to metadata editing

2. **Price Management**
   - Inline price editing per format
   - Bulk price update
   - Set free/premium

3. **Status Toggle**
   - Enable/disable asset
   - Quick publish/unpublish

4. **Stats Button**
   - Opens stats modal
   - Download statistics
   - Revenue data

**UI Behavior**:
- Admin controls visible only to admins
- Inline editing where possible
- Confirmation dialogs for destructive actions
- Real-time updates

---

## Data Flow

### Initial Page Load

```
1. User navigates to /flags/[slug]
   ↓
2. Fetch flag data:
   GET /api/assets/slug/:slug
   ↓
3. Response includes:
   - Flag metadata
   - All variants with previews
   - All formats per variant
   - Prices per format
   - User subscription status (if authenticated)
   ↓
4. Initialize state:
   - selectedVariant = default variant
   - activeTab = 'vector' (or from URL hash)
   - formats = filtered by variant and tab
   ↓
5. Render page
```

### Variant Selection

```
User clicks variant
   ↓
1. Update selectedVariant state
   ↓
2. Load variant preview (if not cached)
   ↓
3. Filter formats for selected variant
   ↓
4. Update format tabs (show counts)
   ↓
5. Update active tab if needed
   ↓
6. Re-render format list
```

### Format Tab Change

```
User clicks tab
   ↓
1. Update activeTab state
   ↓
2. Filter formats by category:
   - Vector: SVG, EPS
   - Raster: PNG, JPG, TIFF
   - Video: MP4, WEBM
   ↓
3. Update URL hash (#vector, #raster, #video)
   ↓
4. Re-render format list
```

### Download Flow

```
User clicks download button
   ↓
1. Check format access:
   - Is format free? → Allow
   - Is format premium?
     - User has subscription? → Allow
     - User not subscribed? → Show CTA
   ↓
2. If access granted:
   - Show download modal (optional)
   - Initiate download:
     GET /api/assets/:id/download
   ↓
3. Server checks:
   - User subscription
   - Format pricing
   - Returns appropriate file URL
   ↓
4. Client downloads file
   ↓
5. Track download (analytics)
```

### Premium CTA Flow

```
User tries to download premium format
   ↓
1. Check subscription status
   ↓
2. If not subscribed:
   - Show CTA modal/banner
   - Display benefits
   - Show pricing
   ↓
3. User clicks "Get Premium"
   ↓
4. Navigate to /subscriptions
   ↓
5. After subscription:
   - Return to flag page
   - Enable premium downloads
```

---

## State Management

### Component State

```typescript
interface FlagDetailState {
  // Flag data
  flag: Flag | null;
  loading: boolean;
  error: string | null;
  
  // Variant selection
  selectedVariantId: string | null;
  variants: FlagVariant[];
  
  // Format display
  activeTab: 'vector' | 'raster' | 'video';
  formats: MediaAsset[];
  filteredFormats: MediaAsset[];
  
  // User context
  user: User | null;
  subscription: Subscription | null;
  hasPremium: boolean;
  
  // UI state
  previewZoom: number;
  isFullscreen: boolean;
  showDownloadModal: boolean;
  showPremiumCTA: boolean;
  
  // Admin state
  isEditing: boolean;
  editMode: 'metadata' | 'pricing' | 'status';
}
```

### Data Fetching

**Initial Load:**
```typescript
useEffect(() => {
  loadFlagData();
  checkUserSubscription();
}, [slug]);
```

**Variant Change:**
```typescript
useEffect(() => {
  if (selectedVariantId) {
    loadVariantFormats(selectedVariantId);
    updatePreview(selectedVariantId);
  }
}, [selectedVariantId]);
```

**Tab Change:**
```typescript
useEffect(() => {
  filterFormatsByTab(activeTab);
}, [activeTab, formats]);
```

---

## API Integration

### Required Endpoints

1. **Get Flag with Variants and Formats**
   ```
   GET /api/assets/slug/:slug
   Response: {
     flag: {...},
     variants: [...],
     formats: [...],
     prices: [...]
   }
   ```

2. **Get Download URL**
   ```
   GET /api/assets/:id/download?format_id=xxx
   Response: {
     url: "...",
     type: "free" | "premium" | "watermarked"
   }
   ```

3. **Check Subscription** (if authenticated)
   ```
   GET /api/subscriptions/check-premium
   Response: {
     hasPremium: boolean
   }
   ```

4. **Admin: Update Metadata**
   ```
   PUT /api/admin/assets/:id
   Body: { title, description, ... }
   ```

5. **Admin: Update Pricing**
   ```
   PUT /api/admin/assets/:id/prices
   Body: { format_id, price_cents, ... }
   ```

6. **Admin: Toggle Status**
   ```
   PATCH /api/admin/assets/:id/toggle
   Body: { enabled: boolean }
   ```

7. **Admin: Get Stats**
   ```
   GET /api/admin/assets/:id/stats
   Response: {
     total_downloads: number,
     premium_downloads: number,
     ...
   }
   ```

---

## UI Behavior Details

### Variant Gallery

**Interaction:**
- Click variant → Smooth scroll to center
- Active variant: Blue border, scale up slightly
- Hover: Show variant name tooltip
- Keyboard: Arrow keys to navigate

**Performance:**
- Lazy load variant previews
- Cache loaded previews
- Preload adjacent variants

### Format Tabs

**Interaction:**
- Click tab → Smooth transition
- Active tab: Underline animation
- Count badges: Show format count
- Empty state: "No [format type] available"

**Accessibility:**
- Keyboard navigation (Tab, Enter)
- ARIA labels
- Screen reader announcements

### Format Cards

**Interaction:**
- Hover: Slight lift, show details
- Click download: Immediate action or modal
- Premium badge: Tooltip on hover
- Disabled state: Grayed out, show reason

**States:**
```typescript
type FormatCardState = 
  | 'available'      // Can download
  | 'premium_required' // Need subscription
  | 'processing'     // Generating download
  | 'downloading'    // Download in progress
  | 'error';         // Download failed
```

### Download Modal (Optional)

**Triggers:**
- First-time download
- Premium format download
- Large file download

**Content:**
- Format details
- File size
- License information
- Download button
- Cancel button

### Premium CTA

**Display Logic:**
```typescript
const showPremiumCTA = 
  !hasPremium && 
  hasPremiumFormats && 
  (userTriedDownload || alwaysShow);
```

**Variants:**
1. **Banner** (top of page)
   - Non-intrusive
   - Always visible
   - Dismissible

2. **Modal** (on premium download attempt)
   - Focused attention
   - Clear CTA
   - Benefits list

3. **Inline** (in format card)
   - Contextual
   - Replaces download button
   - Quick subscribe

---

## Admin View Enhancements

### Edit Mode

**Toggle:**
- "Edit" button in header
- Switches to edit mode
- Inline editing for metadata

**Editable Fields:**
- Title
- Description
- Category
- Tags
- Country/Organization
- Style

**Save Behavior:**
- Auto-save draft (debounced)
- Manual save button
- Optimistic updates
- Error handling

### Price Management

**Inline Price Editor:**
- Click price → Edit inline
- Format: $X.XX or Free
- Validation: Positive number
- Save: Individual or bulk

**Bulk Actions:**
- Select multiple formats
- Set price for all
- Set as free/premium

### Status Toggle

**Quick Toggle:**
- Toggle switch in header
- Published ↔ Draft
- Confirmation for publish
- Visual feedback

### Stats Modal

**Content:**
- Total downloads
- Premium vs free breakdown
- Revenue (if applicable)
- Download timeline chart
- Popular formats

**Data:**
- Real-time updates
- Historical data
- Export option

---

## Responsive Behavior

### Desktop (>1024px)
- Full layout
- Side-by-side preview and formats
- Hover interactions
- Modal dialogs

### Tablet (768px-1024px)
- Stacked layout
- Touch-optimized
- Swipeable variant gallery
- Full-width format cards

### Mobile (<768px)
- Single column
- Bottom sheet for formats
- Swipe gestures
- Simplified navigation

---

## Performance Optimizations

### Image Optimization
- Lazy load previews
- Responsive images (srcset)
- WebP with fallback
- Progressive loading

### Caching
- Cache flag data (5 minutes)
- Cache variant previews
- Cache format lists
- Service worker for offline

### Code Splitting
- Lazy load admin components
- Lazy load stats modal
- Route-based splitting

---

## Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation
- Screen reader support
- Focus indicators
- Color contrast
- Alt text for images

### Keyboard Shortcuts
- `Escape`: Close modals
- `Arrow Left/Right`: Navigate variants
- `Tab`: Navigate formats
- `Enter`: Download/Select
- `?`: Show shortcuts

---

## Error Handling

### Error States
1. **Flag Not Found**
   - 404 page
   - Suggest similar flags
   - Return to browse

2. **Load Failure**
   - Retry button
   - Error message
   - Fallback content

3. **Download Failure**
   - Error toast
   - Retry option
   - Support contact

---

This design provides a comprehensive, user-friendly flag detail page with clear data flow and intuitive interactions for both users and admins.
