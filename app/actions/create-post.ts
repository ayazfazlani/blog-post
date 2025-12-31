// app/actions/create-post.ts
"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { revalidatePath } from "next/cache";
import { postSchema } from "@/lib/validation";

export async function createPost(data: unknown) {
  await connectToDatabase();
  const validated = postSchema.safeParse(data);
  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  await Post.create({
    title: validated.data.title,
    slug: validated.data.slug,
    excerpt: validated.data.excerpt,
    content: validated.data.content,
    published: validated.data.published ?? false,
    categoryId: validated.data.categoryId || null,
    authorId: validated.data.authorId,
    featuredImage: validated.data.featuredImage || null,
  });

  revalidatePath("/dashboard/blog");
  revalidatePath("/blog");
  // redirect("/dashboard/blog");
}

export async function updatePost(id: string, data: unknown) {
  await connectToDatabase();
  const validated = postSchema.safeParse(data);
  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  await Post.findByIdAndUpdate(id, {
    title: validated.data.title,
    slug: validated.data.slug,
    excerpt: validated.data.excerpt,
    content: validated.data.content,
    published: validated.data.published ?? false,
    categoryId: validated.data.categoryId || null,
    authorId: validated.data.authorId,
    featuredImage: validated.data.featuredImage || null,
  });

  revalidatePath("/dashboard/blog");
  revalidatePath(`/blog/${validated.data.slug}`);
}

export async function getPostById(id: string) {
  await connectToDatabase();
  const post = await Post.findById(id)
    .populate("authorId", "id name email")
    .populate("categoryId", "id name")
    .lean();

  if (!post) {
    throw new Error("Post not found");
  }

  return {
    id: post._id.toString(),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
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
  };
}
