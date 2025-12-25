/**
 * Example: How to use permissions in your blog actions
 * 
 * This file shows examples of protecting server actions with permissions
 */

'use server';

import { getCurrentUserId } from '@/lib/auth';
import { authorize, hasPermission } from '@/lib/permissions';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';

/**
 * Example 1: Using authorize() - throws error if no permission
 */
export async function createPostExample(data: { title: string; content: string }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // This will throw an error if user doesn't have 'create_post' permission
    await authorize(userId, 'create_post');
    
    await connectToDatabase();
    const post = await Post.create({
      ...data,
      authorId: userId,
      published: false,
    });

    return { success: true, post };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Example 2: Using hasPermission() - returns boolean
 */
export async function editPostExample(postId: string, data: { title?: string; content?: string }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  await connectToDatabase();
  const post = await Post.findById(postId);
  if (!post) {
    return { success: false, error: 'Post not found' };
  }

  // Check if user can edit any post OR if they own this post
  const canEditAny = await hasPermission(userId, 'edit_post');
  const canEditOwn = await hasPermission(userId, 'edit_own_post');
  const isOwner = post.authorId?.toString() === userId;

  if (!canEditAny && !(canEditOwn && isOwner)) {
    return { success: false, error: 'You do not have permission to edit this post' };
  }

  // User has permission, update post
  Object.assign(post, data);
  await post.save();

  return { success: true, post };
}

/**
 * Example 3: Using hasAnyPermission() - check multiple permissions
 */
export async function deletePostExample(postId: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  await connectToDatabase();
  const post = await Post.findById(postId);
  if (!post) {
    return { success: false, error: 'Post not found' };
  }

  // Check if user can delete any post OR delete own posts
  const canDelete = await hasAnyPermission(userId, ['delete_post', 'delete_own_post']);
  if (!canDelete) {
    return { success: false, error: 'You do not have permission to delete posts' };
  }

  // If user only has 'delete_own_post', check ownership
  const hasDeleteAny = await hasPermission(userId, 'delete_post');
  const isOwner = post.authorId?.toString() === userId;

  if (!hasDeleteAny && !isOwner) {
    return { success: false, error: 'You can only delete your own posts' };
  }

  await Post.findByIdAndDelete(postId);
  return { success: true };
}

/**
 * Example 4: Using hasRole() - check by role
 */
export async function publishPostExample(postId: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Only admins and editors can publish posts
  const { hasRole } = await import('@/lib/permissions');
  const isAdmin = await hasRole(userId, 'admin');
  const isEditor = await hasRole(userId, 'editor');

  if (!isAdmin && !isEditor) {
    return { success: false, error: 'Only admins and editors can publish posts' };
  }

  await connectToDatabase();
  const post = await Post.findByIdAndUpdate(
    postId,
    { published: true },
    { new: true }
  );

  return { success: true, post };
}

