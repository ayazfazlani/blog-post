"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import { commentSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

// Create a new comment (public - requires approval)
export async function createComment(data: {
  postId: string;
  name: string;
  email?: string;
  content: string;
  parentId?: string | null;
  ipAddress?: string;
  userAgent?: string;
}) {
  await connectToDatabase();
  
  // Prepare validation data - include email as is (validation will handle empty strings)
  const validationData = {
    postId: data.postId,
    name: data.name,
    email: data.email || "", // Pass empty string if undefined
    content: data.content,
    parentId: data.parentId || null,
  };

  const validated = commentSchema.safeParse(validationData);

  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  // Prepare comment data
  const commentData: any = {
    postId: validated.data.postId,
    name: validated.data.name,
    content: validated.data.content,
    parentId: validated.data.parentId || null,
    approved: false, // Comments require approval
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  };

  // Set email - use guest email if not provided
  if (validated.data.email && validated.data.email.trim() !== "") {
    commentData.email = validated.data.email;
  } else {
    // Generate a guest email based on name and timestamp for uniqueness
    const guestName = validated.data.name.toLowerCase().replace(/\s+/g, ".");
    const timestamp = Date.now();
    commentData.email = `guest.${guestName}.${timestamp}@example.com`;
  }

  const comment = await Comment.create(commentData);

  // Revalidate the blog post page
  revalidatePath(`/blog/[slug]`, "page");

  return {
    success: true,
    message: "Comment submitted successfully! It will be visible after approval.",
    commentId: (comment as any)._id?.toString() || "",
  };
}

// Get approved comments for a post (public)
export async function getApprovedComments(postId: string) {
  await connectToDatabase();
  
  const comments = await Comment.find({
    postId,
    approved: true,
  })
    .sort({ createdAt: 1 }) // Oldest first for threaded comments
    .lean();

  return comments.map((comment) => ({
    id: comment._id.toString(),
    name: comment.name,
    email: comment.email,
    content: comment.content,
    parentId: comment.parentId ? comment.parentId.toString() : null,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }));
}

