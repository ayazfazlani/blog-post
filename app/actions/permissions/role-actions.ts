"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Role from "@/models/Role";
import Permission from "@/models/Permission";
import User from "@/models/User";

/**
 * Create a new role
 */
export async function createRole(name: string, permissionIds?: string[]) {
  await connectToDatabase();

  try {
    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return { success: false, error: "Role already exists" };
    }

    const role = await Role.create({
      name,
      permissions: permissionIds || [],
    });

    return { success: true, role };
  } catch (error: any) {
    console.error("Error creating role:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a role
 */
export async function updateRole(roleId: string, name?: string, permissionIds?: string[]) {
  await connectToDatabase();

  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (permissionIds) updateData.permissions = permissionIds;

    const role = await Role.findByIdAndUpdate(roleId, updateData, { new: true })
      .populate("permissions", "name");

    if (!role) {
      return { success: false, error: "Role not found" };
    }

    return { success: true, role };
  } catch (error: any) {
    console.error("Error updating role:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string) {
  await connectToDatabase();

  try {
    // Check if any users have this role
    const usersWithRole = await User.countDocuments({ role: roleId });
    if (usersWithRole > 0) {
      return { success: false, error: "Cannot delete role: Users are assigned to this role" };
    }

    await Role.findByIdAndDelete(roleId);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all roles
 */
export async function getAllRoles() {
  await connectToDatabase();

  try {
    const roles = await Role.find({})
      .populate("permissions", "name")
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      roles: roles.map(role => ({
        id: role._id.toString(),
        name: role.name,
        permissions: (role.permissions || []).map((p: any) => ({
          id: typeof p === 'object' ? p._id.toString() : p,
          name: typeof p === 'object' ? p.name : p,
        })),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    return { success: false, error: error.message, roles: [] };
  }
}

/**
 * Get a single role by ID
 */
export async function getRoleById(roleId: string) {
  await connectToDatabase();

  try {
    const role = await Role.findById(roleId)
      .populate("permissions", "name")
      .lean();

    if (!role) {
      return { success: false, error: "Role not found" };
    }

    return {
      success: true,
      role: {
        id: role._id.toString(),
        name: role.name,
        permissions: (role.permissions || []).map((p: any) => ({
          id: typeof p === 'object' ? p._id.toString() : p,
          name: typeof p === 'object' ? p.name : p,
        })),
      },
    };
  } catch (error: any) {
    console.error("Error fetching role:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign permissions to a role
 */
export async function assignPermissionsToRole(roleId: string, permissionIds: string[]) {
  await connectToDatabase();

  try {
    const role = await Role.findByIdAndUpdate(
      roleId,
      { $set: { permissions: permissionIds } },
      { new: true }
    ).populate("permissions", "name");

    if (!role) {
      return { success: false, error: "Role not found" };
    }

    return { success: true, role };
  } catch (error: any) {
    console.error("Error assigning permissions to role:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove permissions from a role
 */
export async function removePermissionsFromRole(roleId: string, permissionIds: string[]) {
  await connectToDatabase();

  try {
    const role = await Role.findByIdAndUpdate(
      roleId,
      { $pull: { permissions: { $in: permissionIds } } },
      { new: true }
    ).populate("permissions", "name");

    if (!role) {
      return { success: false, error: "Role not found" };
    }

    return { success: true, role };
  } catch (error: any) {
    console.error("Error removing permissions from role:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(userId: string, roleId: string) {
  await connectToDatabase();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { role: roleId },
      { new: true }
    ).populate("role", "name");

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user };
  } catch (error: any) {
    console.error("Error assigning role to user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(userId: string) {
  await connectToDatabase();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $unset: { role: "" } },
      { new: true }
    );

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, user };
  } catch (error: any) {
    console.error("Error removing role from user:", error);
    return { success: false, error: error.message };
  }
}

