// app/dashboard/blog/create/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor"
import { GalleryImagePicker } from "@/components/gallery-image-picker";



import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createPost } from "@/app/actions/create-post";
import { postSchema, type PostFormValues } from "@/lib/validation";
import { getUsers } from "@/app/actions/users/get-users";
import { getCategories } from "@/app/actions/dashboard/category/category-actions";
import { revalidate } from "../page";
import { revalidatePath } from "next/cache";



export default function CreateBlogPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  // Manage editor content separately from form
  const [editorContent, setEditorContent] = useState<string>("");

  // Load users and categories on mount
  const [users, setUsers] = useState<Awaited<ReturnType<typeof getUsers>>>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([]);

  useEffect(() => {
    // Load users and categories in parallel for faster page load
    Promise.all([
      getUsers().then(setUsers),
      getCategories().then(setCategories),
    ]).catch(error => {
      console.error('Error loading form data:', error);
    });
  }, []);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      slug: "",
      excerpt: "",
      authorId: "",
      categoryId: "",
      featuredImage: "",
      published: false,
    },
  });

  function onSubmit(values: PostFormValues) {
    startTransition(async () => {
      try {
        // Validate editor content
        if (!editorContent || editorContent.trim() === "") {
          toast.error("Content is required");
          return;
        }

        // Include the editor content in the form values
        const postData = {
          ...values,
          content: editorContent,
        };
        await createPost(postData);
        toast.success("Blog post created successfully!");
        router.push("/dashboard/blog");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blogs
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
              <p className="text-muted-foreground">Create and publish a new blog post</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title + Auto Slug */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter blog title"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const slug = e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)/g, "");
                            form.setValue("slug", slug);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="auto-generated-slug" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Excerpt */}
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter excerpt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Category Select */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.length === 0 ? (
                            <SelectItem value="disabled" disabled>
                              No categories available
                            </SelectItem>
                          ) : (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                {/* Featured Image */}
                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured Image</FormLabel>
                      <div className="space-y-4">
                        {field.value && (
                          <div className="relative max-w-md">
                            <img
                              src={field.value}
                              alt="Featured preview"
                              className="w-full h-64 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => field.onChange("")}
                            >
                              Remove
                            </Button>
                          </div>
                        )}

                        <Button
                          type="button"
                          variant={field.value ? "outline" : "default"}
                          onClick={() => setImagePickerOpen(true)}
                          className="w-full"
                        >
                          {field.value ? "Change Image" : "Select Image from Gallery"}
                        </Button>

                        <GalleryImagePicker
                          open={imagePickerOpen}
                          onOpenChange={setImagePickerOpen}
                          onSelect={(imagePath) => {
                            field.onChange(imagePath);
                            toast.success("Image selected successfully!");
                          }}
                          currentImage={field.value}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />




                {/* Content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Content *
                  </label>
                  <RichTextEditor
                    value={editorContent}
                    onChange={setEditorContent}
                    placeholder="Start writing your blog post..."
                  />
                </div>

                {/* Author Select */}
                <FormField
                  control={form.control}
                  name="authorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an author" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                          }}
                          disabled={isPending}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Publish immediately</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Check this to publish the post immediately
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/blog")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Post"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}