/**
 * Seed script to create initial roles with permissions
 * 
 * Run: npm run seed:roles
 * Or: npx tsx scripts/seed-roles.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongodb';
import Role from '../models/Role';
import Permission from '../models/Permission';

// Ensure environment variables are loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('Please create a .env file with MONGODB_URI');
  process.exit(1);
}

const rolesToCreate = [
  {
    name: 'admin',
    permissions: [
      'create_post',
      'edit_post',
      'delete_post',
      'publish_post',
      'view_draft_post',
      'create_category',
      'edit_category',
      'delete_category',
      'view_users',
      'create_user',
      'edit_user',
      'delete_user',
      'assign_roles',
      'view_roles',
      'create_role',
      'edit_role',
      'delete_role',
      'view_permissions',
      'create_permission',
      'edit_permission',
      'delete_permission',
    ],
  },
  {
    name: 'editor',
    permissions: [
      'create_post',
      'edit_post',
      'delete_post',
      'publish_post',
      'view_draft_post',
      'create_category',
      'edit_category',
    ],
  },
  {
    name: 'author',
    permissions: [
      'create_post',
      'edit_own_post',
      'delete_own_post',
      'view_draft_post',
    ],
  },
];

async function seedRoles() {
  try {
    await connectToDatabase();
    console.log('✅ Connected to database');

    for (const roleData of rolesToCreate) {
      // Find or create the role
      let role = await Role.findOne({ name: roleData.name });

      if (!role) {
        // Get permission IDs
        const permissions = await Permission.find({
          name: { $in: roleData.permissions },
        });

        if (permissions.length === 0) {
          console.log(`⚠️  No permissions found for role "${roleData.name}". Make sure to seed permissions first.`);
          continue;
        }

        const permissionIds = permissions.map((p) => p._id);

        role = await Role.create({
          name: roleData.name,
          permissions: permissionIds,
        });

        console.log(`✅ Created role "${roleData.name}" with ${permissions.length} permissions`);
      } else {
        // Update existing role with permissions
        const permissions = await Permission.find({
          name: { $in: roleData.permissions },
        });

        if (permissions.length > 0) {
          const permissionIds = permissions.map((p) => p._id);
          role.permissions = permissionIds;
          await role.save();
          console.log(`✅ Updated role "${roleData.name}" with ${permissions.length} permissions`);
        } else {
          console.log(`⚠️  No permissions found for role "${roleData.name}"`);
        }
      }
    }

    console.log('✅ Roles seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
}

seedRoles();

