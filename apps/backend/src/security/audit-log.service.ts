// Audit Logging Service
// Comprehensive audit trail for admin actions

import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export type AuditAction = 
  | 'auth:login'
  | 'auth:logout'
  | 'auth:login_failed'
  | 'auth:mfa_verify'
  | 'auth:password_change'
  | 'auth:token_refresh'
  | 'asset:create'
  | 'asset:update'
  | 'asset:delete'
  | 'asset:upload'
  | 'asset:download'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'user:role_change'
  | 'category:create'
  | 'category:update'
  | 'category:delete'
  | 'tag:create'
  | 'tag:update'
  | 'tag:delete'
  | 'subscription:create'
  | 'subscription:update'
  | 'subscription:cancel'
  | 'system:config_change'
  | 'permission:denied'
  | 'rate_limit:exceeded';

export type AuditStatus = 'success' | 'failure' | 'warning';

export interface AuditLogEntry {
  id?: string;
  timestamp?: Date;
  user_id?: string;
  user_email?: string;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  status: AuditStatus;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class AuditLogService {
  /**
   * Log audit event
   */
  async log(entry: AuditLogEntry): Promise<string> {
    const id = entry.id || uuidv4();
    const timestamp = entry.timestamp || new Date();

    await pool.query(
      `INSERT INTO audit_logs (
         id, timestamp, user_id, user_email, action,
         resource_type, resource_id, ip_address, user_agent,
         request_id, status, details, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        timestamp,
        entry.user_id || null,
        entry.user_email || null,
        entry.action,
        entry.resource_type || null,
        entry.resource_id || null,
        entry.ip_address || null,
        entry.user_agent || null,
        entry.request_id || null,
        entry.status,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ]
    );

    return id;
  }

  /**
   * Log authentication event
   */
  async logAuth(
    action: 'login' | 'logout' | 'login_failed' | 'mfa_verify',
    userId: string | null,
    userEmail: string | null,
    ipAddress: string,
    userAgent: string,
    status: AuditStatus,
    details?: Record<string, any>
  ): Promise<string> {
    return this.log({
      action: `auth:${action}` as AuditAction,
      user_id: userId || undefined,
      user_email: userEmail || undefined,
      ip_address: ipAddress,
      user_agent: userAgent,
      status,
      details,
    });
  }

  /**
   * Log asset operation
   */
  async logAsset(
    action: 'create' | 'update' | 'delete' | 'upload' | 'download',
    userId: string,
    userEmail: string,
    assetId: string,
    ipAddress: string,
    userAgent: string,
    status: AuditStatus,
    details?: Record<string, any>
  ): Promise<string> {
    return this.log({
      action: `asset:${action}` as AuditAction,
      user_id: userId,
      user_email: userEmail,
      resource_type: 'asset',
      resource_id: assetId,
      ip_address: ipAddress,
      user_agent: userAgent,
      status,
      details,
    });
  }

  /**
   * Log permission denied
   */
  async logPermissionDenied(
    userId: string,
    userEmail: string,
    action: string,
    resourceType: string,
    resourceId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    return this.log({
      action: 'permission:denied',
      user_id: userId,
      user_email: userEmail,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'failure',
      details: {
        attempted_action: action,
      },
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    identifier: string,
    endpoint: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    return this.log({
      action: 'rate_limit:exceeded',
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'warning',
      details: {
        identifier,
        endpoint,
      },
    });
  }

  /**
   * Query audit logs
   */
  async queryLogs(filters: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    resourceId?: string;
    status?: AuditStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters.action) {
      query += ` AND action = $${paramIndex}`;
      params.push(filters.action);
      paramIndex++;
    }

    if (filters.resourceType) {
      query += ` AND resource_type = $${paramIndex}`;
      params.push(filters.resourceType);
      paramIndex++;
    }

    if (filters.resourceId) {
      query += ` AND resource_id = $${paramIndex}`;
      params.push(filters.resourceId);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
      paramIndex++;
    }

    const result = await pool.query(query, params);

    return result.rows.map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      user_id: row.user_id,
      user_email: row.user_email,
      action: row.action,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      request_id: row.request_id,
      status: row.status,
      details: row.details ? JSON.parse(row.details) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Archive old logs (move to S3)
   */
  async archiveLogs(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await pool.query(
      `SELECT * FROM audit_logs WHERE timestamp < $1`,
      [cutoffDate]
    );

    // TODO: Upload to S3
    // For now, just delete (in production, archive first)
    await pool.query(
      `DELETE FROM audit_logs WHERE timestamp < $1`,
      [cutoffDate]
    );

    return result.rows.length;
  }
}

export const auditLogService = new AuditLogService();
