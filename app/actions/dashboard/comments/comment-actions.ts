"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import { revalidatePath } from "next/cache";

// Get all comments with filters (for admin dashboard)
export async function getAllComments(filters?: {
  approved?: boolean;
  postId?: string;
  search?: string;
}) {
  await connectToDatabase();

  const query: any = {};

  if (filters?.approved !== undefined) {
    query.approved = filters.approved;
  }

  if (filters?.postId) {
    query.postId = filters.postId;
  }

  const comments = await Comment.find(query)
    .populate('postId', 'title slug')
    .sort({ createdAt: -1 }) // Newest first
    .lean();

  let filteredComments = comments;

  // Client-side search filtering (can be moved to DB query for better performance)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredComments = comments.filter(
      (comment: any) =>
        comment.name?.toLowerCase().includes(searchLower) ||
        comment.email?.toLowerCase().includes(searchLower) ||
        comment.content?.toLowerCase().includes(searchLower) ||
        comment.postId?.title?.toLowerCase().includes(searchLower)
    );
  }

  return filteredComments.map((comment: any) => ({
    id: comment._id.toString(),
    postId: comment.postId?._id?.toString() || comment.postId?.toString(),
    postTitle: comment.postId?.title || 'Unknown Post',
    postSlug: comment.postId?.slug || '',
    name: comment.name,
    email: comment.email,
    content: comment.content,
    approved: comment.approved,
    parentId: comment.parentId ? comment.parentId.toString() : null,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }));
}

// Get comment by ID
export async function getCommentById(id: string) {
  await connectToDatabase();
  
  const comment = await Comment.findById(id)
    .populate('postId', 'title slug')
    .lean();

  if (!comment) return null;

  return {
    id: comment._id.toString(),
    postId: (comment.postId as any)?._id?.toString() || (comment.postId as any)?.toString(),
    postTitle: (comment.postId as any)?.title || 'Unknown Post',
    postSlug: (comment.postId as any)?.slug || '',
    name: comment.name,
    email: comment.email,
    content: comment.content,
    approved: comment.approved,
    parentId: comment.parentId ? comment.parentId.toString() : null,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

// Approve a comment
export async function approveComment(id: string) {
  await connectToDatabase();
  
  const comment = await Comment.findByIdAndUpdate(
    id,
    { approved: true },
    { new: true }
  );

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Revalidate the blog post page
  revalidatePath(`/blog/[slug]`, "page");
  revalidatePath("/dashboard/comments");

  return {
    success: true,
    message: "Comment approved successfully",
    approved: comment.approved,
  };
}

// Reject/Unapprove a comment
export async function rejectComment(id: string) {
  await connectToDatabase();
  
  const comment = await Comment.findByIdAndUpdate(
    id,
    { approved: false },
    { new: true }
  );

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Revalidate the blog post page
  revalidatePath(`/blog/[slug]`, "page");
  revalidatePath("/dashboard/comments");

  return {
    success: true,
    message: "Comment rejected successfully",
    approved: comment.approved,
  };
}

// Delete a comment
export async function deleteComment(id: string) {
  await connectToDatabase();
  
  const comment = await Comment.findByIdAndDelete(id);

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Also delete any child comments (replies)
  await Comment.deleteMany({ parentId: id });

  // Revalidate the blog post page
  revalidatePath(`/blog/[slug]`, "page");
  revalidatePath("/dashboard/comments");

  return {
    success: true,
    message: "Comment deleted successfully",
  };
}

// Get comment statistics
export async function getCommentStats() {
  await connectToDatabase();
  
  const [total, approved, pending] = await Promise.all([
    Comment.countDocuments(),
    Comment.countDocuments({ approved: true }),
    Comment.countDocuments({ approved: false }),
  ]);

  return {
    total,
    approved,
    pending,
  };
}

