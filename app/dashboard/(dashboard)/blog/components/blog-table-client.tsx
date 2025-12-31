// app/dashboard/blog/components/BlogTableClient.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MoreHorizontal, Edit, Trash2, Eye, Calendar, Plus, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { deletePost, bulkUpdatePostDates } from "@/app/actions/dashboard/blog/blog-actions";
import { useTransition } from "react";
import { toast } from "sonner";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: Date;
  author: { name: string | null; email: string | null } | null;
  category: { id: string; name: string } | null;
};

export default function BlogTableClient({ 
  initialPosts = []
}: { 
  initialPosts?: BlogPost[] 
}) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const filteredPosts = posts.filter(
    (post) => {
      const searchLower = search.toLowerCase();
      return (
        post.title.toLowerCase().includes(searchLower) ||
        post.author?.name?.toLowerCase().includes(searchLower) ||
        post.author?.email?.toLowerCase().includes(searchLower) ||
        post.category?.name?.toLowerCase().includes(searchLower)
      );
    }
  );

  const handleDelete = (post: BlogPost) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!postToDelete) return;

    startTransition(async () => {
      await deletePost(postToDelete.id);
      // Optimistically remove from UI
      setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
      setSelectedPosts(prev => {
        const next = new Set(prev);
        next.delete(postToDelete.id);
        return next;
      });
      toast.success("Post deleted successfully");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    });
  };

  const handleSelectPost = (postId: string, checked: boolean) => {
    setSelectedPosts(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    } else {
      setSelectedPosts(new Set());
    }
  };

  const handleBulkUpdateDates = () => {
    if (selectedPosts.size === 0) {
      toast.error("Please select at least one post");
      return;
    }

    startTransition(async () => {
      try {
        const postIds = Array.from(selectedPosts);
        const result = await bulkUpdatePostDates(postIds);
        
        // Update local state with new dates
        const now = new Date();
        setPosts(prev => prev.map(post => 
          selectedPosts.has(post.id) 
            ? { ...post, createdAt: now }
            : post
        ));
        
        setSelectedPosts(new Set());
        toast.success(result.message);
      } catch (error: any) {
        toast.error(error.message || "Failed to update post dates");
      }
    });
  };

  const isAllSelected = filteredPosts.length > 0 && selectedPosts.size === filteredPosts.length;
  const isIndeterminate = selectedPosts.size > 0 && selectedPosts.size < filteredPosts.length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <Link href="/dashboard/blog/create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Post
          </Link>
        </Button>
      </div>

      {selectedPosts.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-4">
          <div className="text-sm font-medium">
            {selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected
          </div>
          <Button
            onClick={handleBulkUpdateDates}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            <Clock className="mr-2 h-4 w-4" />
            {isPending ? "Updating..." : "Update Dates to Now"}
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all posts"
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPosts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                {search ? "No posts found" : "No blog posts yet"}
              </TableCell>
            </TableRow>
          ) : (
            filteredPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPosts.has(post.id)}
                    onCheckedChange={(checked) => handleSelectPost(post.id, checked as boolean)}
                    aria-label={`Select ${post.title}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/blog/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {post.category ? (
                    <Badge variant="outline">{post.category.name}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">No category</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={post.published ? "default" : "secondary"}>
                    {post.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(post.createdAt), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Eye className="mr-2 h-4 w-4" /> View Live
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/blog/${post.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => handleDelete(post)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "<strong>{postToDelete?.title}</strong>"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

