/**
 * API Route to seed permissions
 * 
 * Usage: POST /api/seed/permissions
 * 
 * This is an alternative to running the seed script via command line.
 * You can call this endpoint to seed permissions programmatically.
 */

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Permission from '@/models/Permission';

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

export async function POST() {
  try {
    await connectToDatabase();

    const existing = await Permission.find({ name: { $in: permissionsList } });
    const existingNames = existing.map((p: any) => p.name);

    const newPermissions = permissionsList
      .filter(name => !existingNames.includes(name))
      .map(name => ({ name }));

    if (newPermissions.length > 0) {
      await Permission.insertMany(newPermissions);
      return NextResponse.json({
        success: true,
        message: `Added ${newPermissions.length} new permissions.`,
        added: newPermissions.map(p => p.name),
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'All permissions already exist.',
        existing: existingNames,
      });
    }
  } catch (error: any) {
    console.error('❌ Error seeding permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to seed permissions',
      },
      { status: 500 }
    );
  }
}

