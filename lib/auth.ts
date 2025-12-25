/**
 * Authentication Utilities
 * Helper functions to get current user from JWT token
 */

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getUserWithPermissions, type UserWithPermissions } from './permissions';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Get current authenticated user from JWT token
 */
export async function getCurrentUser(): Promise<UserWithPermissions | null> {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return null;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userId = payload.userId as string;
    if (!userId) {
      return null;
    }

    // Get user with permissions
    const user = await getUserWithPermissions(userId);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get current user ID from JWT token
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    if (!JWT_SECRET) {
      return null;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return (payload.userId as string) || null;
  } catch (error) {
    return null;
  }
}

