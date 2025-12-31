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
  updatedAt: Date;
};

interface BlogListClientProps {
  initialPosts: PostWithRelations[];
  initialHasMore: boolean;
  categoryId?: string;
}

export default function BlogListClient({ 
  initialPosts, 
  initialHasMore,
  categoryId 
}: BlogListClientProps) {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [lastCategoryId, setLastCategoryId] = useState<string | undefined>(categoryId);

  // Reset posts when category filter changes in URL
  useEffect(() => {
    const urlCategoryId = searchParams.get('category') || undefined;
    
    // Only fetch if category actually changed (not on initial mount)
    if (urlCategoryId !== lastCategoryId) {
      setLastCategoryId(urlCategoryId);
      setIsLoading(true);
      
      startTransition(async () => {
        try {
          const result = await getPublishedPosts(urlCategoryId, 6, 0);
          setPosts(result.posts.map(post => ({
            ...post,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt),
          })) || []);
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
          setPosts(prev => [...prev, ...result.posts.map(post => ({
            ...post,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt),
          }))]);
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

