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
    
    const Category = (await import("@/models/Category")).default;
    const categories = await Category.find({})
      .select('name slug updatedAt createdAt')
      .sort({ name: 1 })
      .lean();

    // Helper function to generate slug from name
    function generateSlug(name: string): string {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const urls = categories.map((category) => {
      const lastmod = category.updatedAt || category.createdAt || new Date();
      const slug = (category as any).slug || generateSlug(category.name);
      return `  <url>
    <loc>${baseUrl}/category/${slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls || '  <!-- No categories yet -->'}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating categories sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

