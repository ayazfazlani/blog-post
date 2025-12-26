// app/actions/category-actions.ts
"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import Post from "@/models/Post";
import { revalidatePath, unstable_cache } from "next/cache";
import { categorySchema } from "@/lib/validation";

// READ: Get all categories
async function _getCategories() {
  await connectToDatabase();
  const categories = await Category.find({}).sort({ name: 1 }).lean();
  return categories.map(cat => ({
    id: cat._id.toString(),
    name: cat.name,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  }));
}

// Cache categories for better performance
export async function getCategories() {
  return unstable_cache(
    _getCategories,
    ['categories'],
    {
      revalidate: 300, // Cache for 5 minutes (categories don't change often)
      tags: ['categories'],
    }
  )();
}

//get one category by id
export async function getCategoryById(id: string) {
  await connectToDatabase();
  const category = await Category.findById(id);
  if (!category) return null;
  
  const posts = await Post.find({ categoryId: id });
  const postsCount = posts.length;
  
  return {
    id: category._id.toString(),
    name: category.name,
    posts: posts.map(p => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
    })),
    postsCount,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

// CREATE
export async function createCategory(data: unknown) {
  await connectToDatabase();
  const validated = categorySchema.parse(data); // Secure validation

  console.log("Creating category:", validated.name);  
  try {
    const result = await Category.create({ name: validated.name });
    console.log("Category created:", result);
    revalidatePath("/dashboard/category");
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
}

// UPDATE
export async function updateCategory(id: string, data: unknown) {
  await connectToDatabase();
  const validated = categorySchema.parse(data);

  const existing = await Category.findOne({ 
    name: validated.name, 
    _id: { $ne: id } 
  });
  if (existing) throw new Error("Another category with this name exists");

  await Category.findByIdAndUpdate(id, { name: validated.name });

  revalidatePath("/dashboard/category");
}

// DELETE
export async function deleteCategory(id: string) {
  await connectToDatabase();
  // Optional: Check if category has posts
  const postsCount = await Post.countDocuments({ categoryId: id });
  if (postsCount > 0) throw new Error("Cannot delete category with posts");

  await Category.findByIdAndDelete(id);

  revalidatePath("/dashboard/category");
}
