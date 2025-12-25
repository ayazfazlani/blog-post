/**
 * Permission Helper Functions (Similar to Laravel Spatie Permissions)
 * 
 * These utilities help check user permissions and roles throughout the application
 */

import { connectToDatabase } from "@/lib/mongodb";
import { ensureModelsRegistered } from "@/lib/models-registry";
import mongoose from "mongoose";

// Import models - they will be registered via ensureModelsRegistered
import Permission from "@/models/Permission";
import Role from "@/models/Role";
import User from "@/models/User";

export interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role?: {
    id: string;
    name: string;
    permissions?: Array<{ id: string; name: string }>;
  };
  permissions?: Array<{ id: string; name: string }>;
}

/**
 * Get user with all permissions (from role + direct permissions)
 */
export async function getUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
  await connectToDatabase();
  
  // Ensure all models are registered
  ensureModelsRegistered();
  
  const user = await User.findById(userId)
    .populate({
      path: 'role',
      populate: {
        path: 'permissions',
        select: 'name'
      }
    })
    .populate('permissions', 'name')
    .lean();

  if (!user) return null;

  // Get all permissions (from role + direct)
  const rolePermissions = user.role && typeof user.role === 'object' 
    ? (user.role.permissions || []).map((p: any) => p.name)
    : [];
  
  const directPermissions = (user.permissions || [])
    .map((p: any) => typeof p === 'object' ? p.name : p)
    .filter(Boolean);

  // Combine and deduplicate
  const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role && typeof user.role === 'object' ? {
      id: user.role._id.toString(),
      name: user.role.name,
      permissions: (user.role.permissions || []).map((p: any) => ({
        id: p._id.toString(),
        name: p.name
      }))
    } : undefined,
    permissions: allPermissions.map(name => ({ id: '', name }))
  };
}

/**
 * Check if user has a specific permission
 * Similar to: $user->hasPermissionTo('create_post')
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const user = await getUserWithPermissions(userId);
  if (!user) return false;

  const rolePermissions = user.role?.permissions?.map(p => p.name) || [];
  const directPermissions = user.permissions?.map(p => p.name) || [];
  const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

  return allPermissions.includes(permissionName);
}

/**
 * Check if user has any of the given permissions
 * Similar to: $user->hasAnyPermission(['create_post', 'edit_post'])
 */
export async function hasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
  const user = await getUserWithPermissions(userId);
  if (!user) return false;

  const rolePermissions = user.role?.permissions?.map(p => p.name) || [];
  const directPermissions = user.permissions?.map(p => p.name) || [];
  const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

  return permissionNames.some(permission => allPermissions.includes(permission));
}

/**
 * Check if user has all of the given permissions
 * Similar to: $user->hasAllPermissions(['create_post', 'edit_post'])
 */
export async function hasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean> {
  const user = await getUserWithPermissions(userId);
  if (!user) return false;

  const rolePermissions = user.role?.permissions?.map(p => p.name) || [];
  const directPermissions = user.permissions?.map(p => p.name) || [];
  const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

  return permissionNames.every(permission => allPermissions.includes(permission));
}

/**
 * Check if user has a specific role
 * Similar to: $user->hasRole('admin')
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const user = await getUserWithPermissions(userId);
  if (!user) return false;

  return user.role?.name === roleName;
}

/**
 * Check if user has any of the given roles
 * Similar to: $user->hasAnyRole(['admin', 'editor'])
 */
export async function hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
  const user = await getUserWithPermissions(userId);
  if (!user) return false;

  return roleNames.includes(user.role?.name || '');
}

/**
 * Get all permissions for a user (role + direct)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await getUserWithPermissions(userId);
  if (!user) return [];

  const rolePermissions = user.role?.permissions?.map(p => p.name) || [];
  const directPermissions = user.permissions?.map(p => p.name) || [];
  
  return [...new Set([...rolePermissions, ...directPermissions])];
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const user = await getUserWithPermissions(userId);
  if (!user || !user.role) return [];

  return [user.role.name];
}

/**
 * Server-side authorization check
 * Throws error if user doesn't have permission
 */
export async function authorize(userId: string, permissionName: string): Promise<void> {
  const hasAccess = await hasPermission(userId, permissionName);
  if (!hasAccess) {
    throw new Error(`Unauthorized: User does not have permission '${permissionName}'`);
  }
}

/**
 * Server-side role check
 * Throws error if user doesn't have role
 */
export async function authorizeRole(userId: string, roleName: string): Promise<void> {
  const hasAccess = await hasRole(userId, roleName);
  if (!hasAccess) {
    throw new Error(`Unauthorized: User does not have role '${roleName}'`);
  }
}

