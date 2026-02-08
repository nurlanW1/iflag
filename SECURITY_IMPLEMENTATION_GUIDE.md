# Security Implementation Guide
## Step-by-Step Security Setup

## 1. Install Dependencies

```bash
cd apps/backend
npm install otplib qrcode ioredis @types/otplib @types/qrcode
```

## 2. Environment Variables

```env
# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MFA
MFA_ISSUER=Flag Stock Admin
ENCRYPTION_KEY=your-32-character-encryption-key!!

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379

# Security
ALLOWED_DOMAINS=flagstock.com,www.flagstock.com,admin.flagstock.com
REQUIRE_MFA=true
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

## 3. Database Migration

```bash
psql $DATABASE_URL -f apps/backend/src/db/schema-security.sql
```

## 4. Setup MFA for Admin Users

```typescript
// In admin setup script
import { mfaService } from './auth/mfa.service';

const setup = await mfaService.generateSecret(userId, email);
// Display QR code to user
// Store backup codes securely
await mfaService.enableMFA(userId);
```

## 5. Apply Security Middleware

```typescript
// In admin routes
import {
  adminSecurityMiddleware,
  authorizePermission,
  auditLog,
} from '../security/admin-security.middleware';

router.post(
  '/admin/assets',
  ...adminSecurityMiddleware,
  authorizePermission('assets:write'),
  auditLog('asset:create', 'asset'),
  uploadHandler
);
```

## 6. Configure Rate Limiting

```typescript
// Custom rate limits for specific endpoints
router.post(
  '/admin/login',
  rateLimitMiddleware, // Uses login-specific limits
  loginHandler
);

router.post(
  '/admin/upload',
  rateLimitMiddleware, // Uses upload-specific limits
  uploadHandler
);
```

## 7. Enable Audit Logging

```typescript
// Automatic logging via middleware
router.use('/admin', auditLog('admin:access', 'system'));

// Manual logging
await auditLogService.logAsset(
  'create',
  userId,
  userEmail,
  assetId,
  ipAddress,
  userAgent,
  'success',
  { asset_title: 'Flag Name' }
);
```

## 8. File Upload Security

```typescript
import { fileUploadSecurityService } from './security/file-upload-security';

const securityCheck = await fileUploadSecurityService.checkFile({
  buffer: file.buffer,
  filename: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
});

if (!securityCheck.safe) {
  return res.status(400).json({
    error: 'File security check failed',
    threats: securityCheck.threats,
  });
}
```

## 9. Security Monitoring

### Set up alerts for:
- Multiple failed logins
- Permission denied events
- Rate limit exceeded
- File upload security failures
- Unusual admin activity

### Query audit logs:

```typescript
// Get recent security events
const logs = await auditLogService.queryLogs({
  action: 'permission:denied',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  limit: 100,
});

// Get user activity
const userLogs = await auditLogService.queryLogs({
  userId: userId,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});
```

## 10. Security Best Practices

### Password Policy
- Minimum 12 characters
- Enforce complexity
- Password history
- Force change every 90 days

### Account Security
- Lock after 5 failed attempts
- 15-minute lockout
- Email notifications
- Suspicious activity alerts

### Network Security
- HTTPS only
- HSTS headers
- Secure cookies
- CORS restrictions

### Regular Maintenance
- Review audit logs weekly
- Archive old logs monthly
- Update security patches
- Rotate encryption keys quarterly

---

## Testing Security

### Test MFA
```bash
curl -X POST http://localhost:4000/api/admin/auth/mfa/setup \
  -H "Authorization: Bearer $TOKEN"

# Scan QR code with authenticator app
# Verify with TOTP code
```

### Test Rate Limiting
```bash
# Should fail after 5 attempts
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/admin/login \
    -d '{"email":"admin@example.com","password":"wrong"}'
done
```

### Test File Upload Security
```bash
# Upload malicious file (should be rejected)
curl -X POST http://localhost:4000/api/admin/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@malicious.php"
```

### Test Authorization
```bash
# Try to access without permission (should fail)
curl -X DELETE http://localhost:4000/api/admin/users/123 \
  -H "Authorization: Bearer $TOKEN"
```

---

This guide provides complete security implementation for the admin system.
