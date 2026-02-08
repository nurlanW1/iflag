# Platform Architecture Design
## Extensible, Scalable, Future-Proof Architecture

## Core Principles

1. **Extensibility First** - Design for change, not just current needs
2. **Horizontal Scalability** - Scale out, not up
3. **Loose Coupling** - Independent, replaceable components
4. **Configuration Over Code** - Make changes without deployments
5. **Event-Driven** - Asynchronous, decoupled operations
6. **API-First** - Versioned, backward-compatible APIs

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  - Web App (Next.js)                                        │
│  - Mobile Apps (Future)                                     │
│  - Third-party Integrations                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│  - Routing                                                  │
│  - Rate Limiting                                            │
│  - Authentication                                           │
│  - API Versioning                                           │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Asset      │   │   User       │   │   Admin      │
│   Service    │   │   Service    │   │   Service    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EVENT BUS                                 │
│  - Asset Created                                            │
│  - Asset Updated                                            │
│  - User Subscribed                                          │
│  - Download Tracked                                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Search     │   │   Analytics  │   │   Storage    │
│   Service    │   │   Service    │   │   Service    │
└──────────────┘   └──────────────┘   └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  - PostgreSQL (Primary)                                     │
│  - Redis (Cache)                                            │
│  - Elasticsearch (Search)                                   │
│  - S3 (Storage)                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Extensible Format System

### Format Registry Pattern

**Problem**: Hard-coding formats limits extensibility

**Solution**: Dynamic format registry with plugin architecture

**Implementation**:

```typescript
// Format Registry Interface
interface FormatHandler {
  formatCode: string;
  formatName: string;
  formatCategory: 'vector' | 'raster' | 'video' | 'audio' | 'document';
  mimeTypes: string[];
  extensions: string[];
  validate: (buffer: Buffer) => Promise<ValidationResult>;
  extractMetadata: (buffer: Buffer) => Promise<Metadata>;
  generatePreview: (buffer: Buffer) => Promise<Buffer>;
  optimize?: (buffer: Buffer) => Promise<Buffer>;
}
```

**Database Schema**:
```sql
CREATE TABLE media_formats (
  id UUID PRIMARY KEY,
  format_code VARCHAR(20) UNIQUE NOT NULL,
  format_name VARCHAR(100) NOT NULL,
  format_category VARCHAR(20) NOT NULL,
  mime_types TEXT[] NOT NULL,
  extensions TEXT[] NOT NULL,
  handler_class VARCHAR(255), -- Plugin class name
  capabilities JSONB, -- {transparency: true, animation: false, ...}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Format Plugin System**:
```typescript
// Register new format at runtime
formatRegistry.register({
  formatCode: 'avif',
  formatName: 'AVIF',
  formatCategory: 'raster',
  mimeTypes: ['image/avif'],
  extensions: ['.avif'],
  validate: async (buffer) => { /* ... */ },
  extractMetadata: async (buffer) => { /* ... */ },
  generatePreview: async (buffer) => { /* ... */ },
});
```

**Benefits**:
- Add formats without code changes
- Format-specific logic isolated
- Easy to enable/disable formats
- Test formats independently

---

## 2. Extensible Asset Type System

### Asset Type Registry

**Problem**: Hard-coding asset types (flag, emblem, etc.) limits expansion

**Solution**: Dynamic asset type system with type-specific handlers

**Implementation**:

```typescript
interface AssetTypeHandler {
  typeCode: string;
  typeName: string;
  metadataSchema: JSONSchema; // Validation schema
  defaultVariants: string[];
  requiredFields: string[];
  optionalFields: string[];
  validateMetadata: (metadata: any) => Promise<ValidationResult>;
  processAsset: (asset: Asset) => Promise<void>;
  generateSearchTerms: (asset: Asset) => string[];
}
```

**Database Schema**:
```sql
CREATE TABLE asset_types (
  id UUID PRIMARY KEY,
  type_code VARCHAR(50) UNIQUE NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  metadata_schema JSONB NOT NULL, -- JSON Schema
  default_variants TEXT[],
  required_fields TEXT[],
  handler_class VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Extend flags table with type-specific fields
ALTER TABLE flags ADD COLUMN asset_type_code VARCHAR(50) 
  REFERENCES asset_types(type_code);
ALTER TABLE flags ADD COLUMN type_metadata JSONB; -- Type-specific data
```

**Type Plugin Example**:
```typescript
// Register new asset type
assetTypeRegistry.register({
  typeCode: 'coat_of_arms',
  typeName: 'Coat of Arms',
  metadataSchema: {
    type: 'object',
    properties: {
      heraldic_elements: { type: 'array' },
      shield_shape: { type: 'string' },
      colors: { type: 'array' },
    },
  },
  defaultVariants: ['flat', 'embossed', 'vintage'],
  validateMetadata: async (metadata) => { /* ... */ },
  generateSearchTerms: (asset) => {
    return [
      ...asset.metadata.heraldic_elements,
      asset.metadata.shield_shape,
    ];
  },
});
```

**Benefits**:
- Add new asset types without schema changes
- Type-specific validation and processing
- Flexible metadata structure
- Easy to extend admin UI per type

---

## 3. Extensible Admin Tools

### Plugin-Based Admin System

**Problem**: Hard-coding admin features limits customization

**Solution**: Admin plugin architecture with widget system

**Implementation**:

```typescript
interface AdminPlugin {
  id: string;
  name: string;
  version: string;
  routes: AdminRoute[];
  widgets: AdminWidget[];
  permissions: Permission[];
  initialize: (context: AdminContext) => Promise<void>;
}

interface AdminWidget {
  id: string;
  component: React.ComponentType;
  position: 'dashboard' | 'asset-detail' | 'sidebar';
  permissions: Permission[];
  config: WidgetConfig;
}
```

**Admin Plugin Registry**:
```typescript
// Register admin plugin
adminPluginRegistry.register({
  id: 'analytics-dashboard',
  name: 'Analytics Dashboard',
  version: '1.0.0',
  routes: [
    { path: '/admin/analytics', component: AnalyticsPage },
  ],
  widgets: [
    {
      id: 'download-stats',
      component: DownloadStatsWidget,
      position: 'dashboard',
      permissions: ['analytics:read'],
    },
  ],
  initialize: async (context) => {
    // Setup plugin
  },
});
```

**Database Schema**:
```sql
CREATE TABLE admin_plugins (
  id UUID PRIMARY KEY,
  plugin_id VARCHAR(100) UNIQUE NOT NULL,
  plugin_name VARCHAR(255) NOT NULL,
  version VARCHAR(20) NOT NULL,
  config JSONB,
  is_enabled BOOLEAN DEFAULT TRUE,
  installed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_widgets (
  id UUID PRIMARY KEY,
  plugin_id VARCHAR(100) REFERENCES admin_plugins(plugin_id),
  widget_id VARCHAR(100) NOT NULL,
  position VARCHAR(50) NOT NULL,
  config JSONB,
  display_order INTEGER,
  is_visible BOOLEAN DEFAULT TRUE,
  UNIQUE(plugin_id, widget_id)
);
```

**Benefits**:
- Add admin features without core changes
- Third-party plugins possible
- Customizable admin experience
- Easy to enable/disable features

---

## 4. Scalability Architecture

### Microservices Strategy

**Current**: Monolithic (for simplicity)
**Future**: Microservices (for scale)

**Migration Path**:
1. **Phase 1**: Modular monolith (current)
   - Clear service boundaries
   - Internal APIs
   - Shared database

2. **Phase 2**: Service extraction
   - Extract search service
   - Extract analytics service
   - Extract processing service

3. **Phase 3**: Full microservices
   - Independent deployments
   - Service databases
   - Event-driven communication

### Database Scaling

**Primary Database (PostgreSQL)**:
- **Read Replicas**: Scale reads horizontally
- **Partitioning**: Partition large tables by date/category
- **Connection Pooling**: PgBouncer for connection management
- **Query Optimization**: Indexes, materialized views

**Caching Layer (Redis)**:
- **Cache-Aside Pattern**: Cache frequently accessed data
- **Write-Through**: Cache writes immediately
- **Cache Invalidation**: Event-driven invalidation
- **Distributed Caching**: Redis Cluster for scale

**Search Database (Elasticsearch)**:
- **Index Sharding**: Distribute across nodes
- **Replication**: Multiple replicas per shard
- **Index Aliases**: Zero-downtime reindexing
- **Search Optimization**: Custom analyzers, filters

### Storage Scaling

**S3 Bucket Strategy**:
- **Lifecycle Policies**: Move old assets to cheaper storage
- **Versioning**: Enable for recovery
- **Cross-Region Replication**: Geographic distribution
- **CDN**: CloudFront/Cloudflare for delivery

**Storage Organization**:
```
s3://bucket/
  ├── {year}/
  │   ├── {month}/
  │   │   ├── {category}/
  │   │   │   └── {assets}
```

### Horizontal Scaling

**Application Servers**:
- **Stateless Design**: No server-side sessions
- **Load Balancing**: Round-robin, least connections
- **Auto-Scaling**: Scale based on CPU/memory/requests
- **Health Checks**: Automatic failover

**Worker Processes**:
- **Job Queue**: Bull/Redis for async processing
- **Worker Scaling**: Scale workers independently
- **Priority Queues**: Critical jobs first
- **Dead Letter Queue**: Failed job handling

---

## 5. Event-Driven Architecture

### Event Bus Pattern

**Problem**: Tight coupling between services

**Solution**: Event-driven communication

**Implementation**:

```typescript
interface Event {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  payload: any;
  metadata?: Record<string, any>;
}

// Event Types
type EventType =
  | 'asset:created'
  | 'asset:updated'
  | 'asset:deleted'
  | 'asset:published'
  | 'user:subscribed'
  | 'download:completed'
  | 'format:registered'
  | 'type:registered';
```

**Event Handlers**:
```typescript
// Search service listens for asset events
eventBus.on('asset:created', async (event) => {
  await searchService.indexAsset(event.payload.asset);
});

// Analytics service listens for download events
eventBus.on('download:completed', async (event) => {
  await analyticsService.trackDownload(event.payload);
});

// Storage service listens for asset deletion
eventBus.on('asset:deleted', async (event) => {
  await storageService.deleteAsset(event.payload.assetId);
});
```

**Benefits**:
- Loose coupling
- Easy to add new handlers
- Async processing
- Scalable architecture

---

## 6. Configuration Management

### Dynamic Configuration System

**Problem**: Hard-coded configuration requires deployments

**Solution**: Database-driven configuration with caching

**Implementation**:

```sql
CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50),
  is_public BOOLEAN DEFAULT FALSE, -- Can be exposed to frontend
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);
```

**Configuration Service**:
```typescript
class ConfigService {
  async get<T>(key: string, defaultValue?: T): Promise<T> {
    // Check cache first
    const cached = await redis.get(`config:${key}`);
    if (cached) return JSON.parse(cached);
    
    // Load from database
    const config = await db.query('SELECT value FROM system_config WHERE key = $1', [key]);
    const value = config.rows[0]?.value || defaultValue;
    
    // Cache for 5 minutes
    await redis.setex(`config:${key}`, 300, JSON.stringify(value));
    
    return value;
  }
  
  async set(key: string, value: any, userId: string): Promise<void> {
    await db.query(
      'INSERT INTO system_config (key, value, updated_by) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3',
      [key, JSON.stringify(value), userId]
    );
    
    // Invalidate cache
    await redis.del(`config:${key}`);
    
    // Emit event
    eventBus.emit('config:updated', { key, value });
  }
}
```

**Usage**:
```typescript
// Get configuration
const maxFileSize = await configService.get('upload.max_file_size', 500 * 1024 * 1024);
const allowedFormats = await configService.get('upload.allowed_formats', ['svg', 'png']);

// Update configuration (admin only)
await configService.set('upload.max_file_size', 1000 * 1024 * 1024, userId);
```

---

## 7. API Versioning

### Versioned API Strategy

**Problem**: Breaking changes break clients

**Solution**: URL-based versioning with backward compatibility

**Implementation**:

```typescript
// API Routes
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
app.use('/api/v3', v3Router); // Latest

// Version negotiation
app.use('/api', (req, res, next) => {
  const version = req.headers['api-version'] || 'v3';
  req.apiVersion = version;
  next();
});
```

**Backward Compatibility**:
- Maintain old endpoints
- Deprecation warnings
- Migration guides
- Sunset dates

---

## 8. Search & Indexing

### Elasticsearch Architecture

**Index Strategy**:
```typescript
// Asset index mapping
const assetIndexMapping = {
  properties: {
    id: { type: 'keyword' },
    title: { 
      type: 'text',
      analyzer: 'english',
      fields: {
        keyword: { type: 'keyword' },
      },
    },
    description: { type: 'text', analyzer: 'english' },
    tags: { type: 'keyword' },
    category: { type: 'keyword' },
    asset_type: { type: 'keyword' },
    country_code: { type: 'keyword' },
    is_premium: { type: 'boolean' },
    status: { type: 'keyword' },
    created_at: { type: 'date' },
    download_count: { type: 'integer' },
    // Type-specific fields (dynamic)
    type_metadata: { type: 'object', enabled: true },
  },
};
```

**Indexing Strategy**:
- **Real-time**: Index on create/update
- **Bulk Indexing**: Batch updates for efficiency
- **Reindexing**: Zero-downtime reindexing with aliases
- **Sharding**: Distribute across nodes

---

## 9. Performance Optimization

### Caching Strategy

**Multi-Level Caching**:
1. **Browser Cache**: Static assets, long TTL
2. **CDN Cache**: Public assets, medium TTL
3. **Application Cache**: Frequently accessed data, short TTL
4. **Database Cache**: Query results, very short TTL

**Cache Keys**:
```typescript
// Asset cache
`asset:${assetId}`
`asset:${assetId}:formats`
`asset:${assetId}:variants`

// Search cache
`search:${query}:${filters}:${page}`

// User cache
`user:${userId}`
`user:${userId}:subscription`
```

### Database Optimization

**Indexing Strategy**:
- **Primary Keys**: UUIDs for distributed systems
- **Foreign Keys**: Indexed for joins
- **Search Fields**: Full-text indexes
- **Composite Indexes**: Common query patterns
- **Partial Indexes**: Filtered indexes (e.g., published only)

**Query Optimization**:
- **Connection Pooling**: Reuse connections
- **Prepared Statements**: SQL injection prevention + performance
- **Query Analysis**: EXPLAIN ANALYZE for slow queries
- **Materialized Views**: Pre-computed aggregations

---

## 10. Monitoring & Observability

### Metrics Collection

**Application Metrics**:
- Request rate
- Response times
- Error rates
- Cache hit rates
- Database query times

**Business Metrics**:
- Asset upload rate
- Download rate
- Subscription conversions
- Revenue metrics

### Logging Strategy

**Structured Logging**:
```typescript
logger.info('Asset created', {
  assetId: asset.id,
  userId: user.id,
  format: asset.format,
  duration: 1234,
  requestId: req.id,
});
```

**Log Aggregation**:
- Centralized logging (ELK, Datadog, etc.)
- Log retention policies
- Searchable logs
- Alerting on errors

---

## Architectural Decisions

### 1. Why Plugin Architecture?

**Decision**: Plugin-based system for formats, types, and admin tools

**Rationale**:
- **Extensibility**: Add features without core changes
- **Maintainability**: Isolated, testable components
- **Flexibility**: Enable/disable features dynamically
- **Third-party**: Allow external plugins

**Trade-offs**:
- More complex initial setup
- Plugin management overhead
- Security considerations

### 2. Why Event-Driven?

**Decision**: Event bus for service communication

**Rationale**:
- **Decoupling**: Services don't know about each other
- **Scalability**: Easy to add new handlers
- **Resilience**: Failed handlers don't block others
- **Auditability**: All events logged

**Trade-offs**:
- Eventual consistency
- Debugging complexity
- Message ordering challenges

### 3. Why Database-Driven Configuration?

**Decision**: Store configuration in database, not code

**Rationale**:
- **No Deployment**: Change config without code deploy
- **Dynamic**: Update at runtime
- **Auditable**: Track who changed what
- **Multi-tenant**: Different configs per tenant (future)

**Trade-offs**:
- Database dependency
- Cache invalidation complexity

### 4. Why Microservices Path?

**Decision**: Start monolithic, design for microservices

**Rationale**:
- **Simplicity**: Easier to start, faster development
- **Cost**: Lower operational overhead initially
- **Migration**: Clear path to microservices when needed
- **Flexibility**: Extract services when they need to scale

**Trade-offs**:
- May need to refactor later
- Service boundaries must be clear from start

### 5. Why Horizontal Scaling?

**Decision**: Design for horizontal, not vertical scaling

**Rationale**:
- **Cost**: Commodity hardware cheaper
- **Reliability**: No single point of failure
- **Elasticity**: Scale based on demand
- **Cloud-native**: Works with cloud providers

**Trade-offs**:
- Stateless design required
- Distributed system complexity
- Network latency considerations

---

## Migration Path

### Phase 1: Foundation (Current)
- Modular monolith
- Plugin architecture
- Event system
- Configuration system

### Phase 2: Scale (1M+ assets)
- Read replicas
- Redis caching
- Elasticsearch search
- CDN optimization

### Phase 3: Microservices (10M+ assets)
- Extract search service
- Extract analytics service
- Extract processing service
- Service mesh

### Phase 4: Global Scale (100M+ assets)
- Multi-region deployment
- Global CDN
- Regional databases
- Edge computing

---

This architecture provides a solid foundation for growth from thousands to millions of assets while maintaining flexibility and extensibility.
