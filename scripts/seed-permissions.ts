import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongodb';
import Permission from '../models/Permission';

// Ensure environment variables are loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('Please create a .env file with MONGODB_URI');
  process.exit(1);
}

const permissionsList = [
  // Post permissions
  'create_post',
  'edit_post',
  'edit_own_post',
  'delete_post',
  'delete_own_post',
  'publish_post',
  'view_draft_post',

  // Category permissions
  'create_category',
  'edit_category',
  'delete_category',

  // User management permissions
  'view_users',
  'create_user',
  'edit_user',
  'delete_user',
  'assign_roles',

  // Role management
  'view_roles',
  'create_role',
  'edit_role',
  'delete_role',

  // Permission management
  'view_permissions',
  'create_permission',
  'edit_permission',
  'delete_permission',
];

async function seedPermissions() {
  try {
    await connectToDatabase();

    // Optional: Clear existing permissions (remove in production)
    // await Permission.deleteMany({});

    const existing = await Permission.find({ name: { $in: permissionsList } });
    const existingNames = existing.map(p => p.name);

    const newPermissions = permissionsList
      .filter(name => !existingNames.includes(name))
      .map(name => ({ name }));

    if (newPermissions.length > 0) {
      await Permission.insertMany(newPermissions);
      console.log(`✅ Added ${newPermissions.length} new permissions.`);
    } else {
      console.log('✅ All permissions already exist.');
    }

    console.log('Permissions seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  }
}

seedPermissions();