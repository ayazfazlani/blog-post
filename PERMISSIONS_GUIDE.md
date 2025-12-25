# Role-Based Access Control (RBAC) Guide

This guide explains how to use the Spatie-like permissions system in your Next.js blog application.

## Overview

The RBAC system allows you to:
- Create roles (e.g., admin, editor, author)
- Create permissions (e.g., create_post, edit_post, delete_post)
- Assign permissions to roles
- Assign roles to users
- Assign permissions directly to users
- Check permissions throughout your application

## Basic Usage

### 1. Check if user has permission

```typescript
import { hasPermission } from '@/lib/permissions';

// In a server component or server action
const canEdit = await hasPermission(userId, 'edit_post');
if (canEdit) {
  // User can edit posts
}
```

### 2. Check if user has role

```typescript
import { hasRole } from '@/lib/permissions';

const isAdmin = await hasRole(userId, 'admin');
if (isAdmin) {
  // User is an admin
}
```

### 3. Check multiple permissions

```typescript
import { hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

// Check if user has ANY of these permissions
const canEdit = await hasAnyPermission(userId, ['edit_post', 'edit_own_post']);

// Check if user has ALL of these permissions
const canManage = await hasAllPermissions(userId, ['create_post', 'edit_post', 'delete_post']);
```

### 4. Authorize (throw error if no permission)

```typescript
import { authorize } from '@/lib/permissions';

// This will throw an error if user doesn't have permission
try {
  await authorize(userId, 'delete_post');
  // User has permission, proceed
} catch (error) {
  // User doesn't have permission
  return { error: 'Unauthorized' };
}
```

### 5. Get current user with permissions

```typescript
import { getCurrentUser } from '@/lib/auth';

const user = await getCurrentUser();
if (user) {
  // User is authenticated
  // user.role contains role info
  // user.permissions contains all permissions (from role + direct)
}
```

## Example: Protecting a Route

```typescript
// app/dashboard/blog/create/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export default async function CreateBlogPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const canCreate = await hasPermission(user.id, 'create_post');
  if (!canCreate) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You don't have permission to create posts.</p>
      </div>
    );
  }

  // User has permission, show create form
  return <CreateBlogForm />;
}
```

## Example: Protecting an API Route

```typescript
// app/api/posts/route.ts
import { getCurrentUserId } from '@/lib/auth';
import { authorize } from '@/lib/permissions';

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check permission
    await authorize(userId, 'create_post');
    
    // User has permission, create post
    const body = await request.json();
    // ... create post logic
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }
}
```

## Example: Protecting a Server Action

```typescript
// app/actions/blog-actions.ts
'use server';

import { getCurrentUserId } from '@/lib/auth';
import { authorize } from '@/lib/permissions';

export async function createPost(data: PostData) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await authorize(userId, 'create_post');
    
    // Create post
    const post = await Post.create({ ...data, authorId: userId });
    return { success: true, post };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

## Example: Conditional UI Rendering

```typescript
// app/components/blog-actions.tsx
'use client';

import { useEffect, useState } from 'react';

export function BlogActions({ postId }: { postId: string }) {
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    // Check permissions on client side
    fetch('/api/user/permissions')
      .then(res => res.json())
      .then(data => {
        setCanEdit(data.permissions.includes('edit_post'));
        setCanDelete(data.permissions.includes('delete_post'));
      });
  }, []);

  return (
    <div>
      {canEdit && <Button>Edit</Button>}
      {canDelete && <Button variant="destructive">Delete</Button>}
    </div>
  );
}
```

## Recommended Permissions

Here are some common permissions you might want to create:

### Blog Permissions
- `create_post` - Create new blog posts
- `edit_post` - Edit any blog post
- `edit_own_post` - Edit own blog posts only
- `delete_post` - Delete any blog post
- `delete_own_post` - Delete own blog posts only
- `publish_post` - Publish/unpublish posts
- `view_draft_post` - View draft posts

### Category Permissions
- `create_category` - Create categories
- `edit_category` - Edit categories
- `delete_category` - Delete categories

### User Management Permissions
- `view_users` - View user list
- `create_user` - Create new users
- `edit_user` - Edit users
- `delete_user` - Delete users
- `assign_roles` - Assign roles to users

### Role & Permission Management
- `view_roles` - View roles
- `create_role` - Create roles
- `edit_role` - Edit roles
- `delete_role` - Delete roles
- `view_permissions` - View permissions
- `create_permission` - Create permissions
- `edit_permission` - Edit permissions
- `delete_permission` - Delete permissions

## Setting Up Initial Roles

1. Create permissions first:
   - Go to `/dashboard/permissions/create`
   - Create all the permissions you need

2. Create roles:
   - Go to `/dashboard/roles/create`
   - Create roles like "admin", "editor", "author"
   - Assign permissions to each role

3. Assign roles to users:
   - You can do this programmatically or through a user management interface

## Best Practices

1. **Use descriptive permission names**: Use snake_case format (e.g., `create_post`, not `createPost`)

2. **Check permissions server-side**: Always verify permissions on the server, not just the client

3. **Use role-based defaults**: Assign common permissions to roles, then add specific permissions to users as needed

4. **Cache permission checks**: For frequently accessed routes, consider caching permission checks

5. **Log permission denials**: Log when users try to access resources without permission (for security auditing)

## Troubleshooting

### Permission not working?
1. Check if the permission exists in the database
2. Verify the user has the permission (either through role or direct assignment)
3. Make sure you're checking permissions server-side
4. Clear JWT token and re-login if permissions were recently updated

### Role not working?
1. Verify the role is assigned to the user
2. Check if the role has the required permissions
3. Ensure the role name matches exactly (case-sensitive)

