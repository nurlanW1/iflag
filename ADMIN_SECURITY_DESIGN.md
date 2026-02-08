# Admin System Security Architecture
## Production-Ready Security Implementation

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                           │
│  - HTTPS only                                                │
│  - Secure cookies                                           │
│  - CSRF tokens                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NETWORK LAYER                              │
│  - DDoS protection                                          │
│  - Rate limiting                                             │
│  - IP whitelisting (optional)                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                          │
│  - Authentication (JWT + MFA)                              │
│  - Authorization (RBAC)                                      │
│  - Input validation                                         │
│  - File upload security                                     │
│  - Audit logging                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  - Encrypted storage                                        │
│  - SQL injection prevention                                 │
│  - Parameterized queries                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Admin Authentication

### Multi-Factor Authentication (MFA)

**Implementation:**
- TOTP (Time-based One-Time Password)
- Backup codes
- SMS/Email as backup (optional)

**Flow:**
1. Username/password login
2. Generate MFA challenge
3. User enters TOTP code
4. Verify and issue JWT token
5. Store MFA session

### Session Management

**JWT Token Structure:**
```json
{
  "userId": "uuid",
  "role": "admin",
  "mfaVerified": true,
  "sessionId": "uuid",
  "ip": "192.168.1.1",
  "userAgent": "...",
  "exp": 1234567890,
  "iat": 1234567800
}
```

**Token Expiration:**
- Access token: 15 minutes
- Refresh token: 7 days
- MFA session: 24 hours

**Security Features:**
- Token rotation on refresh
- Device fingerprinting
- IP validation
- Concurrent session limits

---

## 2. Role Isolation

### Role-Based Access Control (RBAC)

**Roles:**
- `super_admin` - Full system access
- `admin` - Content management
- `moderator` - Limited content access
- `viewer` - Read-only access

**Permissions Matrix:**

| Action | super_admin | admin | moderator | viewer |
|--------|-------------|-------|-----------|--------|
| View assets | ✅ | ✅ | ✅ | ✅ |
| Upload assets | ✅ | ✅ | ✅ | ❌ |
| Delete assets | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| System config | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ |

### Resource-Level Access Control

**Fine-Grained Permissions:**
- Category-based access
- Asset-level permissions
- Time-based restrictions
- Geographic restrictions (optional)

---

## 3. File Upload Security

### Validation Layers

**Layer 1: Client-Side**
- File type validation
- Size limits
- Basic format check

**Layer 2: Server-Side**
- Magic number verification
- MIME type validation
- File extension validation
- Size limits (hard)

**Layer 3: Content Analysis**
- Virus scanning (ClamAV)
- Malware detection
- Content inspection
- Metadata extraction

**Layer 4: Sanitization**
- Filename sanitization
- Path traversal prevention
- Content sanitization (if applicable)

### Upload Restrictions

**File Types:**
- Whitelist only
- No executable files
- No scripts
- No archives (unless explicitly allowed)

**Size Limits:**
- Per file: 500MB
- Per upload: 2GB
- Total per user: 10GB/day

**Rate Limits:**
- 10 uploads/minute
- 100 uploads/hour
- 500 uploads/day

---

## 4. Access Control

### API Endpoint Protection

**Middleware Chain:**
1. Rate limiting
2. Authentication
3. Authorization
4. Input validation
5. Audit logging

### Resource Protection

**Pattern:**
```typescript
router.post('/admin/assets/:id', 
  rateLimit,
  authenticateAdmin,
  authorizeAction('assets:write'),
  validateInput,
  auditLog,
  handler
);
```

### IP Whitelisting (Optional)

**Configuration:**
- Admin panel IP whitelist
- VPN requirement
- Geographic restrictions

---

## 5. Rate Limiting

### Multi-Level Rate Limiting

**Level 1: Global**
- 1000 requests/minute per IP
- 10000 requests/hour per IP

**Level 2: Per User**
- 500 requests/minute per user
- 5000 requests/hour per user

**Level 3: Per Endpoint**
- Login: 5 attempts/minute
- Upload: 10/minute
- Delete: 20/minute

**Level 4: Per Resource**
- Asset operations: 100/hour
- User operations: 50/hour

### Rate Limit Storage

**Redis-based:**
- Sliding window algorithm
- Distributed rate limiting
- Real-time tracking

---

## 6. Audit Logging

### Logged Events

**Authentication:**
- Login attempts (success/failure)
- Logout
- MFA verification
- Password changes
- Token refresh

**Authorization:**
- Permission denied events
- Role changes
- Access attempts

**Data Operations:**
- Asset creation
- Asset updates
- Asset deletion
- Bulk operations

**System Operations:**
- Configuration changes
- User management
- System settings

### Log Structure

```json
{
  "id": "uuid",
  "timestamp": "2024-01-15T12:00:00Z",
  "user_id": "uuid",
  "user_email": "admin@example.com",
  "action": "asset:create",
  "resource_type": "asset",
  "resource_id": "uuid",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "request_id": "uuid",
  "status": "success",
  "details": {
    "asset_title": "United States Flag",
    "file_name": "usa-flag.svg"
  },
  "metadata": {
    "duration_ms": 1234,
    "response_size": 1024
  }
}
```

### Log Storage

**Short-term (30 days):**
- PostgreSQL (searchable)
- Full details
- Fast queries

**Long-term (1 year):**
- S3 (compressed)
- Archived format
- Compliance retention

---

## Security Best Practices

### Password Policy

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common passwords
- Password history (last 5)
- Force change every 90 days

### Account Security

- Account lockout after 5 failed attempts
- Lockout duration: 15 minutes
- Suspicious activity alerts
- Email notifications for security events

### Network Security

- HTTPS only (TLS 1.2+)
- HSTS headers
- Secure cookies (HttpOnly, Secure, SameSite)
- CORS restrictions

### Data Protection

- Encryption at rest
- Encryption in transit
- PII masking in logs
- Secure key management

---

## Incident Response

### Security Alerts

**Critical:**
- Multiple failed logins
- Unauthorized access attempts
- File upload anomalies
- System configuration changes

**Warning:**
- Rate limit exceeded
- Unusual access patterns
- Large file uploads
- Bulk operations

### Response Procedures

1. **Detect** - Automated alerts
2. **Analyze** - Review audit logs
3. **Contain** - Block IP/user
4. **Remediate** - Fix vulnerability
5. **Document** - Incident report

---

This architecture provides defense-in-depth security for the admin system.
