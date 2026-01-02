"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Search, MoreHorizontal, Check, X, Trash2, Eye, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { approveComment, rejectComment, deleteComment } from "@/app/actions/dashboard/comments/comment-actions";
import { toast } from "sonner";

type Comment = {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  name: string;
  email: string;
  content: string;
  approved: boolean;
  parentId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

interface CommentsTableClientProps {
  initialComments: Comment[];
}

export function CommentsTableClient({ initialComments }: CommentsTableClientProps) {
  const [comments, setComments] = useState(initialComments);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.name?.toLowerCase().includes(search.toLowerCase()) ||
      comment.email?.toLowerCase().includes(search.toLowerCase()) ||
      comment.content?.toLowerCase().includes(search.toLowerCase()) ||
      comment.postTitle?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "approved" && comment.approved) ||
      (filter === "pending" && !comment.approved);

    return matchesSearch && matchesFilter;
  });

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await approveComment(id);
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === id ? { ...comment, approved: true } : comment
          )
        );
        toast.success("Comment approved successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to approve comment");
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      try {
        await rejectComment(id);
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === id ? { ...comment, approved: false } : comment
          )
        );
        toast.success("Comment rejected successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to reject comment");
      }
    });
  };

  const handleDelete = (comment: Comment) => {
    setCommentToDelete(comment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!commentToDelete) return;

    startTransition(async () => {
      try {
        await deleteComment(commentToDelete.id);
        setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
        toast.success("Comment deleted successfully");
        setDeleteDialogOpen(false);
        setCommentToDelete(null);
      } catch (error: any) {
        toast.error(error.message || "Failed to delete comment");
      }
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("approved")}
          >
            Approved
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    {search || filter !== "all"
                      ? "No comments found matching your filters."
                      : "No comments yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredComments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{comment.name}</p>
                        {comment.email && (
                          <p className="text-sm text-muted-foreground">
                            {comment.email.startsWith("guest.") ? (
                              <span className="italic text-muted-foreground">Guest (no email provided)</span>
                            ) : (
                              comment.email
                            )}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm line-clamp-2">{comment.content}</p>
                      {comment.parentId && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Reply
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/blog/${comment.postSlug}`}
                        target="_blank"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {comment.postTitle}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={comment.approved ? "default" : "secondary"}>
                        {comment.approved ? (
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Approved
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <X className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <time dateTime={comment.createdAt.toString()}>
                          {format(new Date(comment.createdAt), "MMM d, yyyy")}
                        </time>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/blog/${comment.postSlug}`}
                              target="_blank"
                              className="flex items-center"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Post
                            </Link>
                          </DropdownMenuItem>
                          {!comment.approved && (
                            <DropdownMenuItem
                              onClick={() => handleApprove(comment.id)}
                              disabled={isPending}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {comment.approved && (
                            <DropdownMenuItem
                              onClick={() => handleReject(comment.id)}
                              disabled={isPending}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(comment)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the comment from{" "}
              <strong>{commentToDelete?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setCommentToDelete(null);
              }}
            >
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

