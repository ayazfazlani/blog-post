'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getPublishedPosts } from "@/app/actions/client/blog-actions";


type PostWithRelations = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  category: { id: string; name: string } | null;
  author: { id: string; name: string; email: string } | null;
  createdAt: Date;
};

interface BlogListClientProps {
  initialPosts: PostWithRelations[];
  initialHasMore: boolean;
  categoryId?: string;
}

// Helper function to get storage key for current category
const getStorageKey = (categoryId?: string) => `blog-posts-${categoryId || 'all'}`;

// Helper function to serialize posts for storage (convert Dates to ISO strings)
const serializePosts = (posts: PostWithRelations[]) => {
  return posts.map(post => ({
    ...post,
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
  }));
};

// Helper function to deserialize posts from storage (convert ISO strings to Dates)
const deserializePosts = (posts: any[]): PostWithRelations[] => {
  return posts.map(post => ({
    ...post,
    createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
  }));
};

export default function BlogListClient({ 
  initialPosts, 
  initialHasMore,
  categoryId 
}: BlogListClientProps) {
  const searchParams = useSearchParams();
  
  // Helper function to deduplicate posts by ID
  const deduplicatePosts = (posts: PostWithRelations[]): PostWithRelations[] => {
    const seen = new Set<string>();
    return posts.filter(post => {
      if (seen.has(post.id)) {
        return false;
      }
      seen.add(post.id);
      return true;
    });
  };

  // Helper function to sort posts by createdAt descending (newest first)
  // Compares dates properly to ensure latest posts appear first
  const sortPostsByDate = (posts: PostWithRelations[]): PostWithRelations[] => {
    if (posts.length === 0) return posts;
    
    return [...posts].sort((a, b) => {
      try {
        // Convert to Date objects if they aren't already
        const dateA = a.createdAt instanceof Date 
          ? a.createdAt 
          : (typeof a.createdAt === 'string' ? new Date(a.createdAt) : new Date());
        const dateB = b.createdAt instanceof Date 
          ? b.createdAt 
          : (typeof b.createdAt === 'string' ? new Date(b.createdAt) : new Date());
        
        // Get timestamps for comparison
        const timeA = dateA.getTime();
        const timeB = dateB.getTime();
        
        // Return negative if B is newer (B should come first), positive if A is newer
        // This gives us descending order (newest first)
        return timeB - timeA;
      } catch (error) {
        console.error('Error sorting posts by date:', error, { a: a.createdAt, b: b.createdAt });
        return 0; // Keep original order if date parsing fails
      }
    });
  };

  // Always start with initialPosts to avoid hydration mismatch
  // Ensure posts are sorted by date (newest first)
  const [posts, setPosts] = useState<PostWithRelations[]>(sortPostsByDate(deduplicatePosts(initialPosts)));
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [lastCategoryId, setLastCategoryId] = useState<string | undefined>(categoryId);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore from sessionStorage after initial mount (to avoid hydration mismatch)
  // But only if server data matches (same first post), otherwise use fresh server data
  useEffect(() => {
    setIsHydrated(true);
    
    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey(categoryId);
      const stored = sessionStorage.getItem(storageKey);
      
      if (stored && initialPosts.length > 0) {
        try {
          const parsed = JSON.parse(stored);
          const storedPosts = deserializePosts(parsed.posts || []);
          
          // Check if server's first post matches stored first post
          // If they match, it's safe to restore (user navigated back)
          // If they don't match, server has newer data (new post was created)
          const serverFirstPostId = initialPosts[0].id;
          const storedFirstPostId = storedPosts.length > 0 ? storedPosts[0].id : null;
          
          if (serverFirstPostId === storedFirstPostId) {
            // Same first post - safe to restore from sessionStorage (includes paginated posts)
            // Sort posts to ensure correct order (newest first)
            setPosts(sortPostsByDate(deduplicatePosts(storedPosts)));
            setHasMore(parsed.hasMore ?? initialHasMore);
          } else {
            // Server has different/newer posts - clear sessionStorage and use server data
            sessionStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.error('Error parsing stored posts:', error);
          // Clear corrupted sessionStorage
          sessionStorage.removeItem(storageKey);
        }
      } else if (stored && initialPosts.length === 0) {
        // No server posts but have stored posts - clear storage (server is source of truth)
        sessionStorage.removeItem(storageKey);
      }
    }
  }, []); // Only run once on mount

  // Save posts to sessionStorage whenever they change (but only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      const storageKey = getStorageKey(lastCategoryId);
      const data = {
        posts: serializePosts(posts),
        hasMore,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [posts, hasMore, lastCategoryId, isHydrated]);

  // Reset posts when category filter changes in URL
  useEffect(() => {
    const urlCategoryId = searchParams.get('category') || undefined;
    
    // Only fetch if category actually changed (not on initial mount)
    if (urlCategoryId !== lastCategoryId) {
      setLastCategoryId(urlCategoryId);
      setIsLoading(true);
      
      // Clear old category's storage
      if (typeof window !== 'undefined' && lastCategoryId !== undefined) {
        sessionStorage.removeItem(getStorageKey(lastCategoryId));
      }
      
      // Try to restore from storage for new category
      if (typeof window !== 'undefined') {
        const storageKey = getStorageKey(urlCategoryId);
        const stored = sessionStorage.getItem(storageKey);
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const storedPosts = deserializePosts(parsed.posts || []);
            // Sort posts to ensure correct order (newest first)
            setPosts(sortPostsByDate(deduplicatePosts(storedPosts)));
            setHasMore(parsed.hasMore ?? false);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing stored posts:', error);
          }
        }
      }
      
      startTransition(async () => {
        try {
          const result = await getPublishedPosts(urlCategoryId, 6, 0);
          const newPosts = result.posts.map(post => ({
            ...post,
            createdAt: new Date(post.createdAt),
          }));
          // Sort posts to ensure correct order (newest first)
          setPosts(sortPostsByDate(deduplicatePosts(newPosts)));
          setHasMore(result.hasMore || false);
        } catch (error) {
          console.error('Error loading filtered posts:', error);
          setPosts([]);
          setHasMore(false);
        } finally {
          setIsLoading(false);
        }
      });
    }
  }, [searchParams, lastCategoryId]);

  const loadMore = () => {
    startTransition(async () => {
      try {
        // Get current category from URL
        const currentCategoryId = searchParams.get('category') || undefined;
        const result = await getPublishedPosts(currentCategoryId, 6, posts.length);
        
        if (result.posts) {
          const newPosts = result.posts.map(post => ({
            ...post,
            createdAt: new Date(post.createdAt),
          }));
          
          // Filter out duplicates by checking existing post IDs
          // Then sort to ensure correct order (newest first)
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
            const allPosts = [...prev, ...uniqueNewPosts];
            return sortPostsByDate(allPosts);
          });
          setHasMore(result.hasMore);
        }
      } catch (error) {
        console.error('Error loading more posts:', error);
      }
    });
  };

  // Show loading state when filtering
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Blog & Articles</h1>
        <p className="text-center text-muted-foreground">No blog posts found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 dark:bg-dark-background">
      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-0">
              <Link href={`/${post.slug}`} prefetch={true} className="block">
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="relative w-full overflow-hidden bg-muted aspect-video">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="w-full h-full object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      loading="lazy"
                      // placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Category Badge */}
                  {post.category && (
                    <Badge variant="outline" className="mb-3">
                      {post.category.name}
                    </Badge>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  {post.excerpt ? (
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  ) : post.content ? (
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>
                  ) : null}

                  {/* Author & Date */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {post.author?.name || "Anonymous"}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {post.createdAt && !isNaN(post.createdAt.getTime()) ? (
                        <time className="text-sm" dateTime={post.createdAt.toISOString()}>
                          {Intl.DateTimeFormat('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }).format(post.createdAt)}
                        </time>
                      ) : (
                        <span className="text-sm">Date unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-12">
          <Button
            onClick={loadMore}
            disabled={isPending}
            variant="outline"
            size="lg"
            className="min-w-[150px]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* End of posts message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center mt-12 text-muted-foreground">
          <p>You've reached the end of the blog posts.</p>
        </div>
      )}
    </div>
  );
}

