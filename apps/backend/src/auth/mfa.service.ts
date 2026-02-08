// Multi-Factor Authentication Service
// TOTP-based MFA implementation

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import pool from '../db.js';
import { randomBytes } from 'crypto';

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerification {
  verified: boolean;
  sessionToken?: string;
  expiresAt?: Date;
}

export class MFAService {
  private issuer = process.env.MFA_ISSUER || 'Flag Stock Admin';
  private window = 2; // Allow 2 time steps (60 seconds) tolerance

  /**
   * Generate MFA secret for user
   */
  async generateSecret(userId: string, email: string): Promise<MFASetup> {
    const secret = authenticator.generateSecret();
    const serviceName = this.issuer;
    const otpAuthUrl = authenticator.keyuri(email, serviceName, secret);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret and backup codes (encrypted)
    await this.storeMFASecret(userId, secret, backupCodes);

    return {
      secret, // Only return for initial setup
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const mfaData = await this.getMFASecret(userId);
    if (!mfaData || !mfaData.secret) {
      return false;
    }

    // Verify TOTP
    const isValid = authenticator.verify({
      token: code,
      secret: mfaData.secret,
      window: this.window,
    });

    if (isValid) {
      // Update last used timestamp
      await this.updateLastUsed(userId);
      return true;
    }

    // Check backup codes
    if (mfaData.backupCodes && mfaData.backupCodes.includes(code)) {
      // Remove used backup code
      await this.removeBackupCode(userId, code);
      return true;
    }

    return false;
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT mfa_enabled FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.mfa_enabled || false;
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET mfa_enabled = true WHERE id = $1',
      [userId]
    );
  }

  /**
   * Disable MFA for user (requires password verification)
   */
  async disableMFA(userId: string, password: string): Promise<boolean> {
    // Verify password first
    const user = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (!user.rows[0]) {
      return false;
    }

    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
    
    if (!isValid) {
      return false;
    }

    // Disable MFA
    await pool.query(
      'UPDATE users SET mfa_enabled = false, mfa_secret = NULL, mfa_backup_codes = NULL WHERE id = $1',
      [userId]
    );

    return true;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Store MFA secret (encrypted)
   */
  private async storeMFASecret(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<void> {
    // Encrypt secret before storing
    const encryptedSecret = this.encryptSecret(secret);
    const encryptedBackupCodes = JSON.stringify(backupCodes.map(code => 
      this.encryptSecret(code)
    ));

    await pool.query(
      `UPDATE users 
       SET mfa_secret = $1, mfa_backup_codes = $2 
       WHERE id = $3`,
      [encryptedSecret, encryptedBackupCodes, userId]
    );
  }

  /**
   * Get MFA secret (decrypted)
   */
  private async getMFASecret(userId: string): Promise<{
    secret: string;
    backupCodes: string[];
  } | null> {
    const result = await pool.query(
      'SELECT mfa_secret, mfa_backup_codes FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0] || !result.rows[0].mfa_secret) {
      return null;
    }

    const secret = this.decryptSecret(result.rows[0].mfa_secret);
    const backupCodes = result.rows[0].mfa_backup_codes
      ? JSON.parse(result.rows[0].mfa_backup_codes).map((code: string) => 
          this.decryptSecret(code)
        )
      : [];

    return { secret, backupCodes };
  }

  /**
   * Update last MFA used timestamp
   */
  private async updateLastUsed(userId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET mfa_last_used = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  /**
   * Remove used backup code
   */
  private async removeBackupCode(userId: string, code: string): Promise<void> {
    const mfaData = await this.getMFASecret(userId);
    if (!mfaData) return;

    const updatedCodes = mfaData.backupCodes.filter(c => c !== code);
    const encryptedBackupCodes = JSON.stringify(updatedCodes.map(c => 
      this.encryptSecret(c)
    ));

    await pool.query(
      'UPDATE users SET mfa_backup_codes = $1 WHERE id = $2',
      [encryptedBackupCodes, userId]
    );
  }

  /**
   * Encrypt secret (simple encryption - use proper key management in production)
   */
  private encryptSecret(secret: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!', 'utf8');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt secret
   */
  private decryptSecret(encrypted: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!', 'utf8');
    
    const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export const mfaService = new MFAService();
