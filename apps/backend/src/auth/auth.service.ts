import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import pool from '../db.js';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
/** Access token TTL; number = seconds (e.g. 604800 = 7d). Env may still use a StringValue like `15m`. */
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  email_verified: boolean;
  created_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT access token
export function generateAccessToken(userId: string, email: string, role: string): string {
  const payload = { userId, email, role };
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

// Generate refresh token
export function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

// Store refresh token in database
export async function storeRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
}

// Verify refresh token
export async function verifyRefreshToken(token: string): Promise<User | null> {
  const result = await pool.query(
    `SELECT rt.user_id, u.id, u.email, u.full_name, u.role, u.email_verified, u.created_at
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token = $1 AND rt.expires_at > CURRENT_TIMESTAMP AND u.is_active = TRUE`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    email_verified: row.email_verified,
    created_at: row.created_at,
  };
}

// Delete refresh token
export async function deleteRefreshToken(token: string): Promise<void> {
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

// Delete all refresh tokens for a user
export async function deleteAllRefreshTokens(userId: string): Promise<void> {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

// Register new user
export async function registerUser(data: RegisterData): Promise<User> {
  const { email, password, full_name } = data;

  // Check if user already exists
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'user')
     RETURNING id, email, full_name, role, email_verified, created_at`,
    [email, passwordHash, full_name || null]
  );

  return result.rows[0];
}

// Login user
export async function loginUser(data: LoginData): Promise<AuthTokens> {
  const { email, password } = data;

  // Find user
  const result = await pool.query(
    'SELECT id, email, password_hash, full_name, role, email_verified, created_at FROM users WHERE email = $1 AND is_active = TRUE',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  // Store refresh token
  await storeRefreshToken(user.id, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at,
    },
  };
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  const user = await verifyRefreshToken(refreshToken);
  if (!user) {
    throw new Error('Invalid refresh token');
  }

  const accessToken = generateAccessToken(user.id, user.email, user.role);
  return { accessToken };
}

// Logout user
export async function logoutUser(refreshToken: string): Promise<void> {
  await deleteRefreshToken(refreshToken);
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, email, full_name, role, email_verified, created_at FROM users WHERE id = $1 AND is_active = TRUE',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    email_verified: row.email_verified,
    created_at: row.created_at,
  };
}
