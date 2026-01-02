"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Edit, Trash2, Eye, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { deletePage, togglePagePublished } from "@/app/actions/dashboard/pages/page-actions";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type Page = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  order: number;
};

export default function PagesTableClient({ 
  initialPages = []
}: { 
  initialPages?: Page[] 
}) {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const router = useRouter();

  const filteredPages = pages.filter(
    (page) => {
      const searchLower = search.toLowerCase();
      return (
        page.title.toLowerCase().includes(searchLower) ||
        page.slug.toLowerCase().includes(searchLower)
      );
    }
  );

  const handleDelete = (page: Page) => {
    setPageToDelete(page);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!pageToDelete) return;

    startTransition(async () => {
      try {
        await deletePage(pageToDelete.id);
        setPages(prev => prev.filter(p => p.id !== pageToDelete.id));
        toast.success("Page deleted successfully");
        setDeleteDialogOpen(false);
        setPageToDelete(null);
      } catch (error: any) {
        toast.error(error.message || "Failed to delete page");
      }
    });
  };

  const handleTogglePublished = (page: Page) => {
    startTransition(async () => {
      try {
        const result = await togglePagePublished(page.id);
        setPages(prev => prev.map(p => 
          p.id === page.id ? { ...p, published: result.published } : p
        ));
        toast.success(`Page ${result.published ? 'published' : 'unpublished'} successfully`);
      } catch (error: any) {
        toast.error(error.message || "Failed to toggle page status");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button asChild>
          <Link href="/dashboard/pages/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Link>
        </Button>
      </div>

      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search ? "No pages found matching your search." : "No pages yet. Create your first page!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium max-w-[200px]">
                    <Link href={`/dashboard/pages/${page.id}/edit`} className="hover:underline truncate block">
                      {page.title}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    /pages/{page.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.published ? "default" : "secondary"}>
                      {page.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{page.order}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(page.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/${page.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/pages/${page.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleTogglePublished(page)}
                          disabled={isPending}
                        >
                          {page.published ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(page)}
                          className="text-destructive"
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{pageToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

