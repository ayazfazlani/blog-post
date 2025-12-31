// app/actions/blog-actions.ts
"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { revalidatePath } from "next/cache";

export async function getAllPosts() {
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
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }));
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
    
    const result = await Post.updateMany(
      { _id: { $in: postIds } },
      { $set: { createdAt: now, updatedAt: now } }
    );

    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");
    
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