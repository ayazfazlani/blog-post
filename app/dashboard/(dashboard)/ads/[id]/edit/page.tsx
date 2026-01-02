"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAd, getAdById } from "@/app/actions/dashboard/ads/ad-actions";
import { adSchema, type AdFormValues } from "@/lib/validation";
import { getCategories } from "@/app/actions/dashboard/category/category-actions";

export default function EditAdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCategories().then(setCategories),
      getAdById(id).then((ad) => {
        if (ad) {
          form.reset({
            name: ad.name,
            type: ad.type as any,
            placement: ad.placement as any,
            position: ad.position as any,
            adCode: ad.adCode,
            imageUrl: ad.imageUrl || "",
            linkUrl: ad.linkUrl || "",
            altText: ad.altText || "",
            domains: ad.domains || [],
            pages: ad.pages as any || ["all"],
            categories: ad.categories || [],
            isActive: ad.isActive,
            priority: ad.priority || 0,
            width: ad.width || "",
            height: ad.height || "",
            startDate: ad.startDate || "",
            endDate: ad.endDate || "",
          });
        }
        setLoading(false);
      }),
    ]).catch((error) => {
      console.error("Error loading data:", error);
      toast.error("Failed to load ad data");
      setLoading(false);
    });
  }, [id]);

  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      name: "",
      type: "banner",
      placement: "auto",
      position: undefined,
      adCode: "",
      imageUrl: "",
      linkUrl: "",
      altText: "",
      domains: [],
      pages: ["all"],
      categories: [],
      isActive: true,
      priority: 0,
      width: "",
      height: "",
    },
  });

  const placement = form.watch("placement");
  const type = form.watch("type");

  function onSubmit(values: AdFormValues) {
    startTransition(async () => {
      try {
        await updateAd(id, values);
        toast.success("Ad updated successfully!");
        router.push("/dashboard/ads");
      } catch (error: any) {
        toast.error(error.message || "Failed to update ad");
      }
    });
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/ads">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Ad</h1>
          <p className="text-muted-foreground">Update your advertisement settings</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Homepage Banner" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="banner">Banner</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                          <SelectItem value="inline">Inline</SelectItem>
                          <SelectItem value="popup">Popup</SelectItem>
                          <SelectItem value="sticky">Sticky</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="placement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placement *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select placement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {placement === "auto" && (
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="header">Header</SelectItem>
                          <SelectItem value="footer">Footer</SelectItem>
                          <SelectItem value="sidebar-top">Sidebar Top</SelectItem>
                          <SelectItem value="sidebar-bottom">Sidebar Bottom</SelectItem>
                          <SelectItem value="content-top">Content Top</SelectItem>
                          <SelectItem value="content-middle">Content Middle</SelectItem>
                          <SelectItem value="content-bottom">Content Bottom</SelectItem>
                          <SelectItem value="between-posts">Between Posts</SelectItem>
                          <SelectItem value="after-post">After Post</SelectItem>
                          <SelectItem value="before-post">Before Post</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 728px, 100%" {...field} />
                      </FormControl>
                      <FormDescription>Leave empty for auto</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 90px, auto" {...field} />
                      </FormControl>
                      <FormDescription>Leave empty for auto</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ad Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {type === "banner" && (
                <>
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/ad.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="altText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alt Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Ad description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="adCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Code (HTML/JavaScript) *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your ad code here (HTML, JavaScript, etc.)"
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      For image ads, leave this empty if you provided image URL above
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Targeting & Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Show on Pages</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {["all", "home", "blog", "category", "post", "page"].map((page) => (
                          <div key={page} className="flex items-center space-x-2">
                            <Checkbox
                              id={`page-${page}`}
                              checked={field.value?.includes(page as any)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, page as any]);
                                } else {
                                  field.onChange(current.filter((p) => p !== page));
                                }
                              }}
                            />
                            <Label htmlFor={`page-${page}`} className="font-normal capitalize">
                              {page}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Categories (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${category.id}`}
                              checked={field.value?.includes(category.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, category.id]);
                                } else {
                                  field.onChange(current.filter((id) => id !== category.id));
                                }
                              }}
                            />
                            <Label htmlFor={`cat-${category.id}`} className="font-normal">
                              {category.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription>Leave empty to show on all categories</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domains"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domains (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter domains separated by commas (leave empty for all domains)"
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const domains = e.target.value
                            .split(",")
                            .map((d) => d.trim())
                            .filter((d) => d);
                          field.onChange(domains);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty to show on all domains. Enter specific domains like: example.com, another.com
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            field.onChange(e.target.value ? new Date(e.target.value).toISOString() : "");
                          }}
                        />
                      </FormControl>
                      <FormDescription>Leave empty for immediate start</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            field.onChange(e.target.value ? new Date(e.target.value).toISOString() : "");
                          }}
                        />
                      </FormControl>
                      <FormDescription>Leave empty for no end date</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Higher priority ads are shown first (default: 0)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Enable this ad immediately</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Ad"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/ads">Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

