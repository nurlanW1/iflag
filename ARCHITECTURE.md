# Architecture Documentation

## System Overview

Flag Stock Marketplace is a production-ready commercial stock marketplace built with a modern, scalable architecture.

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: CSS with custom design system
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: Express.js 5
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet, CORS, Rate Limiting
- **Image Processing**: Sharp

### Infrastructure
- **Monorepo**: npm workspaces
- **Database**: PostgreSQL (Docker or managed)
- **Storage**: Local filesystem (dev) / S3 (production)
- **Deployment**: Docker-ready

## Architecture Patterns

### Monorepo Structure
```
iflag/
├── apps/          # Applications
│   ├── backend/   # API server
│   └── frontend/  # Web application
└── packages/      # Shared libraries
    ├── asset-types/
    ├── watermarking/
    ├── storage/
    └── preview-generation/
```

### Backend Architecture

#### Layered Architecture
1. **Routes Layer**: HTTP request handling
2. **Service Layer**: Business logic
3. **Data Layer**: Database access

#### Key Components

**Authentication System**
- JWT-based authentication
- Refresh token rotation
- Role-based access control (RBAC)
- Secure password hashing (bcrypt)

**Asset Management**
- CRUD operations
- Full-text search (PostgreSQL)
- Tag and category system
- File metadata tracking

**Subscription System**
- Plan management
- Subscription lifecycle
- Premium access verification
- Stripe integration ready

**Security Middleware**
- Helmet for security headers
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention (parameterized queries)

### Frontend Architecture

#### Component Structure
- **Pages**: Next.js App Router pages
- **Components**: Reusable UI components
- **Contexts**: Global state (Auth)
- **Lib**: Utilities and API client

#### State Management
- React Context for authentication
- Local state for component-specific data
- Server state via API calls

#### API Client
- Axios-based client
- Automatic token injection
- Token refresh on 401
- Error handling

## Database Design

### Core Tables

**users**
- User accounts with authentication
- Role-based permissions
- Email verification status

**assets**
- Flag assets with metadata
- File URLs and dimensions
- Premium/free flag
- Full-text search support

**user_subscriptions**
- Active subscriptions
- Period tracking
- Status management

**asset_categories** & **tags**
- Hierarchical categories
- Flexible tagging system

**downloads**
- Download tracking
- Analytics data
- User behavior insights

### Indexes
- Full-text search on assets
- Foreign key indexes
- Status and type indexes
- GIN indexes for arrays

## Security Architecture

### Authentication Flow
1. User registers/logs in
2. Server validates credentials
3. JWT access token + refresh token issued
4. Client stores tokens
5. API requests include access token
6. Token refresh on expiration

### Authorization
- **Public**: Browse assets, view details
- **User**: Download free assets, manage profile
- **Premium User**: Download premium assets
- **Admin**: Full CRUD access, user management

### Security Measures
- Password hashing (bcrypt, 12 rounds)
- JWT token expiration
- Refresh token rotation
- Rate limiting
- CORS protection
- SQL injection prevention
- XSS protection (Helmet)

## API Design

### RESTful Principles
- Resource-based URLs
- HTTP methods (GET, POST, PUT, DELETE)
- Status codes
- JSON responses

### Error Handling
- Consistent error format
- Appropriate HTTP status codes
- Error logging
- User-friendly messages

### Rate Limiting
- General: 100 requests/15min
- Auth: 5 requests/15min
- Per IP address

## Storage Architecture

### Abstraction Layer
- `StorageProvider` interface
- Local and S3 implementations
- Easy switching between providers

### File Organization
- Organized by asset type
- Unique filenames
- Metadata tracking

## Watermarking System

### Process
1. Check user subscription status
2. If no premium: apply watermark
3. Server-side image processing
4. Return watermarked image

### Implementation
- Sharp for image processing
- SVG watermark overlay
- Configurable options
- Multiple watermark positions

## Preview Generation

### Features
- Thumbnail generation
- Optimized previews
- Multiple sizes (responsive)
- Format conversion

## Deployment Architecture

### Development
- Local PostgreSQL (Docker)
- Local file storage
- Hot reload enabled

### Production
- Managed PostgreSQL
- S3-compatible storage
- CDN for assets
- Process manager (PM2)
- Environment variables
- SSL/TLS

## Scalability Considerations

### Database
- Indexed queries
- Connection pooling
- Query optimization
- Read replicas (future)

### API
- Stateless design
- Horizontal scaling ready
- Caching opportunities
- CDN integration

### Storage
- S3 for scalability
- CDN for delivery
- Image optimization
- Lazy loading

## Monitoring & Logging

### Logging
- Console logging (dev)
- Structured logging (production)
- Error tracking
- Audit logs for admin actions

### Metrics (Future)
- Request rates
- Error rates
- Response times
- Database performance

## Testing Strategy

### Unit Tests
- Service layer functions
- Utility functions
- Business logic

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- User workflows
- Critical paths
- Payment flows

## Performance Optimization

### Frontend
- Next.js automatic optimizations
- Image optimization
- Code splitting
- Lazy loading

### Backend
- Database query optimization
- Connection pooling
- Caching strategies
- Compression

## Future Enhancements

- Stripe payment integration
- Email notifications
- Advanced analytics
- Multi-language support
- Video processing
- Mobile app API
- GraphQL API option
- Real-time features
