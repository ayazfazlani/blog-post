// lib/validation.ts
import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters" }),
  content: z.any().optional(), // Or z.record(z.any()) for better type safety
  excerpt: z
    .string()
    .min(10, { message: "Excerpt must be at least 10 characters" })
    .optional(),
  categoryId: z.string().min(1, { message: "Please select a category" }),
  authorId: z.string().min(1, { message: "Please select an author" }),
  featuredImage: z.string().optional(),
  published: z.boolean().optional(),
});

export type PostFormValues = z.infer<typeof postSchema>;

export const categorySchema = z.object({
  name: z.string().min(3, "At least 3 characters").max(50),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const adSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(['banner', 'sidebar', 'inline', 'popup', 'sticky']),
  placement: z.enum(['auto', 'custom']),
  position: z.enum(['header', 'footer', 'sidebar-top', 'sidebar-bottom', 'content-top', 'content-middle', 'content-bottom', 'between-posts', 'after-post', 'before-post']).optional(),
  adCode: z.string().min(1, "Ad code is required"),
  imageUrl: z.string().optional(),
  linkUrl: z.string().url().optional().or(z.literal('')),
  altText: z.string().optional(),
  domains: z.array(z.string()).optional(),
  pages: z.array(z.enum(['home', 'blog', 'category', 'post', 'page', 'all'])).optional(),
  categories: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional().or(z.date().optional()),
  endDate: z.string().optional().or(z.date().optional()),
  priority: z.number().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
});

export type AdFormValues = z.infer<typeof adSchema>;

export const commentSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z
    .union([
      z.string().email("Invalid email address"),
      z.literal(""),
    ])
    .optional(),
  content: z.string().min(10, "Comment must be at least 10 characters").max(2000),
  parentId: z.string().optional().nullable(),
});

export type CommentFormValues = z.infer<typeof commentSchema>;