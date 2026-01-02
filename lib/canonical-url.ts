/**
 * Helper function to generate canonical URLs
 */
export async function getCanonicalUrl(path: string): Promise<string> {
  // Get site settings for domain
  const { getSiteSettings } = await import("@/app/actions/client/site-settings-actions");
  const settings = await getSiteSettings();
  
  // Use domain from settings, or fallback to environment variable, or localhost
  let domain = settings?.domain || process.env.NEXT_PUBLIC_SITE_URL;
  
  if (!domain && process.env.VERCEL_URL) {
    domain = `https://${process.env.VERCEL_URL}`;
  }
  
  if (!domain) {
    domain = 'http://localhost:3000';
  }
  
  // Ensure domain doesn't have protocol already
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  
  // Ensure path starts with /, but don't modify if it's already correct
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
}

