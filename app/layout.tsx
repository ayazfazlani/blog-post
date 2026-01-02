import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { getSiteSettingsForLayout } from "@/lib/get-site-settings";
import { DynamicHead } from "@/components/dynamic-head";

// Generate dynamic metadata
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsForLayout();
  
  const title = settings.siteTitle || settings.metaTitle || settings.siteName || "My Blog";
  const description = settings.seoDescription || settings.metaDescription || settings.siteDescription || "";
  const keywords = settings.keywords ? settings.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : [];
  
  // Build robots meta
  const robots = [];
  if (!settings.robotsIndex) robots.push('noindex');
  if (!settings.robotsFollow) robots.push('nofollow');
  if (robots.length === 0) robots.push('index', 'follow');
  
  const metadata: Metadata = {
    title: title.length > 70 ? title.substring(0, 70) : title,
    description: description.length > 160 ? description.substring(0, 160) : description,
    keywords: keywords.length > 0 ? keywords : undefined,
    robots: robots.join(', '),
    authors: settings.author ? [{ name: settings.author }] : undefined,
    other: {
      'content-type': settings.contentType || 'UTF-8',
      'revisit-after': `${settings.revisitDays} days`,
      ...(settings.keywords ? { 'keywords': settings.keywords } : {}),
    },
  };

  // Add favicon if available
  if (settings.faviconUrl) {
    metadata.icons = {
      icon: settings.faviconUrl,
      shortcut: settings.faviconUrl,
      apple: settings.faviconUrl,
    };
  }

  return metadata;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettingsForLayout();
  
  // Parse language code from language name (simplified)
  const langMap: Record<string, string> = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Korean': 'ko',
    'Arabic': 'ar',
    'Hindi': 'hi',
  };
  const langCode = langMap[settings.language] || 'en';
  
  return (
    <html lang={langCode} suppressHydrationWarning> 
      <body className="min-h-screen bg-background">
        <DynamicHead customScripts={settings.customHeadScripts} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
    );
  }