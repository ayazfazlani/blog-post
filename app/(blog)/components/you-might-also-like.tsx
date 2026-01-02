import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Link2 } from "lucide-react";

type RelatedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: { id: string; name: string } | null;
  createdAt: Date;
};

interface YouMightAlsoLikeProps {
  posts: RelatedPost[];
  count: number; // Number of posts to show (1 for short content, up to 6 for long)
}

/**
 * "You Might Also Like" Component
 * Displays related posts inline within content
 * Shows 1 post for short content, up to 6 for long content
 * Styled with dashed border like the example
 */
export default function YouMightAlsoLike({ posts, count }: YouMightAlsoLikeProps) {
  // Don't render if no posts
  if (!posts || posts.length === 0) {
    return null;
  }

  // Take only the number of posts needed
  const displayPosts = posts.slice(0, count);

  return (
    <div className="my-12">
      {/* Bordered Box with Dashed Border */}
      <div className="border-2 border-dashed border-primary rounded-lg p-6 bg-muted/30">
        {/* Section Title with Icon */}
        <div className="flex items-center gap-2 mb-6">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-primary uppercase">
            You Might Also Like
          </h3>
        </div>

        {/* Related Posts List */}
        <div className="space-y-4">
          {displayPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              prefetch={true}
              className="block group hover:bg-background/50 rounded-md p-3 -m-3 transition-colors"
            >
              <div className="flex gap-4 items-start">
                {/* Featured Image - Left Side */}
                {post.featuredImage ? (
                  <div className="relative w-20 h-12 min-w-[80px] overflow-hidden bg-muted rounded-md shrink-0">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="96px"
                      loading="lazy"
                    //   placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 min-w-[80px] bg-muted rounded-md flex items-center justify-center shrink-0">
                    <span className="text-muted-foreground text-xs">No Image</span>
                  </div>
                )}

                {/* Content - Right Side */}
                <div className="flex-1 space-y-2 min-w-0">
                  {/* Category Badge */}
                  {/* {post.category && (
                    <Badge variant="outline" className="text-xs w-fit">
                      {post.category.name}
                    </Badge>
                  )} */}

                  {/* Title */}
                  <h4 className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h4>

                  {/* Excerpt (only for longer content)
                  {count > 1 && post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  )} */}

                  {/* Date */}
                  {/* {post.createdAt && !isNaN(new Date(post.createdAt).getTime()) && (
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
                  )} */}
                </div>
              </div>

              {/* Divider (except for last item) */}
              {index < displayPosts.length - 1 && (
                <div className="border-t border-border/50 mt-4 pt-4" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

