"use server";

import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";
import Permission from "@/models/Permission";
import { ensureModelsRegistered } from "@/lib/models-registry";

/**
 * Get all users with their roles and permissions
 */
export async function getAllUsers() {
  await connectToDatabase();
  ensureModelsRegistered();

  try {
    // Fetch users without populate first to handle invalid role references
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Manually populate roles and permissions to handle invalid references
    const usersWithRelations = await Promise.all(
      users.map(async (user: any) => {
        let role = null;
        let permissions: any[] = [];

        // Handle role - check if it's a valid ObjectId
        if (user.role) {
          try {
            // Check if role is already an ObjectId or can be converted
            if (typeof user.role === 'string' && user.role.length === 24) {
              // Try to populate if it's a valid ObjectId string
              const roleDoc = await Role.findById(user.role).lean();
              if (roleDoc) {
                role = {
                  id: roleDoc._id.toString(),
                  name: roleDoc.name,
                };
              }
            } else if (typeof user.role === 'object' && user.role._id) {
              // Already populated
              role = {
                id: user.role._id.toString(),
                name: user.role.name,
              };
            }
          } catch (err) {
            // Invalid role reference, skip it
            console.warn(`Invalid role reference for user ${user._id}: ${user.role}`);
          }
        }

        // Handle permissions
        if (user.permissions && user.permissions.length > 0) {
          try {
            const permissionIds = user.permissions
              .filter((p: any) => {
                // Filter out invalid references
                if (typeof p === 'string') {
                  return p.length === 24; // Valid ObjectId length
                }
                return typeof p === 'object' && p._id;
              })
              .map((p: any) => typeof p === 'string' ? p : p._id.toString());

            if (permissionIds.length > 0) {
              const permissionDocs = await Permission.find({
                _id: { $in: permissionIds }
              }).lean();

              permissions = permissionDocs.map((p: any) => ({
                id: p._id.toString(),
                name: p.name,
              }));
            }
          } catch (err) {
            console.warn(`Error loading permissions for user ${user._id}:`, err);
          }
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role,
          permissions,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      })
    );

    return {
      success: true,
      users: usersWithRelations,
    };
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message, users: [] };
  }
}

/**
 * Get a single user by ID with roles and permissions
 */
export async function getUserById(userId: string) {
  await connectToDatabase();
  ensureModelsRegistered();

  try {
    // Fetch user without populate first
    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Manually populate role and permissions
    let role = null;
    let permissions: any[] = [];

    // Handle role
    if (user.role) {
      try {
        if (typeof user.role === 'string' && user.role.length === 24) {
          const roleDoc = await Role.findById(user.role).lean();
          if (roleDoc) {
            role = {
              id: roleDoc._id.toString(),
              name: roleDoc.name,
            };
          }
        } else if (typeof user.role === 'object' && user.role._id) {
          role = {
            id: user.role._id.toString(),
            name: user.role.name,
          };
        }
      } catch (err) {
        console.warn(`Invalid role reference for user ${userId}: ${user.role}`);
      }
    }

    // Handle permissions
    if (user.permissions && user.permissions.length > 0) {
      try {
        const permissionIds = user.permissions
          .filter((p: any) => {
            if (typeof p === 'string') {
              return p.length === 24;
            }
            return typeof p === 'object' && p._id;
          })
          .map((p: any) => typeof p === 'string' ? p : p._id.toString());

        if (permissionIds.length > 0) {
          const permissionDocs = await Permission.find({
            _id: { $in: permissionIds }
          }).lean();

          permissions = permissionDocs.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
          }));
        }
      } catch (err) {
        console.warn(`Error loading permissions for user ${userId}:`, err);
      }
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role,
        permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(userId: string, roleId: string) {
  await connectToDatabase();
  ensureModelsRegistered();

  try {
    // Update user without populate first
    const user = await User.findByIdAndUpdate(
      userId,
      { role: roleId },
      { new: true }
    )
      .select('-password')
      .lean();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Manually populate role and permissions
    let role = null;
    let permissions: any[] = [];

    if (user.role) {
      try {
        if (typeof user.role === 'string' && user.role.length === 24) {
          const roleDoc = await Role.findById(user.role).lean();
          if (roleDoc) {
            role = {
              id: roleDoc._id.toString(),
              name: roleDoc.name,
            };
          }
        }
      } catch (err) {
        console.warn(`Error loading role for user ${userId}:`, err);
      }
    }

    if (user.permissions && user.permissions.length > 0) {
      try {
        const permissionIds = user.permissions
          .filter((p: any) => typeof p === 'string' && p.length === 24)
          .map((p: any) => p);

        if (permissionIds.length > 0) {
          const permissionDocs = await Permission.find({
            _id: { $in: permissionIds }
          }).lean();

          permissions = permissionDocs.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
          }));
        }
      } catch (err) {
        console.warn(`Error loading permissions for user ${userId}:`, err);
      }
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role,
        permissions,
      },
    };
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
  ensureModelsRegistered();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $unset: { role: "" } },
      { new: true }
    )
      .select('-password')
      .lean();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Manually populate permissions
    let permissions: any[] = [];

    if (user.permissions && user.permissions.length > 0) {
      try {
        const permissionIds = user.permissions
          .filter((p: any) => typeof p === 'string' && p.length === 24)
          .map((p: any) => p);

        if (permissionIds.length > 0) {
          const permissionDocs = await Permission.find({
            _id: { $in: permissionIds }
          }).lean();

          permissions = permissionDocs.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
          }));
        }
      } catch (err) {
        console.warn(`Error loading permissions for user ${userId}:`, err);
      }
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: null,
        permissions,
      },
    };
  } catch (error: any) {
    console.error("Error removing role from user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign permission to user
 */
export async function assignPermissionToUser(userId: string, permissionId: string) {
  await connectToDatabase();
  ensureModelsRegistered();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { permissions: permissionId } },
      { new: true }
    )
      .select('-password')
      .lean();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Manually populate role and permissions
    let role = null;
    let permissions: any[] = [];

    if (user.role) {
      try {
        if (typeof user.role === 'string' && user.role.length === 24) {
          const roleDoc = await Role.findById(user.role).lean();
          if (roleDoc) {
            role = {
              id: roleDoc._id.toString(),
              name: roleDoc.name,
            };
          }
        }
      } catch (err) {
        console.warn(`Error loading role for user ${userId}:`, err);
      }
    }

    if (user.permissions && user.permissions.length > 0) {
      try {
        const permissionIds = user.permissions
          .filter((p: any) => typeof p === 'string' && p.length === 24)
          .map((p: any) => p);

        if (permissionIds.length > 0) {
          const permissionDocs = await Permission.find({
            _id: { $in: permissionIds }
          }).lean();

          permissions = permissionDocs.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
          }));
        }
      } catch (err) {
        console.warn(`Error loading permissions for user ${userId}:`, err);
      }
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role,
        permissions,
      },
    };
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
  ensureModelsRegistered();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { permissions: permissionId } },
      { new: true }
    )
      .select('-password')
      .lean();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Manually populate role and permissions
    let role = null;
    let permissions: any[] = [];

    if (user.role) {
      try {
        if (typeof user.role === 'string' && user.role.length === 24) {
          const roleDoc = await Role.findById(user.role).lean();
          if (roleDoc) {
            role = {
              id: roleDoc._id.toString(),
              name: roleDoc.name,
            };
          }
        }
      } catch (err) {
        console.warn(`Error loading role for user ${userId}:`, err);
      }
    }

    if (user.permissions && user.permissions.length > 0) {
      try {
        const permissionIds = user.permissions
          .filter((p: any) => typeof p === 'string' && p.length === 24)
          .map((p: any) => p);

        if (permissionIds.length > 0) {
          const permissionDocs = await Permission.find({
            _id: { $in: permissionIds }
          }).lean();

          permissions = permissionDocs.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
          }));
        }
      } catch (err) {
        console.warn(`Error loading permissions for user ${userId}:`, err);
      }
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role,
        permissions,
      },
    };
  } catch (error: any) {
    console.error("Error removing permission from user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync user permissions (replace all permissions)
 */
export async function syncUserPermissions(userId: string, permissionIds: string[]) {
  await connectToDatabase();
  ensureModelsRegistered();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { permissions: permissionIds } },
      { new: true }
    )
      .select('-password')
      .lean();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Manually populate role and permissions
    let role = null;
    let permissions: any[] = [];

    if (user.role) {
      try {
        if (typeof user.role === 'string' && user.role.length === 24) {
          const roleDoc = await Role.findById(user.role).lean();
          if (roleDoc) {
            role = {
              id: roleDoc._id.toString(),
              name: roleDoc.name,
            };
          }
        }
      } catch (err) {
        console.warn(`Error loading role for user ${userId}:`, err);
      }
    }

    if (user.permissions && user.permissions.length > 0) {
      try {
        const validPermissionIds = user.permissions
          .filter((p: any) => typeof p === 'string' && p.length === 24)
          .map((p: any) => p);

        if (validPermissionIds.length > 0) {
          const permissionDocs = await Permission.find({
            _id: { $in: validPermissionIds }
          }).lean();

          permissions = permissionDocs.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
          }));
        }
      } catch (err) {
        console.warn(`Error loading permissions for user ${userId}:`, err);
      }
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role,
        permissions,
      },
    };
  } catch (error: any) {
    console.error("Error syncing user permissions:", error);
    return { success: false, error: error.message };
  }
}

