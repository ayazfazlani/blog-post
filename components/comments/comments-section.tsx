"use client";

import { Suspense } from "react";
import { CommentsList } from "./comments-list";
import { CommentForm } from "./comment-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentsSectionProps {
  postId: string;
  initialComments: Awaited<ReturnType<typeof import("@/app/actions/client/comment-actions").getApprovedComments>>;
}

export function CommentsSection({ postId, initialComments }: CommentsSectionProps) {
  return (
    <div className="mt-12 space-y-8">
      <Card>
        <CardContent className="p-6">
          <CommentForm postId={postId} />
        </CardContent>
      </Card>

      <Suspense fallback={<CommentsSkeleton />}>
        <CommentsList comments={initialComments} postId={postId} />
      </Suspense>
    </div>
  );
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

