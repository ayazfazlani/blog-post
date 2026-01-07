import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import { toPSTISOString } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function getSiteUrl(): string {
  // Prioritize NEXT_PUBLIC_SITE_URL, then VERCEL_URL, then fallback
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''); // Remove trailing slash
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback for local development
  return 'http://localhost:3000';
}

export async function GET() {
  const baseUrl = getSiteUrl();
  
  try {
    await connectToDatabase();
    
    const Page = (await import("@/models/Page")).default;
    const pages = await Page.find({ published: true })
      .select('slug updatedAt createdAt')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const urls = pages.map((page) => {
      const lastmod = page.updatedAt || page.createdAt || new Date();
      return `  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${toPSTISOString(new Date(lastmod))}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls || '  <!-- No pages published yet -->'}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('Error generating pages sitemap:', error);
    // Return empty sitemap on error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Error loading pages -->
</urlset>`;
    
    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  }
}

