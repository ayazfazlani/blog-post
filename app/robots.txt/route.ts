import { NextResponse } from 'next/server';
import { getSiteSettingsForLayout } from '@/lib/get-site-settings';

export async function GET() {
  const settings = await getSiteSettingsForLayout();
  
  const robots = [];
  if (!settings.robotsIndex) robots.push('noindex');
  if (!settings.robotsFollow) robots.push('nofollow');
  
  const userAgent = '*';
  const rules = robots.length > 0 ? robots.join(', ') : 'index, follow';
  const crawlDelay = settings.revisitDays > 1 ? `\nCrawl-delay: ${settings.revisitDays}` : '';
  
  const robotsTxt = `User-agent: ${userAgent}
Allow: /
Disallow: /dashboard/
Disallow: /api/
${robots.length > 0 ? `\n${rules}` : ''}${crawlDelay}

Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

