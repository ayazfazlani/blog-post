"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MessageSquare, Reply, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentForm } from "./comment-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type Comment = {
  id: string;
  name: string;
  email: string;
  content: string;
  parentId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type CommentWithReplies = Comment & { replies: CommentWithReplies[] };

interface CommentsListProps {
  comments: Comment[];
  postId: string;
}

export function CommentsList({ comments, postId }: CommentsListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Build a tree structure for nested comments
  const buildCommentTree = (comments: Comment[]): CommentWithReplies[] => {
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // First pass: create map of all comments with empty replies array
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!;
        parent.replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree(comments);

  const CommentItem = ({ comment, depth = 0 }: { comment: CommentWithReplies; depth?: number }) => {
    const isReplying = replyingTo === comment.id;
    const maxDepth = 3; // Limit nesting depth

    return (
      <div className={`${depth > 0 ? "ml-6 md:ml-12 mt-4 border-l-2 border-muted pl-4" : ""}`}>
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{comment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
            </div>

            {depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                className="text-xs"
              >
                <Reply className="mr-2 h-3 w-3" />
                {isReplying ? "Cancel Reply" : "Reply"}
              </Button>
            )}

            {isReplying && (
              <div className="mt-4">
                <CommentForm
                  postId={postId}
                  parentId={comment.id}
                  onSuccess={() => setReplyingTo(null)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (commentTree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-2xl font-bold">
          Comments ({commentTree.length})
        </h2>
      </div>

      {commentTree.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

