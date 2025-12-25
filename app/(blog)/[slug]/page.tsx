// app/blog/[slug]/page.tsx
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { notFound } from "next/navigation";
import { Calendar, User as UserIcon} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { ReadOnlyEditor } from "@/components/ui/read-only-editor";
import Image from "next/image";

// Revalidate every 60 seconds for fresh content
export const revalidate = 60;

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectToDatabase();
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Fetch the single post by slug
  const post = await Post.findOne({ slug, published: true })
    .populate('authorId', 'name')
    .lean();

  // If post not found or not published, show 404
  if (!post) {
    notFound();
  }

  const author = post.authorId && typeof post.authorId === 'object' 
    ? { name: post.authorId.name } 
    : null;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      {/* Featured Image (if exists) */}
      {post.featuredImage && (
        <div className="mb-8 -mx-4 md:mx-0 rounded-lg overflow-hidden shadow-xl">
          <Image
            src={post.featuredImage}
            alt={post.title}
            width={1200}
            height={500}
            className="w-full h-[400px] md:h-[500px] object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
          />
        </div>
      )}

      {/* Header Section */}
      <header className="mb-8">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-foreground">
          {post.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6 pb-6 border-b">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{author?.name || "Anonymous"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <time className="text-sm" dateTime={new Date(post.createdAt).toISOString()}>
              {format(new Date(post.createdAt), "MMMM d, yyyy")}
            </time>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <article className="blog-content">
        {post.content && (
          <ReadOnlyEditor 
            content={post.content} 
            className="text-foreground"
          />
        )}
      </article>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t">
        <Link
          href="/blog"
          className="text-primary hover:underline inline-flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <span>←</span>
          <span>Back to all articles</span>
        </Link>
      </footer>
    </div>
  );
}