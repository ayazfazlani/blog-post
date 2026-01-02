// app/blog/layout.tsx  (or wherever your blog layout is)
import { Suspense } from "react";
import { Navbar } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AdPlaceholder } from '@/components/ads/ad-placeholder';

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar - Full width, outside the grid */}
      <Navbar />
      
      {/* Header Ad */}
      <AdPlaceholder position="header" pageType="home" className="w-full" />

      {/* Main content area with container */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <main>
          {/* Content Top Ad */}
          <AdPlaceholder position="content-top" pageType="home" className="mb-6" />
          
          {children}
          
          {/* Content Bottom Ad */}
          <AdPlaceholder position="content-bottom" pageType="home" className="mt-6" />
        </main>
      </div>

      {/* Footer */}
      <Footer />
      
      {/* Footer Ad */}
      <AdPlaceholder position="footer" pageType="home" className="w-full" />
    </div>
  );
}