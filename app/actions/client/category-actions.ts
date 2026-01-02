// actions/get-categories.ts
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export async function getCategories() {
  await connectToDatabase();
  const categories = await Category.find({})
    .select('_id name slug')
    .sort({ name: 1 })
    .lean(); // lean() for plain objects
  
  // Ensure all categories have slugs
  return categories.map(cat => ({
    ...cat,
    slug: (cat as any).slug || generateSlug(cat.name),
  }));
}