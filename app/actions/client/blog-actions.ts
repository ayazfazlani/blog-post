"use server";

import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import Post from "@/models/Post";

/**
 * Get published posts with pagination support
 * @param categoryId - Optional category filter
 * @param limit - Number of posts to fetch (default: 6)
 * @param skip - Number of posts to skip (default: 0)
 * @returns Object with posts array and hasMore boolean
 */
export async function getPublishedPosts(
    categoryId?: string | null,
    limit: number = 6,
    skip: number = 0
) {
    await connectToDatabase();
    
    // Import models to ensure they're registered
    const UserModule = await import("@/models/User");
    const CategoryModule = await import("@/models/Category");
    const User = UserModule.default;
    const Category = CategoryModule.default;
    
    // Ensure models exist in mongoose.models
    // If they don't, explicitly register them
    if (!mongoose.models.User) {
        const userSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String },
            role: { type: String, default: 'user' },
        }, { timestamps: true });
        mongoose.model('User', userSchema);
    }
    
    if (!mongoose.models.Category) {
        const categorySchema = new mongoose.Schema({
            name: { type: String, required: true, unique: true },
        }, { timestamps: true });
        mongoose.model('Category', categorySchema);
    }
    
    // Build query conditionally
    const query: any = { published: true };
    
    // Only add categoryId filter if provided and not empty
    if (categoryId && typeof categoryId === 'string' && categoryId.trim().length > 0) {
        query.categoryId = categoryId.trim();
    }
    
    try {
        // Get total count for pagination
        const totalCount = await Post.countDocuments(query);
        
        // Fetch posts with pagination
        const posts = await Post.find(query)
            .select('title slug content excerpt featuredImage authorId categoryId createdAt updatedAt')
            .populate('authorId', 'name email')
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();
        
        const hasMore = skip + posts.length < totalCount;
        
        return {
            posts: posts.map(post => ({
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
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            })),
            hasMore,
            total: totalCount,
        };
    } catch (error: any) {
        // If populate fails, try without populate and manually fetch related data
        if (error.message?.includes('Schema hasn\'t been registered')) {
            console.error('Model registration error, fetching without populate:', error);
            // Get total count
            const totalCount = await Post.countDocuments(query);
            
            const posts = await Post.find(query)
                .select('title slug content excerpt featuredImage authorId categoryId createdAt updatedAt')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean();
            
            // Manually populate author and category
            const postsWithRelations = await Promise.all(
                posts.map(async (post) => {
                    let author = null;
                    let category = null;
                    
                    if (post.authorId) {
                        try {
                            const authorDoc = await User.findById(post.authorId).lean();
                            if (authorDoc) {
                                author = {
                                    id: authorDoc._id.toString(),
                                    name: authorDoc.name,
                                    email: authorDoc.email,
                                };
                            }
                        } catch (e) {
                            console.error('Error fetching author:', e);
                        }
                    }
                    
                    if (post.categoryId) {
                        try {
                            const categoryDoc = await Category.findById(post.categoryId).lean();
                            if (categoryDoc) {
                                category = {
                                    id: categoryDoc._id.toString(),
                                    name: categoryDoc.name,
                                };
                            }
                        } catch (e) {
                            console.error('Error fetching category:', e);
                        }
                    }
                    
                    return {
                        id: post._id.toString(),
                        title: post.title,
                        slug: post.slug,
                        content: post.content,
                        excerpt: post.excerpt,
                        published: post.published,
                        categoryId: post.categoryId ? post.categoryId.toString() : null,
                        category,
                        authorId: post.authorId ? post.authorId.toString() : null,
                        featuredImage: post.featuredImage,
                        author,
                        createdAt: post.createdAt,
                        updatedAt: post.updatedAt,
                    };
                })
            );
            
            const hasMore = skip + postsWithRelations.length < totalCount;
            
            return {
                posts: postsWithRelations,
                hasMore,
                total: totalCount,
            };
        }
        
        // If error occurs, return empty result
        return {
            posts: [],
            hasMore: false,
            total: 0,
        };
    }
}