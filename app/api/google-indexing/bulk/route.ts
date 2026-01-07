import { NextRequest, NextResponse } from 'next/server';
import { submitUrlsToGoogle } from '@/lib/google-indexing';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import { getCanonicalUrl } from '@/lib/canonical-url';
import { toPSTTimestamp } from '@/lib/date-utils';

/**
 * Bulk submit published posts to Google Search Console
 * POST /api/google-indexing/bulk
 * Body: { 
 *   limit?: number, // Optional: limit number of posts (default: all)
 *   updatedSince?: string // Optional: ISO date string - only submit posts updated since this date
 * }
 */
export async function POST(request: NextRequest) {
  const timestamp = toPSTTimestamp();
  console.log(`[${timestamp}] 📥 Bulk Google indexing request received`);
  
  try {
    // Check if Google Search Console is configured
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const hasPrivateKey = !!process.env.GOOGLE_PRIVATE_KEY;
    
    if (!serviceAccountEmail || !hasPrivateKey) {
      const maskedEmail = serviceAccountEmail 
        ? `${serviceAccountEmail.substring(0, 3)}***${serviceAccountEmail.substring(serviceAccountEmail.indexOf('@'))}`
        : 'Not configured';
      
      console.error(`[${timestamp}] ❌ Google Search Console not configured`);
      console.error(`[${timestamp}] 📧 Service Account Email: ${maskedEmail}`);
      console.error(`[${timestamp}] 🔑 Private Key: ${hasPrivateKey ? 'Set' : 'Missing'}`);
      
      return NextResponse.json(
        { 
          error: 'Google Search Console not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.',
          setupGuide: '/GOOGLE_INDEXING_SETUP.md',
          config: {
            accountEmail: maskedEmail,
            hasPrivateKey
          }
        },
        { status: 400 }
      );
    }
    
    // Log account info
    const maskedEmail = `${serviceAccountEmail.substring(0, 3)}***${serviceAccountEmail.substring(serviceAccountEmail.indexOf('@'))}`;
    console.log(`[${timestamp}] ✅ Google Search Console configured`);
    console.log(`[${timestamp}] 📧 Service Account: ${maskedEmail}`);

    const body = await request.json().catch(() => ({}));
    const { limit, updatedSince } = body;

    // Connect to database
    await connectToDatabase();

    // Build query
    const query: any = { published: true };
    
    // If updatedSince is provided, only get posts updated since that date
    if (updatedSince) {
      try {
        const sinceDate = new Date(updatedSince);
        query.updatedAt = { $gte: sinceDate };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid updatedSince date format. Use ISO date string (e.g., "2024-01-01T00:00:00Z")' },
          { status: 400 }
        );
      }
    }

    // Fetch published posts
    const posts = await Post.find(query)
      .select('slug updatedAt createdAt')
      .sort({ updatedAt: -1 }) // Most recently updated first
      .limit(limit || 1000) // Default limit of 1000 posts
      .lean();

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No published posts found to submit',
        submitted: 0,
        total: 0,
      });
    }

    // Generate URLs for all posts
    const urls: string[] = [];
    for (const post of posts) {
      try {
        const url = await getCanonicalUrl(`/latest/${post.slug}`);
        urls.push(url);
      } catch (error) {
        console.error(`Failed to generate URL for post ${post.slug}:`, error);
      }
    }

    if (urls.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Failed to generate URLs for posts',
        submitted: 0,
        total: posts.length,
      }, { status: 500 });
    }

    // Submit all URLs to Google (with rate limiting built-in)
    const submissionTimestamp = toPSTTimestamp();
    console.log(`[${submissionTimestamp}] 🚀 Starting bulk submission of ${urls.length} URLs`);
    
    const successCount = await submitUrlsToGoogle(urls, 'URL_UPDATED');
    
    const completionTimestamp = toPSTTimestamp();
    console.log(`[${completionTimestamp}] ✅ Bulk submission completed: ${successCount}/${urls.length} successful`);

    return NextResponse.json({
      success: true,
      message: `Submitted ${successCount} of ${urls.length} posts to Google Search Console`,
      submitted: successCount,
      total: urls.length,
      failed: urls.length - successCount,
      urls: urls.slice(0, 10), // Return first 10 URLs as sample
      timestamp: completionTimestamp,
      accountEmail: maskedEmail,
    });
  } catch (error: any) {
    console.error('Error in bulk Google indexing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to submit all published posts (for easy access)
 * GET /api/google-indexing/bulk?limit=100&updatedSince=2024-01-01
 */
export async function GET(request: NextRequest) {
  const timestamp = toPSTTimestamp();
  console.log(`[${timestamp}] 📥 Bulk Google indexing GET request received`);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const updatedSince = searchParams.get('updatedSince') || undefined;

    // Check if Google Search Console is configured
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const hasPrivateKey = !!process.env.GOOGLE_PRIVATE_KEY;
    
    if (!serviceAccountEmail || !hasPrivateKey) {
      const maskedEmail = serviceAccountEmail 
        ? `${serviceAccountEmail.substring(0, 3)}***${serviceAccountEmail.substring(serviceAccountEmail.indexOf('@'))}`
        : 'Not configured';
      
      console.error(`[${timestamp}] ❌ Google Search Console not configured`);
      console.error(`[${timestamp}] 📧 Service Account Email: ${maskedEmail}`);
      console.error(`[${timestamp}] 🔑 Private Key: ${hasPrivateKey ? 'Set' : 'Missing'}`);
      
      return NextResponse.json(
        { 
          error: 'Google Search Console not configured',
          setupGuide: 'See GOOGLE_INDEXING_SETUP.md for setup instructions',
          config: {
            accountEmail: maskedEmail,
            hasPrivateKey
          }
        },
        { status: 400 }
      );
    }
    
    // Log account info
    const maskedEmail = `${serviceAccountEmail.substring(0, 3)}***${serviceAccountEmail.substring(serviceAccountEmail.indexOf('@'))}`;
    console.log(`[${timestamp}] ✅ Google Search Console configured`);
    console.log(`[${timestamp}] 📧 Service Account: ${maskedEmail}`);

    await connectToDatabase();

    const query: any = { published: true };
    
    if (updatedSince) {
      try {
        const sinceDate = new Date(updatedSince);
        query.updatedAt = { $gte: sinceDate };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid updatedSince date format. Use ISO date string' },
          { status: 400 }
        );
      }
    }

    const posts = await Post.find(query)
      .select('slug updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(limit || 1000)
      .lean();

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No published posts found',
        submitted: 0,
        total: 0,
      });
    }

    const urls: string[] = [];
    for (const post of posts) {
      try {
        const url = await getCanonicalUrl(`/latest/${post.slug}`);
        urls.push(url);
      } catch (error) {
        console.error(`Failed to generate URL for post ${post.slug}:`, error);
      }
    }

    const submissionTimestamp = toPSTTimestamp();
    console.log(`[${submissionTimestamp}] 🚀 Starting bulk submission of ${urls.length} URLs`);
    
    const successCount = await submitUrlsToGoogle(urls, 'URL_UPDATED');
    
    const completionTimestamp = toPSTTimestamp();
    console.log(`[${completionTimestamp}] ✅ Bulk submission completed: ${successCount}/${urls.length} successful`);

    return NextResponse.json({
      success: true,
      message: `Submitted ${successCount} of ${urls.length} posts to Google`,
      submitted: successCount,
      total: urls.length,
      failed: urls.length - successCount,
      timestamp: completionTimestamp,
      accountEmail: maskedEmail,
    });
  } catch (error: any) {
    console.error('Error in bulk Google indexing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

