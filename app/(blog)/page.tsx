// app/blog/page.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getPublishedPosts } from "@/app/actions/client/blog-actions";
import { ReadOnlyEditor } from "@/components/ui/read-only-editor";

// Force dynamic rendering to ensure searchParams are always fresh
export const dynamic = 'force-dynamic';

// Infer the type from the function return value
type PostWithRelations = Awaited<ReturnType<typeof getPublishedPosts>>[0];

export default async function BlogPage({
  searchParams,
}: { params: Promise<{ category?: string }>, searchParams: Promise<{ category?: string }> }) {
  // Step 1: Fetch published posts from database
  const resolvedSearchParams = await searchParams;
  const categoryId = resolvedSearchParams?.category || undefined;
  const posts = await getPublishedPosts(categoryId);

  // If no posts, show a message
  if (posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">Blog & Articles</h1>
        <p className="text-center text-muted-foreground">No blog posts found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Title */}
      {/* <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Articles</h1>
        <p className="text-xl text-muted-foreground">
          Insights, tutorials, and news from our team
        </p>
      </div> */}

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post: PostWithRelations) => (
          <Card
            key={post.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-0">
              <Link href={`/${post.slug}`} className="block">
                {/* Optional: Show image if you have one in your DB */}
                {post.featuredImage && (
                  <div>
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  </div>
                  )}

                <div className="p-6">
                  {/* Category Badge (if you have category field) */}
                  {post.category && (
                    <Badge variant="outline" className="mb-3">
                      {post.category && typeof post.category === 'object' ? post.category.name : "Uncategorized"}
                    </Badge>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt (optional) */}
                  {post.content && (
                    <ReadOnlyEditor 
                      content={post.content} 
                      className="text-muted-foreground mb-4 line-clamp-3"
                    />
                  )}

                  {/* Author & Date */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {post.author?.name || "Anonymous"}
                    </div>
                    <div className="flex items-center" suppressHydrationWarning>
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(post.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>

                
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}