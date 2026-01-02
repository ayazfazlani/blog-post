// app/blog/[slug]/page.tsx
import { connectToDatabase } from "@/lib/mongodb";
import { notFound } from "next/navigation";
import { Calendar, User as UserIcon} from "lucide-react";
import Link from "next/link";
import { ReadOnlyEditor } from "@/components/ui/read-only-editor";
import Image from "next/image";
import { Suspense } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Post from "@/models/Post";
import { unstable_cache } from "next/cache";
import ContentWithRelatedPosts from "@/app/(blog)/components/content-with-related-posts";
import { getRelatedPosts } from "@/app/actions/client/related-posts-actions";
import { getSiteSettings } from "@/app/actions/client/site-settings-actions";
import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/canonical-url";
import { AdPlaceholder } from "@/components/ads/ad-placeholder";
import { CommentsSection } from "@/components/comments/comments-section";
import { getApprovedComments } from "@/app/actions/client/comment-actions";

// Revalidate every 5 minutes for fresh content (longer cache = faster)
export const revalidate = 300;

// Cache function for individual blog posts - Optimized query
async function _getPostBySlug(slug: string) {
  await connectToDatabase();
  // Use compound index: { published: 1, slug: 1 } for fastest lookup
  const post = await Post.findOne({ published: true, slug })
    .select('_id title slug content excerpt featuredImage authorId categoryId createdAt updatedAt')
    .populate('authorId', 'name email')
    .populate('categoryId', 'name')
    .lean();
  return post;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await _getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const title = post.title;
  const description = post.excerpt || '';
  const canonicalUrl = await getCanonicalUrl(`/blog/${slug}`);

  return {
    title: title.length > 70 ? title.substring(0, 70) : title,
    description: description.length > 160 ? description.substring(0, 160) : description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || description,
      ...(post.featuredImage && {
        images: [post.featuredImage],
      }),
      url: canonicalUrl,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Use cached function for faster loading
  const getCachedPost = unstable_cache(
    () => _getPostBySlug(slug),
    [`post-${slug}`],
    {
      revalidate: 300, // Cache for 5 minutes
      tags: ['posts', `post-${slug}`],
    }
  );

  const post = await getCachedPost();

  // If post not found or not published, show 404
  if (!post) {
    notFound();
  }

  const author = post.authorId && typeof post.authorId === 'object' 
    ? { 
        name: post.authorId.name || 'Anonymous',
        email: post.authorId.email || null
      } 
    : { name: 'Anonymous', email: null };

  // Get category ID for related posts
  const categoryId = post.categoryId 
    ? (typeof post.categoryId === 'object' ? post.categoryId._id.toString() : post.categoryId.toString())
    : null;

  // Calculate content length to determine how many related posts to show
  const contentLength = post.content ? post.content.replace(/<[^>]*>/g, '').length : 0;
  
  // Determine display logic:
  // - Short content (< ~200 words / ~1000 chars): No related posts
  // - Content >= ~200 words (~1000 chars): Show 3 posts at 33% AND 3 posts at 66% (two times)
  // 200 words ≈ 1000-1200 characters (average 5-6 chars per word)
  const wordCount = contentLength / 5; // Approximate word count (5 chars per word average)
  const isShortContent = wordCount < 200;
  const shouldShowRelatedPosts = wordCount >= 200; // Show for blogs with 200+ words

  // Fetch enough posts to ensure we have different ones for each position
  // Fetch 12 posts total (6 for 33%, 6 for 66%), each showing 3 posts
  const allRelatedPosts = await getRelatedPosts(categoryId, slug, 12);

  // Split posts for different positions
  // First 6 posts for 33% position (will show 3), next 6 for 66% position (will show 3)
  const relatedPosts33 = allRelatedPosts.slice(0, 6);
  const relatedPosts66 = allRelatedPosts.slice(6, 12);

  // Show 3 posts at each position
  const postCount33 = shouldShowRelatedPosts ? 3 : 0; // 3 posts at 33%
  const postCount66 = shouldShowRelatedPosts ? 3 : 0; // 3 posts at 66%

  const siteSettings = await getSiteSettings();

  // Get approved comments for this post
  const postId = post._id.toString();
  const approvedComments = await getApprovedComments(postId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "datePublished": post.createdAt,
    "dateModified": post.updatedAt,
    "author": {
      "@type": "Person",
      "name": author?.name || "Anonymous"
    },
    // "publisher": {
    //   "@type": "Organization",
    //   "name": siteSettings?.name || "Anonymous"
    // },
    "image": {
      "@type": "ImageObject",
      "url": post.featuredImage,
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://${siteSettings?.domain || 'example.com'}/blog/${post.slug}`
    },
    "articleBody": post.content,
    // "keywords": post.keywords,
    "category": post.category,
    // "tags": post.tags,
    "url": `https://${siteSettings?.domain || 'example.com'}/blog/${post.slug}`,
    "wordCount": post.content.length,
    "readingTime": post.content.length / 200,
  }

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="container mx-auto px-4 py-2 md:py-12 max-w-4xl">
      {/* Featured Image (if exists) */}

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
            {post.createdAt && !isNaN(new Date(post.createdAt).getTime()) ? (
              <time className="text-sm" dateTime={new Date(post.createdAt).toISOString()}>
                {Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(post.createdAt))}
              </time>
            ) : (
              <span className="text-sm">Date unavailable</span>
            )}
          </div>
        </div>
      </header>
      
      {/* Before Post Ad */}
      <AdPlaceholder position="before-post" pageType="post" className="mb-6" />
      
      <Suspense fallback={<div>Loading...</div>}>
      {post.featuredImage && (
        <div className="mb-8 -mx-4 md:mx-0 rounded-lg overflow-hidden shadow-xl">
          <AspectRatio ratio={16 / 9}>
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="w-full h-full object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
          />
          </AspectRatio>
        </div>
      )}
      </Suspense>

      {/* Main Content with Related Posts at 33% and 66% */}
      <article>
        {post.content && (
          <ContentWithRelatedPosts
            content={post.content}
            relatedPosts33={relatedPosts33}
            relatedPosts66={relatedPosts66}
            postCount33={postCount33}
            postCount66={postCount66}
          />
        )}
      </article>

      {/* After Post Ad */}
      <AdPlaceholder position="after-post" pageType="post" className="mt-8 mb-6" />

      {/* Comments Section */}
      <CommentsSection postId={postId} initialComments={approvedComments} />

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t">
        <Link
          href="/"
          prefetch={true}
          className="text-primary hover:underline inline-flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <span>←</span>
          <span>Back to all articles</span>
        </Link>
      </footer>
    </div>
    </>
  );
}

