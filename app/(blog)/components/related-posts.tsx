import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

type RelatedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: { id: string; name: string } | null;
  createdAt: Date;
};

interface RelatedPostsProps {
  posts: RelatedPost[];
}

/**
 * Related Posts Component
 * Displays a box with 3 related posts, each with image and link
 */
export default function RelatedPosts({ posts }: RelatedPostsProps) {
  // Don't render if no posts
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 pt-8 border-t">
      {/* Section Title */}
      <h2 className="text-2xl font-bold mb-6 text-foreground">
        Related Posts
      </h2>

      {/* Related Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
          >
            <Link href={`/blog/${post.slug}`} prefetch={true} className="block">
              <CardContent className="p-0">
                {/* Featured Image */}
                {post.featuredImage ? (
                  <div className="relative w-full overflow-hidden bg-muted aspect-video">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  </div>
                ) : (
                  <div className="w-full bg-muted aspect-video flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">No Image</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  {/* Category Badge */}
                  {post.category && (
                    <Badge variant="outline" className="mb-2 text-xs">
                      {post.category.name}
                    </Badge>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Date */}
                  {post.createdAt && !isNaN(new Date(post.createdAt).getTime()) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <time dateTime={new Date(post.createdAt).toISOString()}>
                        {Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }).format(new Date(post.createdAt))}
                      </time>
                    </div>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

