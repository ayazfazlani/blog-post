import BlogListClient from "@/app/(blog)/components/blog-list-client";
import { getPublishedPosts } from "@/app/actions/client/blog-actions";
import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/canonical-url";
import { AdPlaceholder } from "@/components/ads/ad-placeholder";

export const dynamic = 'force-dynamic';
export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getCategoryBySlug(slug: string) {
  await connectToDatabase();
  // First try to find by slug
  let category = await Category.findOne({ slug }).lean();
  
  // If not found, try to find by name (for backward compatibility)
  if (!category) {
    const allCategories = await Category.find({}).select('_id name slug description').lean();
    category = allCategories.find(cat => {
      const catSlug = (cat as any).slug || generateSlug(cat.name);
      return catSlug === slug;
    }) as any;
  }
  
  return category;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  const title = `${category.name} - Blog Posts`;
  const description = category.description 
    ? `${category.description} - Browse all blog posts in the ${category.name} category.`
    : `Browse all blog posts in the ${category.name} category.`;
  const canonicalUrl = await getCanonicalUrl(`/category/${slug}`);

  return {
    title: title.length > 70 ? title.substring(0, 70) : title,
    description: description.length > 160 ? description.substring(0, 160) : description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: category.name,
      description: category.description || description,
      url: canonicalUrl,
    },
  };
}

async function BlogListServer({ categoryId }: { categoryId: string }) {
  try {
    const result = await getPublishedPosts(categoryId, 6, 0);

    if (!result || !result.posts) {
      return (
        <BlogListClient
          initialPosts={[]}
          initialHasMore={false}
          categoryId={categoryId}
        />
      );
    }

    const posts = (result.posts || [])
      .filter(post => post && post.id && post.title)
      .map((post) => {
        // Safely convert createdAt to Date
        const postDate = post.createdAt as unknown;
        let createdAt: Date;
        try {
          if (postDate && typeof postDate === 'object' && 'getTime' in postDate) {
            createdAt = postDate as Date;
          } else if (postDate) {
            createdAt = new Date(postDate as string | number);
          } else {
            createdAt = new Date();
          }
        } catch {
          createdAt = new Date();
        }
        
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content || null,
          excerpt: post.excerpt || null,
          featuredImage: post.featuredImage || null,
          category: post.category || null,
          author: post.author || null,
          createdAt,
        };
      })
      .sort((a, b) => {
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
    console.error('Error in BlogListServer:', error);
    return (
      <BlogListClient
        initialPosts={[]}
        initialHasMore={false}
        categoryId={categoryId}
      />
    );
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const categoryId = category._id.toString();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-2">{category.description}</p>
        )}
      </div>
      
      {/* Sidebar Top Ad */}
      <div className="lg:hidden">
        <AdPlaceholder 
          position="sidebar-top" 
          pageType="category" 
          categoryId={categoryId}
          className="mb-6"
        />
      </div>
      
      <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
        <BlogListServer categoryId={categoryId} />
      </Suspense>
      
      {/* Sidebar Bottom Ad */}
      <div className="lg:hidden">
        <AdPlaceholder 
          position="sidebar-bottom" 
          pageType="category" 
          categoryId={categoryId}
          className="mt-6"
        />
      </div>
    </div>
  );
}

