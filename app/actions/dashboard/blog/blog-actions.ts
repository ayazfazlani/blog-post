// app/actions/blog-actions.ts
"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { revalidatePath, revalidateTag } from "next/cache";
import { postSchema } from "@/lib/validation";

export async function createPost(data: any) {
  await connectToDatabase();
  const validated = postSchema.safeParse(data);
  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }
  await Post.create({
    title: validated.data.title,
    slug: validated.data.slug,
    content: validated.data.content,
    published: validated.data.published ?? false,
    categoryId: validated.data.categoryId || null,
    authorId: validated.data.authorId,
    featuredImage: validated.data.featuredImage || null,
  });
  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  return {
    success: true,
    message: "Post created successfully",
  };
}
// Helper to safely serialize dates
function serializeDate(date: any): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return new Date();
    return dateObj;
  } catch {
    return new Date();
  }
}

export async function getAllPosts() {
  try {
    await connectToDatabase();
    const posts = await Post.find({})
      .populate("authorId", "name email")
      .populate("categoryId", "id name")
      .sort({ createdAt: -1 })
      .lean();

    return posts.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      content: post.content,
      published: post.published,
      featuredImage: post.featuredImage || null,
      categoryId: post.categoryId
        ? typeof post.categoryId === "object"
          ? post.categoryId._id.toString()
          : post.categoryId.toString()
        : null,
      category:
        post.categoryId && typeof post.categoryId === "object"
          ? {
              id: post.categoryId._id.toString(),
              name: post.categoryId.name,
            }
          : null,
      authorId: post.authorId
        ? typeof post.authorId === "object"
          ? post.authorId._id.toString()
          : post.authorId.toString()
        : null,
      author:
        post.authorId && typeof post.authorId === "object"
          ? {
              id: post.authorId._id.toString(),
              name: post.authorId.name,
              email: post.authorId.email,
            }
          : null,
      createdAt: serializeDate(post.createdAt),
      updatedAt: serializeDate(post.updatedAt),
    }));
  } catch (error: any) {
    console.error('Error fetching all posts:', error);
    throw new Error(`Failed to fetch posts: ${error?.message || 'Unknown error'}`);
  }
}

export async function deletePost(id: string) {
  await connectToDatabase();
  const post = await Post.findById(id).lean();
  const categoryId = post?.categoryId?.toString();
  
  await Post.findByIdAndDelete(id);
  
  // Revalidate paths
  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  
  // Revalidate cache tags to immediately update published posts
  revalidateTag("posts");
  revalidateTag("all-posts");
  if (categoryId) {
    revalidateTag(`category-${categoryId}`);
  }
  // No redirect needed here – list stays on same page
}

export async function togglePublished(id: string, published: boolean) {
  await connectToDatabase();
  const post = await Post.findById(id);
  if (!post) {
    throw new Error("Post not found");
  }
  
  const categoryId = post.categoryId?.toString();
  
  // Update published status - this will trigger timestamps automatically
  post.published = !published;
  await post.save();
  
  // Revalidate paths
  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  
  // Revalidate cache tags to immediately update published posts
  revalidateTag("posts");
  revalidateTag("all-posts");
  if (categoryId) {
    revalidateTag(`category-${categoryId}`);
  }
}

export async function bulkUpdatePostDates(postIds: string[]) {
  try {
    await connectToDatabase();
    const mongoose = await import('mongoose');
    const now = new Date();
    
    if (!postIds || postIds.length === 0) {
      throw new Error('No post IDs provided');
    }

    // Convert string IDs to ObjectIds
    const objectIds = postIds.map(id => new mongoose.default.Types.ObjectId(id));

    // Get categories of posts before update for cache invalidation
    const updatedPosts = await Post.find({ _id: { $in: objectIds } })
      .select("categoryId")
      .lean();
    
    const categoryIds = new Set(
      updatedPosts
        .map(p => p.categoryId)
        .filter(Boolean)
        .map(cat => typeof cat === 'object' ? cat._id.toString() : cat.toString())
    );

    // Use updateMany with $set - this should work even with timestamps: true
    // We need to bypass Mongoose's timestamp middleware for this specific operation
    const result = await Post.collection.updateMany(
      { _id: { $in: objectIds } },
      { $set: { createdAt: now, updatedAt: now } }
    );

    // Revalidate all relevant paths
    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");
    revalidatePath("/", "layout");
    
    // Invalidate all cache tags for posts
    revalidateTag("posts");
    revalidateTag("all-posts");
    
    // Invalidate category-specific tags
    for (const catId of categoryIds) {
      revalidateTag(`category-${catId}`);
    }
    
    return {
      success: true,
      updatedCount: result.modifiedCount,
      message: `Updated ${result.modifiedCount} post(s) date to now`,
    };
  } catch (error: any) {
    console.error('Error bulk updating post dates:', error);
    throw new Error(`Failed to update post dates: ${error?.message || 'Unknown error'}`);
  }
}