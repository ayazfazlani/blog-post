import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

async function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
}

export async function GET() {
  const baseUrl = await getSiteUrl();
  
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
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
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
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating pages sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

