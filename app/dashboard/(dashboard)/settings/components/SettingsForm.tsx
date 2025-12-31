// components/admin/SettingsForm.tsx
"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget, CldImage } from "next-cloudinary";
import Image from "next/image";
import { updateSiteSettings, getSiteSettings, clearCache, fixImageUrls } from "@/app/actions/dashboard/settings/site-settings-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Home, Search, Settings as SettingsIcon, Trash2, RefreshCw, ImageIcon } from "lucide-react";

// Timezone options
const timezones = [
  { value: "Asia/Karachi", label: "Pakistan (PKT)" },
  { value: "Asia/Dubai", label: "UAE (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];

export default function SettingsForm() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [fixingUrls, setFixingUrls] = useState(false);

  useEffect(() => {
    getSiteSettings().then((data) => {
      // Ensure all fields are defined, even if empty
      setSettings({
        siteName: data.siteName || "My Blog",
        siteDescription: data.siteDescription || "",
        logoUrl: data.logoUrl || null,
        logoPublicId: data.logoPublicId || null,
        faviconUrl: data.faviconUrl || "",
        timezone: data.timezone || "Asia/Karachi",
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        postsSchema: data.postsSchema || "",
        pagesSchema: data.pagesSchema || "",
      });
      setLoading(false);
    });
  }, []);

  const handleUploadSuccess = (result: any) => {
    if (result?.info) {
      const publicId = result.info.public_id;
      const url = result.info.secure_url;

      // Update preview immediately
      setSettings((prev: any) => ({
        ...prev,
        logoUrl: url,
        logoPublicId: publicId,
      }));
      
      toast.success("Logo uploaded successfully!");
    } else {
      toast.error("Upload failed. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append("siteName", settings.siteName || "");
    formData.append("siteDescription", settings.siteDescription || "");
    formData.append("logoUrl", settings.logoUrl || "");
    formData.append("logoPublicId", settings.logoPublicId || "");
    formData.append("faviconUrl", settings.faviconUrl || "");
    formData.append("timezone", settings.timezone || "Asia/Karachi");
    formData.append("metaTitle", settings.metaTitle || "");
    formData.append("metaDescription", settings.metaDescription || "");
    formData.append("postsSchema", settings.postsSchema || "");
    formData.append("pagesSchema", settings.pagesSchema || "");

    try {
      const result = await updateSiteSettings(formData);
      if (result.success) {
        setSettings(result.settings);
        toast.success("Settings saved successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const result = await clearCache();
      if (result.success) {
        toast.success(result.message || "Cache cleared successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to clear cache");
    } finally {
      setClearingCache(false);
    }
  };

  const handleFixImageUrls = async () => {
    setFixingUrls(true);
    try {
      const result = await fixImageUrls();
      if (result.success) {
        toast.success(result.message || "Image URLs fixed successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fix image URLs");
    } finally {
      setFixingUrls(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Site Identity Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Site Identity</CardTitle>
          </div>
          <CardDescription>Configure your site's basic identity and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={settings.siteName || ""}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              placeholder="Car Lelo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription || ""}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              placeholder="Car Lelo"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="faviconUrl">Favicon URL</Label>
            <Input
              id="faviconUrl"
              type="url"
              value={settings.faviconUrl || ""}
              onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-sm text-muted-foreground">
              Enter the full URL to your favicon image
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={settings.timezone || "Asia/Karachi"}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger id="timezone" className="w-full">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-start gap-6">
              {settings.logoUrl ? (
                <div className="relative w-48 h-32 border rounded-lg overflow-hidden bg-muted">
                  {settings.logoPublicId ? (
                    <CldImage
                      src={settings.logoPublicId}
                      alt="Site logo"
                      width={192}
                      height={128}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <Image
                      src={settings.logoUrl}
                      alt="Site logo"
                      fill
                      className="object-contain"
                      sizes="192px"
                    />
                  )}
                </div>
              ) : (
                <div className="w-48 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                  <p className="text-sm text-muted-foreground">No logo</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <CldUploadWidget
                  uploadPreset="blog_featured"
                  onSuccess={handleUploadSuccess}
                  onError={(error: any) => {
                    console.error('Upload error:', error);
                    toast.error("Upload failed. Please try again.");
                  }}
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => open()}
                    >
                      {settings.logoUrl ? "Change Logo" : "Upload Logo"}
                    </Button>
                  )}
                </CldUploadWidget>
                {settings.logoUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSettings((prev: any) => ({
                        ...prev,
                        logoUrl: null,
                        logoPublicId: null,
                      }));
                    }}
                  >
                    Remove Logo
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Recommended: Transparent PNG, at least 400px wide
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Homepage SEO Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            <CardTitle>Homepage SEO</CardTitle>
          </div>
          <CardDescription>Optimize your homepage for search engines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={settings.metaTitle || ""}
              onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
              placeholder="Your custom homepage title (leave empty to use Site Name)"
            />
            <p className="text-sm text-muted-foreground">
              Recommended: 50-60 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={settings.metaDescription || ""}
              onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
              placeholder="A compelling description for search engines..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Recommended: 150-160 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Schema Markup Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <CardTitle>Schema Markup (Advanced)</CardTitle>
          </div>
          <CardDescription>
            Add JSON-LD schema templates. Use placeholders: {"{title}"}, {"{description}"}, {"{url}"}, {"{image}"}, {"{date}"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="postsSchema">Posts Schema (Article)</Label>
            <Textarea
              id="postsSchema"
              value={settings.postsSchema || ""}
              onChange={(e) => setSettings({ ...settings, postsSchema: e.target.value })}
              placeholder='{"@context": "https://schema.org", "@type": "Article"...}'
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pagesSchema">Pages Schema (WebPage)</Label>
            <Textarea
              id="pagesSchema"
              value={settings.pagesSchema || ""}
              onChange={(e) => setSettings({ ...settings, pagesSchema: e.target.value })}
              placeholder='{"@context": "https://schema.org", "@type": "WebPage"...}'
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <CardTitle>Advanced</CardTitle>
          </div>
          <CardDescription>Advanced settings and maintenance tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Clear Cache</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Force refresh all cached pages immediately. Use this after making content changes.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearCache}
                  disabled={clearingCache}
                >
                  {clearingCache ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cache
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Cache Information</Label>
              <p className="text-sm text-muted-foreground">
                This CMS uses Incremental Static Regeneration for optimal performance. Changes to published content will be live within 60 seconds.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Database</Label>
              <p className="text-sm text-muted-foreground">
                MongoDB is used for all data storage. Make sure to backup your database regularly.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Fix Image URLs</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    If images are not loading on your live site, click below to convert all localhost URLs to relative paths.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFixImageUrls}
                  disabled={fixingUrls}
                >
                  {fixingUrls ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Fix Image URLs
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
