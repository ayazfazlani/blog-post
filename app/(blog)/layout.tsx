// app/blog/layout.tsx  (or wherever your blog layout is)
import { Suspense } from "react";
import { getCategories } from "@/app/actions/dashboard/category/category-actions"; // Adjust path if needed
import CategorySidebar from "./components/sidebar";
import { Navbar } from '@/components/layout/header';

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar - Full width, outside the grid */}
      <Navbar />

      {/* Main content area with container */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Hidden on mobile, visible on lg+ */}
          {/* <aside className="hidden lg:block lg:col-span-1">
            <Suspense fallback={<div>Loading categories...</div>}>
              <CategorySidebar categories={categories} />
            </Suspense>
          </aside> */}

          {/* Main Content */}
          <main className="lg:col-span-4">
            {children}
          </main>
        </div>

        {/* Optional: Mobile Category Links (below content or in a collapsible) */}
        {/* If you want categories visible on mobile too, add here */}
      </div>
    </div>
  );
}