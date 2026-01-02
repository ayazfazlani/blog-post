// app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Settings, Menu, Book , Box, Shield, Key, Users, Image as ImageIcon, FileText, Megaphone, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { ModeToggle } from "@/components/layout/darkmode";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call logout API
      const res = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Logout failed');
      }

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      toast.success('Logged out successfully');
      
      // Redirect to login page
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/dashboard/category", label: "Category", icon: Box },
    { href: "/dashboard/blog", label: "Blog", icon: Book },
    { href: "/dashboard/pages", label: "Pages", icon: FileText },
    { href: "/dashboard/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/dashboard/ads", label: "Ads", icon: Megaphone },
    { href: "/dashboard/comments", label: "Comments", icon: MessageSquare },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/roles", label: "Roles", icon: Shield },
    { href: "/dashboard/permissions", label: "Permissions", icon: Key },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r bg-background p-6">
        <div className="mb-8 px-2">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <header className="sticky top-0 flex h-16 flex-shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
          {/* Mobile Sidebar Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-full flex-col">
                <div className="border-b p-6">
                  <h2 className="text-lg font-semibold">Dashboard</h2>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="border-t p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full justify-start gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center justify-between w-full min-w-0">
            <h2 className="text-lg font-semibold truncate">Dashboard</h2>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}