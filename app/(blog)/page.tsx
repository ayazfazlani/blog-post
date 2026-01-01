// app/blog/page.tsx
import BlogListClient from "./components/blog-list-client";
import { getPublishedPosts } from "@/app/actions/client/blog-actions";
import { Suspense } from "react";

export const revalidate = 300; // ISR: revalidate every 5 minutes (longer cache = faster)
export const dynamic = 'force-dynamic'; // Allow dynamic rendering for search params

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

// Helper to safely convert ISO string to Date
function safeDate(date: any): Date {
  if (!date) return new Date();
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? new Date() : date;
  }
  try {
    const dateObj = new Date(date);
    return isNaN(dateObj.getTime()) ? new Date() : dateObj;
  } catch {
    return new Date();
  }
}

async function BlogListServer({
  categoryId,
}: {
  categoryId: string | undefined;
}) {
  try {
    const result = await getPublishedPosts(categoryId, 6, 0);

    if (!result || !result.posts) {
      console.error('❌ No posts returned from getPublishedPosts');
      return (
        <BlogListClient
          initialPosts={[]}
          initialHasMore={false}
          categoryId={categoryId}
        />
      );
    }

    // Safely convert dates and filter out any invalid posts
    // Sort by createdAt descending to ensure latest posts appear first
    const posts: PostWithRelations[] = (result.posts || [])
      .filter(post => post && post.id && post.title) // Filter invalid posts
      .map((post): PostWithRelations => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content || null,
        excerpt: post.excerpt || null,
        featuredImage: post.featuredImage || null,
        category: post.category || null,
        author: post.author || null,
        createdAt: safeDate(post.createdAt),
      }))
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const dateA = a.createdAt.getTime();
        const dateB = b.createdAt.getTime();
        return dateB - dateA;
      });

    return (
      <BlogListClient
        initialPosts={posts}
        initialHasMore={result.hasMore || false}
        categoryId={categoryId}
      />
    );
  } catch (error: any) {
    console.error('❌ Error in BlogListServer:', {
      message: error?.message,
      stack: error?.stack,
      categoryId,
    });
    // Return empty state instead of crashing
    return (
      <BlogListClient
        initialPosts={[]}
        initialHasMore={false}
        categoryId={categoryId}
      />
    );
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const categoryId = category || undefined;

  return (

    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <BlogListServer categoryId={categoryId} />
    </Suspense>

  );
}