// app/blog/page.tsx
import BlogListClient from "./components/blog-list-client";
import { getPublishedPosts } from "@/app/actions/client/blog-actions";
import { Suspense } from "react";

export const revalidate = 60; // ISR: revalidate every 60 seconds
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
  updatedAt: Date;
};

async function BlogListServer({
  categoryId,
}: {
  categoryId: string | undefined;
}) {
  const result = await getPublishedPosts(categoryId, 6, 0);

  const posts: PostWithRelations[] = (result.posts || []).map(post => ({
    ...post,
    createdAt: new Date(post.createdAt),
    updatedAt: new Date(post.updatedAt),
  }));

  return (
    <BlogListClient
      initialPosts={posts}
      initialHasMore={result.hasMore || false}
      categoryId={categoryId}
    />
  );
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