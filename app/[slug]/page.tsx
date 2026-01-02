import { getPageBySlug } from "@/app/actions/dashboard/pages/page-actions";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReadOnlyEditor } from "@/components/ui/read-only-editor";
import Image from "next/image";
import { getCanonicalUrl } from "@/lib/canonical-url";

export const dynamic = 'force-dynamic';
export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  const title = page.metaTitle || page.title;
  const description = page.metaDescription || page.excerpt || '';
  const canonicalUrl = await getCanonicalUrl(`/${slug}`);

  return {
    title: title.length > 70 ? title.substring(0, 70) : title,
    description: description.length > 160 ? description.substring(0, 160) : description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: page.title,
      description: page.excerpt || description,
      ...(page.featuredImage && {
        images: [page.featuredImage],
      }),
      url: canonicalUrl,
    },
  };
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  
  // Skip if this is a reserved route (blog, category, dashboard, api, etc.)
  const reservedRoutes = ['blog', 'category', 'dashboard', 'api', 'login', 'register', 'sitemap', 'robots', 'firebase-messaging-sw', '_next'];
  if (reservedRoutes.some(route => slug.toLowerCase().startsWith(route))) {
    notFound();
  }
  
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Featured Image */}
      {page.featuredImage && (
        <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={page.featuredImage}
            alt={page.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>
        {page.excerpt && (
          <p className="text-xl text-muted-foreground mb-4">{page.excerpt}</p>
        )}
        {page.author && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>By {page.author.name}</span>
            {page.updatedAt && (
              <span>
                Updated {new Date(page.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Page Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {page.content ? (
          <ReadOnlyEditor content={page.content} />
        ) : (
          <p className="text-muted-foreground">No content available.</p>
        )}
      </div>
    </article>
  );
}

