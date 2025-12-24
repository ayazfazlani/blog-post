// app/blog/category-sidebar.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Category = {
  id: string;
  name: string;
};

type Props = {
  categories: Category[];
};

export default function CategorySidebar({ categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

  const createQueryString = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    return params.toString();
  };

  const handleClick = (category: string) => {
    router.push(`${pathname}?${createQueryString(category)}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant={currentCategory === "all" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleClick("all")}
        >
          All Posts
        </Button>

        {categories.map((category) => (
          <Button
            key={category.id}
            variant={currentCategory === category.id ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleClick(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}