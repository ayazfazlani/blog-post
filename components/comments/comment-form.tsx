"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createComment } from "@/app/actions/client/comment-actions";
import { commentSchema, type CommentFormValues } from "@/lib/validation";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onSuccess?: () => void;
}

export function CommentForm({ postId, parentId = null, onSuccess }: CommentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      postId,
      name: "",
      email: "",
      content: "",
      parentId: parentId || null,
    },
  });

  async function onSubmit(values: CommentFormValues) {
    startTransition(async () => {
      try {
        // Get IP address and user agent for spam prevention (optional)
        let ipAddress = "";
        try {
          const ipResponse = await fetch("/api/ip");
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip || "";
          }
        } catch (error) {
          // Ignore IP fetch errors
        }

        const userAgent = typeof window !== "undefined" ? navigator.userAgent : "";

        await createComment({
          ...values,
          ipAddress,
          userAgent,
        });

        toast.success("Comment submitted! It will be visible after approval.");
        form.reset({
          postId,
          name: "",
          email: "",
          content: "",
          parentId: parentId || null,
        });
        setIsSubmitted(true);
        onSuccess?.();

        // Reset submitted state after 3 seconds
        setTimeout(() => setIsSubmitted(false), 3000);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to submit comment");
      }
    });
  }

  if (isSubmitted) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-200">
          Thank you for your comment! It has been submitted and will be reviewed before being published.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">
          {parentId ? "Reply to Comment" : "Leave a Comment"}
        </h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comment *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your comment here..."
                    rows={5}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isPending} className="w-full md:w-auto">
            {isPending ? (
              "Submitting..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Comment
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

