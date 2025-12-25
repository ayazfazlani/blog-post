// actions/get-categories.ts
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';

export async function getCategories() {
  await connectToDatabase();
  return await Category.find({})
    .select('_id name slug')
    .sort({ name: 1 })
    .lean(); // lean() for plain objects
}