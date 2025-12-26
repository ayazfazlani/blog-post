"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { unstable_cache } from "next/cache";

// Helper function to safely convert date to ISO string
function toISOString(date: any): string {
    if (!date) return new Date().toISOString();
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) {
            return new Date().toISOString();
        }
        return dateObj.toISOString();
    } catch {
        return new Date().toISOString();
    }
}

/**
 * Get published posts with pagination support
 * Optimized version with caching and better query performance
 * @param categoryId - Optional category filter
 * @param limit - Number of posts to fetch (default: 6)
 * @param skip - Number of posts to skip (default: 0)
 * @returns Object with posts array and hasMore boolean
 */
async function _getPublishedPosts(
    categoryId?: string | null,
    limit: number = 6,
    skip: number = 0
) {
    await connectToDatabase();
    
    // Build query conditionally
    const query: any = { published: true };
    
    // Only add categoryId filter if provided and not empty
    if (categoryId && typeof categoryId === 'string' && categoryId.trim().length > 0) {
        query.categoryId = categoryId.trim();
    }
    
    try {
        // Fetch one extra post to determine if there are more
        const posts = await Post.find(query)
            .select('title slug content excerpt featuredImage authorId categoryId createdAt updatedAt')
            .populate('authorId', 'name email')
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .limit(limit + 1) // Fetch one extra to check if there are more
            .skip(skip)
            .lean();
        
        // Check if there are more posts
        const hasMore = posts.length > limit;
        const actualPosts = hasMore ? posts.slice(0, limit) : posts;
        
        return {
            posts: actualPosts.map(post => ({
                id: post._id.toString(),
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt,
                published: post.published,
                categoryId: post.categoryId ? (typeof post.categoryId === 'object' ? post.categoryId._id.toString() : post.categoryId.toString()) : null,
                category: post.categoryId && typeof post.categoryId === 'object' ? {
                    id: post.categoryId._id.toString(),
                    name: post.categoryId.name,
                } : null,
                authorId: post.authorId ? (typeof post.authorId === 'object' ? post.authorId._id.toString() : post.authorId.toString()) : null,
                featuredImage: post.featuredImage,
                author: post.authorId && typeof post.authorId === 'object' ? {
                    id: post.authorId._id.toString(),
                    name: post.authorId.name,
                    email: post.authorId.email,
                } : null,
                createdAt: toISOString(post.createdAt),
                updatedAt: toISOString(post.updatedAt),
            })),
            hasMore,
        };
    } catch (error: any) {
        console.error('Error fetching published posts:', error);
        return {
            posts: [],
            hasMore: false,
        };
    }
}

// Cache the function for better performance (60 seconds cache)
export async function getPublishedPosts(
    categoryId?: string | null,
    limit: number = 6,
    skip: number = 0
) {
    // Only cache the first page (skip === 0) to avoid stale pagination
    if (skip === 0) {
        const cacheKey = `published-posts-${categoryId || 'all'}-${limit}`;
        return unstable_cache(
            async () => _getPublishedPosts(categoryId, limit, skip),
            [cacheKey],
            {
                revalidate: 60, // Cache for 60 seconds
                tags: ['posts', categoryId ? `category-${categoryId}` : 'all-posts'],
            }
        )();
    }
    
    // For pagination (skip > 0), don't cache to ensure fresh data
    return _getPublishedPosts(categoryId, limit, skip);
}