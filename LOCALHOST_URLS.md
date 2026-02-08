# Localhost URLs - Quick Reference

## Development URLs

### Frontend (Next.js)
- **URL**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **Assets**: http://localhost:3000/assets
- **Subscriptions**: http://localhost:3000/subscriptions

### Backend API (Express)
- **Base URL**: http://localhost:4000
- **API Root**: http://localhost:4000/api
- **Health Check**: http://localhost:4000/health
- **API Info**: http://localhost:4000/

### API Endpoints

#### Authentication
- **Register**: http://localhost:4000/api/auth/register
- **Login**: http://localhost:4000/api/auth/login
- **Refresh Token**: http://localhost:4000/api/auth/refresh-token
- **Current User**: http://localhost:4000/api/auth/me

#### Assets
- **List Assets**: http://localhost:4000/api/assets
- **Get Asset**: http://localhost:4000/api/assets/:id
- **Get Asset by Slug**: http://localhost:4000/api/assets/slug/:slug
- **Download**: http://localhost:4000/api/assets/:id/download

#### Admin (Requires Admin Role)
- **Dashboard**: http://localhost:4000/api/admin/dashboard
- **Upload Assets**: http://localhost:4000/api/admin/upload/direct
- **List Assets**: http://localhost:4000/api/admin/assets
- **Get Asset**: http://localhost:4000/api/admin/assets/:id
- **Update Asset**: http://localhost:4000/api/admin/assets/:id
- **Delete Asset**: http://localhost:4000/api/admin/assets/:id
- **Categories**: http://localhost:4000/api/admin/categories
- **Tags**: http://localhost:4000/api/admin/tags
- **Stats**: http://localhost:4000/api/admin/assets/:id/stats

#### Admin Upload
- **Initiate Upload**: http://localhost:4000/api/admin/upload/initiate
- **Upload Chunk**: http://localhost:4000/api/admin/upload/chunk
- **Complete Upload**: http://localhost:4000/api/admin/upload/complete
- **Direct Upload**: http://localhost:4000/api/admin/upload/direct
- **Upload Status**: http://localhost:4000/api/admin/upload/status/:upload_id

#### Subscriptions
- **Plans**: http://localhost:4000/api/subscriptions/plans
- **My Subscription**: http://localhost:4000/api/subscriptions/my-subscription
- **Subscribe**: http://localhost:4000/api/subscriptions/subscribe
- **Check Premium**: http://localhost:4000/api/subscriptions/check-premium

### Database (PostgreSQL)
- **Host**: localhost
- **Port**: 5432
- **Database**: flagstock
- **User**: user
- **Password**: password
- **Connection String**: `postgresql://user:password@localhost:5432/flagstock`

### Redis (if running)
- **Host**: localhost
- **Port**: 6379
- **URL**: redis://localhost:6379

---

## Quick Start Commands

### Start Database
```bash
docker-compose up -d
```

### Start Backend
```bash
cd apps/backend
npm run dev
# Backend runs on http://localhost:4000
```

### Start Frontend
```bash
cd apps/frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Check Health
```bash
curl http://localhost:4000/health
```

---

## Environment Variables

### Backend (.env)
```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/flagstock
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

## Testing URLs

### Test Backend API
```bash
# Health check
curl http://localhost:4000/health

# API info
curl http://localhost:4000/

# Test endpoint (if exists)
curl http://localhost:4000/api/assets
```

### Test Frontend
- Open browser: http://localhost:3000
- Check console for errors
- Test admin panel: http://localhost:3000/admin

---

## Common Issues

### Port Already in Use
- **Backend (4000)**: Change `PORT` in `.env` or kill process using port 4000
- **Frontend (3000)**: Next.js will automatically use next available port (3001, 3002, etc.)

### Database Connection Failed
- Check if Docker container is running: `docker ps`
- Check database logs: `docker-compose logs db`
- Verify connection string in `.env`

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
- Check CORS configuration in `apps/backend/src/index.ts`

---

## Development Workflow

1. **Start Database**: `docker-compose up -d`
2. **Start Backend**: `cd apps/backend && npm run dev`
3. **Start Frontend**: `cd apps/frontend && npm run dev`
4. **Access Frontend**: http://localhost:3000
5. **Access Admin**: http://localhost:3000/admin (requires login)

---

All URLs are for local development. Change ports/hosts as needed for your setup.
