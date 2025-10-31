/**
 * Authentication utilities for Professor Carl Teacher Dashboard
 */

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'carl_teacher_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a session token (simple JWT alternative for MVP)
 */
export function createSessionToken(teacherId: string, email: string): string {
  const payload = {
    teacherId,
    email,
    exp: Date.now() + SESSION_DURATION,
  };
  // For MVP: base64 encode (NOT SECURE for production - use proper JWT later)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify and decode a session token
 */
export function verifySessionToken(token: string): {
  teacherId: string;
  email: string;
} | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    // Check expiration
    if (payload.exp < Date.now()) {
      return null;
    }

    return {
      teacherId: payload.teacherId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // in seconds
    path: '/',
  });
}

/**
 * Get session from cookie
 */
export async function getSession(): Promise<{
  teacherId: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  return verifySessionToken(token.value);
}

/**
 * Clear session cookie (logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  // Add more strength requirements as needed
  return { valid: true };
}
