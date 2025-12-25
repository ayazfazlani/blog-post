"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Permission from "@/models/Permission";
import Role from "@/models/Role";
import User from "@/models/User";

/**
 * Create a new permission
 */
export async function createPermission(name: string) {
  await connectToDatabase();

  try {
    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return { success: false, error: "Permission already exists" };
    }

    const permission = await Permission.create({ name });
    return { success: true, permission };
  } catch (error: any) {
    console.error("Error creating permission:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a permission
 */
export async function updatePermission(permissionId: string, name: string) {
  await connectToDatabase();

  try {
    const permission = await Permission.findByIdAndUpdate(
      permissionId,
      { name },
      { new: true }
    );

    if (!permission) {
      return { success: false, error: "Permission not found" };
    }

    return { success: true, permission };
  } catch (error: any) {
    console.error("Error updating permission:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a permission
 */
export async function deletePermission(permissionId: string) {
  await connectToDatabase();

  try {
    // Remove permission from all roles
    await Role.updateMany(
      { permissions: permissionId },
      { $pull: { permissions: permissionId } }
    );

    // Remove permission from all users
    await User.updateMany(
      { permissions: permissionId },
      { $pull: { permissions: permissionId } }
    );

    await Permission.findByIdAndDelete(permissionId);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting permission:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all permissions
 */
export async function getAllPermissions() {
  await connectToDatabase();

  try {
    const permissions = await Permission.find({})
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      permissions: permissions.map(permission => ({
        id: permission._id.toString(),
        name: permission.name,
      })),
    };
  } catch (error: any) {
    console.error("Error fetching permissions:", error);
    return { success: false, error: error.message, permissions: [] };
  }
}

/**
 * Get a single permission by ID
 */
export async function getPermissionById(permissionId: string) {
  await connectToDatabase();

  try {
    const permission = await Permission.findById(permissionId).lean();

    if (!permission) {
      return { success: false, error: "Permission not found" };
    }

    return {
      success: true,
      permission: {
        id: permission._id.toString(),
        name: permission.name,
      },
    };
  } catch (error: any) {
    console.error("Error fetching permission:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign permission directly to user
 */
export async function assignPermissionToUser(userId: string, permissionId: string) {
  await connectToDatabase();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { permissions: permissionId } },
      { new: true }
    );

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user };
  } catch (error: any) {
    console.error("Error assigning permission to user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove permission from user
 */
export async function removePermissionFromUser(userId: string, permissionId: string) {
  await connectToDatabase();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { permissions: permissionId } },
      { new: true }
    );

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user };
  } catch (error: any) {
    console.error("Error removing permission from user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync permissions (assign multiple at once)
 */
export async function syncUserPermissions(userId: string, permissionIds: string[]) {
  await connectToDatabase();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { permissions: permissionIds } },
      { new: true }
    );

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user };
  } catch (error: any) {
    console.error("Error syncing user permissions:", error);
    return { success: false, error: error.message };
  }
}

