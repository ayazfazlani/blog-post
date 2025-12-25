// components/layout/Navbar.tsx
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { getCategories } from '@/app/actions/client/category-actions';
import { ModeToggle } from './darkmode';

async function DesktopNav({ categories }: { categories: { _id: string; name: string; slug: string }[] }) {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex gap-6">
      <NavigationMenuItem >
          <NavigationMenuLink asChild >
            <Link href="/" className="font-medium">
              All Posts
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      {categories.map((category) => (
        <NavigationMenuItem key={category._id}>
          <NavigationMenuLink asChild key={category._id}>
            <Link href={`/?category=${category._id}`} className="font-medium">
              {category.name}
            </Link>
          
          </NavigationMenuLink>
        </NavigationMenuItem>
        ))}

        {/* <NavigationMenuItem>
          <NavigationMenuTrigger className="font-medium">Categories</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {categories.map((category) => (
                <li key={category._id}>
                  <NavigationMenuLink asChild>
                    <Link 
                      href={`/category/${category.slug}`}
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="text-sm font-medium leading-none">{category.name}</div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/about" className="font-medium">
              About
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem> */}


      <ModeToggle />
      </NavigationMenuList>
    </NavigationMenu>
  );
}

async function MobileNav({ categories }: { categories: { _id: string; name: string; slug: string }[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-4 sm:w-[400px]">
        <SheetTitle>Menu</SheetTitle>
        <SheetDescription className="sr-only">Main navigation</SheetDescription>
        <nav className="flex flex-col space-y-4 mt-8">
        <Link href="/" className="text-lg font-medium">
            All Posts
          </Link>
          {categories.map((category) => (
            <Link key={category._id} href={`/?category=${category._id}`} className="text-lg font-medium">
              {category.name}
            </Link>
          ))}
          {/* <div className="space-y-2">
            <p className="text-lg font-medium">Categories</p>
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/category/${category.slug}`}
                className="block pl-4 text-muted-foreground hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
          </div> */}
          <Link href="/about" className="text-lg font-medium">
            About
          </Link>
        </nav>
        <ModeToggle />
      </SheetContent>
    </Sheet>
  );
}

export async function Navbar() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
          {/* Replace with your logo */}
          <span>My Blog</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex">
          <DesktopNav categories={categories} />
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <MobileNav categories={categories} />
        </div>
      </div>
    </header>
  );
}