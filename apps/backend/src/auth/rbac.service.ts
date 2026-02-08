// Role-Based Access Control Service
// Fine-grained permission management

import pool from '../db.js';

export type Permission = 
  | 'assets:read'
  | 'assets:write'
  | 'assets:delete'
  | 'assets:upload'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'categories:read'
  | 'categories:write'
  | 'categories:delete'
  | 'tags:read'
  | 'tags:write'
  | 'tags:delete'
  | 'subscriptions:read'
  | 'subscriptions:write'
  | 'system:config'
  | 'audit:read'
  | 'audit:export';

export type Role = 'super_admin' | 'admin' | 'moderator' | 'viewer';

export interface RolePermission {
  role: Role;
  permissions: Permission[];
}

// Role permissions matrix
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'assets:read',
    'assets:write',
    'assets:delete',
    'assets:upload',
    'users:read',
    'users:write',
    'users:delete',
    'categories:read',
    'categories:write',
    'categories:delete',
    'tags:read',
    'tags:write',
    'tags:delete',
    'subscriptions:read',
    'subscriptions:write',
    'system:config',
    'audit:read',
    'audit:export',
  ],
  admin: [
    'assets:read',
    'assets:write',
    'assets:delete',
    'assets:upload',
    'categories:read',
    'categories:write',
    'tags:read',
    'tags:write',
    'subscriptions:read',
    'audit:read',
  ],
  moderator: [
    'assets:read',
    'assets:write',
    'assets:upload',
    'categories:read',
    'tags:read',
  ],
  viewer: [
    'assets:read',
    'categories:read',
    'tags:read',
  ],
};

export class RBACService {
  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const user = await this.getUserRole(userId);
    if (!user) return false;

    const permissions = ROLE_PERMISSIONS[user.role as Role] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the permissions
   */
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all permissions
   */
  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get user role
   */
  async getUserRole(userId: string): Promise<{ role: Role } | null> {
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return { role: result.rows[0].role as Role };
  }

  /**
   * Get all permissions for user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.getUserRole(userId);
    if (!user) return [];

    return ROLE_PERMISSIONS[user.role] || [];
  }

  /**
   * Check if user can access resource
   */
  async canAccessResource(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: Permission
  ): Promise<boolean> {
    // Check base permission
    if (!(await this.hasPermission(userId, action))) {
      return false;
    }

    // Check resource-level permissions (if implemented)
    const resourcePermission = await this.getResourcePermission(
      userId,
      resourceType,
      resourceId
    );

    if (resourcePermission === 'deny') {
      return false;
    }

    if (resourcePermission === 'allow') {
      return true;
    }

    // Default to base permission
    return true;
  }

  /**
   * Get resource-level permission
   */
  private async getResourcePermission(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<'allow' | 'deny' | null> {
    // Check for explicit resource permissions
    const result = await pool.query(
      `SELECT permission_type 
       FROM resource_permissions 
       WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3`,
      [userId, resourceType, resourceId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].permission_type;
    }

    return null;
  }

  /**
   * Assign role to user (super_admin only)
   */
  async assignRole(userId: string, newRole: Role, assignedBy: string): Promise<boolean> {
    // Verify assigner is super_admin
    const assigner = await this.getUserRole(assignedBy);
    if (!assigner || assigner.role !== 'super_admin') {
      return false;
    }

    // Update user role
    await pool.query(
      'UPDATE users SET role = $1, role_updated_at = CURRENT_TIMESTAMP, role_updated_by = $2 WHERE id = $3',
      [newRole, assignedBy, userId]
    );

    return true;
  }
}

export const rbacService = new RBACService();
