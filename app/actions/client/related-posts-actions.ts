"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { unstable_cache } from "next/cache";

/**
 * Get related posts based on category
 * Excludes the current post and returns related posts
 * 
 * @param categoryId - Category ID to find related posts
 * @param excludeSlug - Slug of current post to exclude
 * @param limit - Number of posts to return (default: 6)
 * @returns Array of related posts
 */
async function _getRelatedPosts(
  categoryId: string | null | undefined,
  excludeSlug: string,
  limit: number = 3
) {
  try {
    await connectToDatabase();

    // Build query: same category, published, exclude current post
    const query: any = {
      published: true,
      slug: { $ne: excludeSlug }, // Exclude current post
    };

    // If category exists, filter by category
    // Otherwise, get any published posts (fallback)
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // Fetch more posts than needed, then shuffle for variety
    const fetchLimit = Math.max(limit * 2, 12); // Fetch more to ensure variety
    
    const posts = await Post.find(query)
      .select('title slug excerpt featuredImage categoryId createdAt')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 }) // Most recent first
      .limit(fetchLimit)
      .lean();

    // Shuffle posts to ensure different posts each time
    const shuffled = posts.sort(() => Math.random() - 0.5);
    
    // Take only the limit needed
    const selectedPosts = shuffled.slice(0, limit);

    return selectedPosts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      category: post.categoryId && typeof post.categoryId === 'object' ? {
        id: post.categoryId._id.toString(),
        name: post.categoryId.name,
      } : null,
      createdAt: post.createdAt,
    }));
  } catch (error: any) {
    console.error('❌ Error fetching related posts:', error);
    return []; // Return empty array on error
  }
}

/**
 * Cached version of getRelatedPosts for better performance
 */
export async function getRelatedPosts(
  categoryId: string | null | undefined,
  excludeSlug: string,
  limit: number = 6
) {
  try {
    const cacheKey = `related-posts-${categoryId || 'all'}-${excludeSlug}`;
    
    return await unstable_cache(
      () => _getRelatedPosts(categoryId, excludeSlug, limit),
      [cacheKey],
      {
        revalidate: 300, // Cache for 5 minutes
        tags: ['posts', categoryId ? `category-${categoryId}` : 'all-posts'],
      }
    )();
  } catch (error: any) {
    console.error('❌ Error in cached related posts:', error);
    // Fallback to direct call
    return _getRelatedPosts(categoryId, excludeSlug, limit);
  }
}

