// app/actions/category-actions.ts
"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import Post from "@/models/Post";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { categorySchema } from "@/lib/validation";

// READ: Get all categories
async function _getCategories() {
  await connectToDatabase();
  const categories = await Category.find({}).select('_id name slug').sort({ name: 1 }).lean();
  return categories.map(cat => ({
    id: cat._id.toString(),
    _id: cat._id.toString(),
    name: cat.name,
    slug: (cat as any).slug || generateSlug(cat.name), // Generate slug if missing
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  }));
}

// Cache categories for better performance
// Note: Cache is invalidated when categories are created/updated/deleted
// Using longer cache time since categories don't change often and we invalidate on mutations
export async function getCategories() {
  return unstable_cache(
    _getCategories,
    ['categories'],
    {
      revalidate: 3600, // Cache for 1 hour (categories rarely change)
      tags: ['categories'],
    }
  )();
}

//get one category by id - Optimized with parallel queries
export async function getCategoryById(id: string) {
  await connectToDatabase();
  
  // Fetch category and post count in parallel for better performance
  const [category, postsCount] = await Promise.all([
    Category.findById(id).select('_id name slug description').lean(),
    Post.countDocuments({ categoryId: id }),
  ]);
  
  if (!category) return null;
  
  // Only fetch posts if needed (lazy loading)
  const posts = postsCount > 0 
    ? await Post.find({ categoryId: id })
        .select('_id title slug')
        .lean()
    : [];
  
  return {
    id: category._id.toString(),
    name: category.name,
    slug: (category as any).slug || generateSlug(category.name),
    description: (category as any).description || '',
    posts: posts.map(p => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
    })),
    postsCount,
  };
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// CREATE
export async function createCategory(data: unknown) {
  await connectToDatabase();
  const validated = categorySchema.parse(data); // Secure validation

  // Generate slug from name
  let slug = generateSlug(validated.name);
  
  // Ensure slug is unique
  let counter = 1;
  let uniqueSlug = slug;
  while (await Category.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  console.log("Creating category:", validated.name, "with slug:", uniqueSlug);  
  try {
    const result = await Category.create({ 
      name: validated.name,
      slug: uniqueSlug,
    });
    console.log("Category created:", result);
    // Invalidate both path and cache tag
    revalidatePath("/dashboard/category");
    revalidatePath("/category");
    revalidateTag("categories");
    revalidateTag("sitemap");
    return { success: true, category: result };
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

  // Generate slug from name
  let slug = generateSlug(validated.name);
  
  // Ensure slug is unique (excluding current category)
  let counter = 1;
  let uniqueSlug = slug;
  while (await Category.findOne({ slug: uniqueSlug, _id: { $ne: id } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  await Category.findByIdAndUpdate(id, { 
    name: validated.name,
    slug: uniqueSlug,
  });

  // Invalidate both path and cache tag
  revalidatePath("/dashboard/category");
  revalidatePath("/category");
  revalidateTag("categories");
}

// DELETE
export async function deleteCategory(id: string) {
  await connectToDatabase();
  // Optional: Check if category has posts
  const postsCount = await Post.countDocuments({ categoryId: id });
  if (postsCount > 0) throw new Error("Cannot delete category with posts");

  await Category.findByIdAndDelete(id);

  // Invalidate both path and cache tag
  revalidatePath("/dashboard/category");
  revalidatePath("/category");
  revalidateTag("categories");
  revalidateTag("sitemap");
}
