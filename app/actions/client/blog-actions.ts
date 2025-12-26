"use server";

import { connectToDatabase } from "@/lib/mongodb";
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
    try {
        // Connect to database first
        await connectToDatabase();
        
        // Import models AFTER connection (important for serverless environments)
        // This ensures models are registered with the connected mongoose instance
        const PostModule = await import("@/models/Post");
        const UserModule = await import("@/models/User");
        const CategoryModule = await import("@/models/Category");
        
        const Post = PostModule.default;
        
        // Build query conditionally
        const query: any = { published: true };
        
        // Only add categoryId filter if provided and not empty
        if (categoryId && typeof categoryId === 'string' && categoryId.trim().length > 0) {
            query.categoryId = categoryId.trim();
        }
        
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
        // Log detailed error for debugging in production
        console.error('❌ Error fetching published posts:', {
            message: error?.message,
            stack: error?.stack,
            categoryId,
            limit,
            skip,
            mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Missing',
        });
        
        // Re-throw error so it can be caught by the caller
        throw new Error(`Failed to fetch posts: ${error?.message || 'Unknown error'}`);
    }
}

// Cache the function for better performance (60 seconds cache)
export async function getPublishedPosts(
    categoryId?: string | null,
    limit: number = 6,
    skip: number = 0
) {
    try {
        // Only cache the first page (skip === 0) to avoid stale pagination
        if (skip === 0) {
            const cacheKey = `published-posts-${categoryId || 'all'}-${limit}`;
            try {
                return await unstable_cache(
                    async () => {
                        try {
                            return await _getPublishedPosts(categoryId, limit, skip);
                        } catch (error) {
                            console.error('❌ Error in cached function:', error);
                            throw error;
                        }
                    },
                    [cacheKey],
                    {
                        revalidate: 60, // Cache for 60 seconds
                        tags: ['posts', categoryId ? `category-${categoryId}` : 'all-posts'],
                    }
                )();
            } catch (cacheError: any) {
                // If caching fails, try direct call
                console.warn('⚠️ Cache failed, trying direct call:', cacheError?.message);
                return _getPublishedPosts(categoryId, limit, skip);
            }
        }
        
        // For pagination (skip > 0), call directly
        return _getPublishedPosts(categoryId, limit, skip);
    } catch (error: any) {
        console.error('❌ getPublishedPosts error:', {
            message: error?.message,
            stack: error?.stack,
            categoryId,
            limit,
            skip,
        });
        // Return empty result instead of throwing to prevent page crashes
        return {
            posts: [],
            hasMore: false,
        };
    }
}