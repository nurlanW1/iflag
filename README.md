# Flag Stock Marketplace

A production-ready commercial stock marketplace website for world country flags, international organization flags, related symbols (coats of arms, emblems), and flag videos/animated assets.

This platform is comparable in quality to Shutterstock, Freepik, and Envato Elements.

## 🏗️ Architecture

This is a monorepo built with:
- **Frontend**: Next.js 16 with React 19, TypeScript
- **Backend**: Express.js with TypeScript, PostgreSQL
- **Shared Packages**: Asset types, watermarking, storage, preview generation

## 🚀 Features

### Core Features
- ✅ User authentication & authorization (JWT-based)
- ✅ Role-based access control (User/Admin)
- ✅ Subscription management (Weekly/Monthly plans)
- ✅ Asset management (Flags, Symbols, Videos, Animated assets)
- ✅ Search & filtering (Full-text search, categories, tags)
- ✅ Watermarking system for free assets
- ✅ Preview generation & thumbnails
- ✅ Download tracking & analytics
- ✅ Professional UI/UX with modern design system
- ✅ Responsive layout
- ✅ API security (Rate limiting, CORS, input validation)

### Business Model
- Free assets with watermark
- Premium assets via subscription
- Weekly and Monthly premium plans

## 📁 Project Structure

```
iflag/
├── apps/
│   ├── backend/          # Express.js API server
│   │   ├── src/
│   │   │   ├── auth/     # Authentication & authorization
│   │   │   ├── assets/   # Asset management
│   │   │   ├── subscriptions/ # Subscription management
│   │   │   ├── db/       # Database schema & migrations
│   │   │   └── index.ts  # Server entry point
│   │   └── package.json
│   │
│   └── frontend/         # Next.js frontend
│       ├── src/
│       │   ├── app/      # Next.js app router pages
│       │   ├── components/ # React components
│       │   ├── contexts/ # React contexts (Auth)
│       │   └── lib/      # Utilities & API client
│       └── package.json
│
└── packages/             # Shared packages
    ├── asset-types/      # TypeScript types for assets
    ├── watermarking/     # Image watermarking service
    ├── storage/          # Storage abstraction (Local/S3)
    └── preview-generation/ # Thumbnail & preview generation
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+
- Docker (optional, for database)

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Option A: Using Docker Compose
```bash
docker-compose up -d
```

#### Option B: Manual PostgreSQL Setup
Create a PostgreSQL database named `flagstock` and update the connection string in `.env`.

### 3. Environment Configuration

#### Backend
```bash
cd apps/backend
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `FRONTEND_URL`: Frontend URL for CORS

#### Frontend
```bash
cd apps/frontend
cp .env.example .env.local
# Edit .env.local with your configuration
```

Required environment variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL

### 4. Database Migration

The database schema will be automatically initialized on first backend startup.

### 5. Run Development Servers

#### Backend
```bash
cd apps/backend
npm run dev
```

Backend will run on `http://localhost:4000`

#### Frontend
```bash
cd apps/frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📊 Database Schema

The database includes:
- **users**: User accounts with role-based access
- **subscription_plans**: Available subscription plans
- **user_subscriptions**: Active user subscriptions
- **assets**: Flag assets (flags, symbols, videos, etc.)
- **asset_categories**: Asset categorization
- **tags**: Asset tags for filtering
- **asset_tags**: Many-to-many relationship
- **downloads**: Download tracking & analytics
- **refresh_tokens**: JWT refresh token storage
- **admin_audit_log**: Admin action logging

## 🔐 Authentication

The system uses JWT-based authentication with refresh tokens:
- Access tokens expire in 15 minutes (configurable)
- Refresh tokens expire in 30 days
- Tokens are stored in localStorage (frontend)
- Automatic token refresh on API calls

## 💳 Subscription System

### Plans
- **Weekly Premium**: 7 days, $9.99
- **Monthly Premium**: 30 days, $29.99

### Features
- Subscription status tracking
- Automatic expiration
- Cancel at period end
- Premium access verification

## 🎨 Asset Management

### Asset Types
- Flags (country flags)
- Symbols
- Videos
- Animated assets
- Coats of arms
- Emblems

### Asset Properties
- Title, description, slug
- File URLs (original, preview, thumbnail)
- Metadata (dimensions, format, size)
- Premium/free flag
- Categories and tags
- Download tracking

## 🔍 Search & Filtering

- Full-text search on title and description
- Filter by asset type
- Filter by category
- Filter by tags
- Filter by country code
- Filter by premium/free
- Sort by newest, oldest, popular, title

## 🖼️ Watermarking

Free/premium assets without subscription get watermarked previews:
- Server-side image processing with Sharp
- Configurable watermark text and position
- SVG-based watermark overlay

## 📦 Storage

Storage abstraction supports:
- **Local filesystem**: For development
- **S3-compatible**: For production (AWS S3, DigitalOcean Spaces, etc.)

Configure via environment variables.

## 🚀 Production Deployment

### Backend
1. Set production environment variables
2. Build: `npm run build`
3. Start: `npm start`
4. Use process manager (PM2, systemd, etc.)

### Frontend
1. Set production environment variables
2. Build: `npm run build`
3. Start: `npm start`
4. Or deploy to Vercel/Netlify

### Database
- Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- Run migrations on deployment
- Set up regular backups

### Security Checklist
- [ ] Change JWT_SECRET to strong random value
- [ ] Use HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable database SSL
- [ ] Set up monitoring & logging
- [ ] Configure firewall rules

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Assets
- `GET /api/assets` - Search and filter assets
- `GET /api/assets/:id` - Get asset by ID
- `GET /api/assets/slug/:slug` - Get asset by slug
- `GET /api/assets/:id/download` - Get download URL
- `POST /api/assets` - Create asset (admin)
- `PUT /api/assets/:id` - Update asset (admin)
- `DELETE /api/assets/:id` - Delete asset (admin)

### Subscriptions
- `GET /api/subscriptions/plans` - Get available plans
- `GET /api/subscriptions/my-subscription` - Get user subscription
- `GET /api/subscriptions/check-premium` - Check premium status

## 📝 TODO / Roadmap

- [ ] Complete admin CMS with full CRUD operations
- [ ] Stripe payment integration
- [ ] Email notifications
- [ ] Asset upload interface
- [ ] Bulk asset operations
- [ ] Advanced analytics dashboard
- [ ] CDN integration for asset delivery
- [ ] Video processing & preview generation
- [ ] Multi-language support
- [ ] SEO optimization

## 🤝 Contributing

This is a commercial project. For contributions, please contact the project maintainers.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues and questions, please contact the development team.

---

Built with ❤️ for the flag asset marketplace
