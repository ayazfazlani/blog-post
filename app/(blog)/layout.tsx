// app/blog/layout.tsx  (or wherever your blog layout is)
import { Suspense } from "react";
import { Navbar } from '@/components/layout/header';

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar - Full width, outside the grid */}
      <Navbar />

      {/* Main content area with container */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}