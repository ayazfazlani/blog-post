// app/actions/blog-actions.ts
"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { revalidatePath, revalidateTag } from "next/cache";

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
  await Post.findByIdAndDelete(id);
  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  // No redirect needed here – list stays on same page
}

export async function togglePublished(id: string, published: boolean) {
  await connectToDatabase();
  await Post.findByIdAndUpdate(id, { published: !published });
  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
}

export async function bulkUpdatePostDates(postIds: string[]) {
  try {
    await connectToDatabase();
    const now = new Date();
    
    if (!postIds || postIds.length === 0) {
      throw new Error('No post IDs provided');
    }

    const result = await Post.updateMany(
      { _id: { $in: postIds } },
      { $set: { createdAt: now, updatedAt: now } }
    );

    // Revalidate all relevant paths
    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");
    revalidatePath("/", "layout");
    
    // Invalidate all cache tags for posts
    revalidateTag("posts");
    revalidateTag("all-posts");
    
    // Also invalidate category-specific tags if needed
    // Get the categories of updated posts to invalidate their specific cache
    const updatedPosts = await Post.find({ _id: { $in: postIds } })
      .select("categoryId")
      .lean();
    
    const categoryIds = new Set(
      updatedPosts
        .map(p => p.categoryId)
        .filter(Boolean)
        .map(cat => typeof cat === 'object' ? cat._id.toString() : cat.toString())
    );
    
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