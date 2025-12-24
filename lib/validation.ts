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
