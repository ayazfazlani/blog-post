"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTransition } from "react";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { GalleryImagePicker } from "@/components/gallery-image-picker";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { getPageById, updatePage } from "@/app/actions/dashboard/pages/page-actions";

const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featuredImage: z.string().optional(),
  published: z.boolean(),
  order: z.number(),
});

type PageFormValues = z.infer<typeof pageSchema>;

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isPending, startTransition] = useTransition();
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [editorContent, setEditorContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      metaTitle: "",
      metaDescription: "",
      featuredImage: "",
      published: false,
      order: 0,
    },
  });

  useEffect(() => {
    async function loadPage() {
      if (!id) return;
      
      try {
        const page = await getPageById(id);
        if (!page) {
          toast.error("Page not found");
          router.push("/dashboard/pages");
          return;
        }

        form.reset({
          title: page.title,
          slug: page.slug,
          excerpt: page.excerpt || "",
          metaTitle: page.metaTitle || "",
          metaDescription: page.metaDescription || "",
          featuredImage: page.featuredImage || "",
          published: page.published,
          order: page.order,
        });
        setEditorContent(page.content || "");
        setLoading(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load page");
        router.push("/dashboard/pages");
      }
    }

    loadPage();
  }, [id, form, router]);

  function onSubmit(values: PageFormValues) {
    if (!id) return;
    
    startTransition(async () => {
      try {
        await updatePage(id, {
          ...values,
          content: editorContent,
        });
        toast.success("Page updated successfully!");
        router.push("/dashboard/pages");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-10">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/pages">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pages
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Page</h1>
              <p className="text-muted-foreground">Update page content and settings</p>
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
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter page title"
                          {...field}
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
                        <Input placeholder="page-slug" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the page"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Content
                  </label>
                  <RichTextEditor
                    value={editorContent}
                    onChange={setEditorContent}
                    placeholder="Start writing your page content..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input placeholder="SEO title (leave empty to use page title)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="SEO description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

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
                          Check this to publish the page immediately
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
                onClick={() => router.push("/dashboard/pages")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Page"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

