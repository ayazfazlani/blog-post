// app/blog/page.tsx
import { getPublishedPosts } from "@/app/actions/client/blog-actions";
import BlogListClient from "./components/blog-list-client";

// Revalidate every 60 seconds for fresh content
export const revalidate = 60;

export default async function BlogPage({
  searchParams,
}: { 
  params: Promise<{ category?: string }>, 
  searchParams: Promise<{ category?: string }> 
}) {
  // Fetch initial posts (first page)
  const resolvedSearchParams = await searchParams;
  const categoryId = resolvedSearchParams?.category || undefined;
  
  // Get first page of posts (6 posts)
  const result = await getPublishedPosts(categoryId, 6, 0);

  return (
    <BlogListClient 
      initialPosts={result.posts || []}
      initialHasMore={result.hasMore || false}
      categoryId={categoryId}
    />
  );
}