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
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, Home, Search, Settings as SettingsIcon, Trash2, RefreshCw, ImageIcon, Code, MessageSquare, Eye, ExternalLink } from "lucide-react";

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
  const [viewingPreview, setViewingPreview] = useState(false);

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
        siteTitle: data.siteTitle || "",
        seoDescription: data.seoDescription || "",
        keywords: data.keywords || "",
        robotsIndex: data.robotsIndex !== undefined ? data.robotsIndex : true,
        robotsFollow: data.robotsFollow !== undefined ? data.robotsFollow : true,
        contentType: data.contentType || "UTF-8",
        language: data.language || "English",
        revisitDays: data.revisitDays || 1,
        author: data.author || "",
        customHeadScripts: data.customHeadScripts || "",
        firebaseMessagingSW: data.firebaseMessagingSW || "",
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

    // Debug: Check what's in settings.firebaseMessagingSW before submission
    console.log('Before submit - firebaseMessagingSW value:', settings.firebaseMessagingSW);
    console.log('Before submit - firebaseMessagingSW type:', typeof settings.firebaseMessagingSW);
    console.log('Before submit - firebaseMessagingSW length:', settings.firebaseMessagingSW?.length || 0);

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
    formData.append("siteTitle", settings.siteTitle || "");
    formData.append("seoDescription", settings.seoDescription || "");
    formData.append("keywords", settings.keywords || "");
    formData.append("robotsIndex", settings.robotsIndex ? "true" : "false");
    formData.append("robotsFollow", settings.robotsFollow ? "true" : "false");
    formData.append("contentType", settings.contentType || "UTF-8");
    formData.append("language", settings.language || "English");
    formData.append("revisitDays", (settings.revisitDays || 1).toString());
    formData.append("author", settings.author || "");
    formData.append("customHeadScripts", settings.customHeadScripts || "");
    
    // Get the value directly from the textarea element as a fallback
    const textareaElement = document.getElementById("firebaseMessagingSW") as HTMLTextAreaElement;
    const firebaseSWValue = textareaElement?.value || settings.firebaseMessagingSW || "";
    console.log('Textarea element value length:', textareaElement?.value?.length || 0);
    console.log('Final firebaseMessagingSW value to send:', firebaseSWValue.substring(0, 100));
    
    formData.append("firebaseMessagingSW", firebaseSWValue);

    try {
      const result = await updateSiteSettings(formData);
      if (result.success) {
        // Update state with the returned settings from server
        const updatedSettings = {
          siteName: result.settings.siteName || "My Blog",
          siteDescription: result.settings.siteDescription || "",
          logoUrl: result.settings.logoUrl || null,
          logoPublicId: result.settings.logoPublicId || null,
          faviconUrl: result.settings.faviconUrl || "",
          timezone: result.settings.timezone || "Asia/Karachi",
          metaTitle: result.settings.metaTitle || "",
          metaDescription: result.settings.metaDescription || "",
          postsSchema: result.settings.postsSchema || "",
          pagesSchema: result.settings.pagesSchema || "",
          siteTitle: result.settings.siteTitle || "",
          seoDescription: result.settings.seoDescription || "",
          keywords: result.settings.keywords || "",
          robotsIndex: result.settings.robotsIndex !== undefined ? result.settings.robotsIndex : true,
          robotsFollow: result.settings.robotsFollow !== undefined ? result.settings.robotsFollow : true,
          contentType: result.settings.contentType || "UTF-8",
          language: result.settings.language || "English",
          revisitDays: result.settings.revisitDays || 1,
          author: result.settings.author || "",
          customHeadScripts: result.settings.customHeadScripts || "",
          firebaseMessagingSW: result.settings.firebaseMessagingSW || "",
        };
        
        // Debug: Log the saved Firebase service worker content
        console.log('Saved Firebase SW content length:', result.settings.firebaseMessagingSW?.length || 0);
        console.log('Saved Firebase SW content preview:', result.settings.firebaseMessagingSW?.substring(0, 100) || 'empty');
        
        setSettings(updatedSettings);
        toast.success("Settings saved successfully! Firebase service worker updated.");
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
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

      {/* SEO Settings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <CardTitle>SEO Settings</CardTitle>
          </div>
          <CardDescription>Configure search engine optimization settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteTitle">
              Site Title <span className="text-muted-foreground">(Max 70 characters)</span>
            </Label>
            <Input
              id="siteTitle"
              value={settings.siteTitle || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 70) {
                  setSettings({ ...settings, siteTitle: value });
                }
              }}
              placeholder="Example Site Title"
              maxLength={70}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>This title will be used in meta tags</span>
              <span>{(settings.siteTitle || "").length}/70</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDescription">Site Description</Label>
            <Textarea
              id="seoDescription"
              value={settings.seoDescription || ""}
              onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
              placeholder="This is example description"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              A brief description of your website for search engines
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Site Keywords (Separate with commas)</Label>
            <Input
              id="keywords"
              value={settings.keywords || ""}
              onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="text-sm text-muted-foreground">
              Enter keywords separated by commas (e.g., "1, 2, 3")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={settings.author || ""}
              onChange={(e) => setSettings({ ...settings, author: e.target.value })}
              placeholder="khubaib"
            />
            <p className="text-sm text-muted-foreground">
              The primary author of the website
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="robotsIndex"
                checked={settings.robotsIndex !== undefined ? settings.robotsIndex : true}
                onCheckedChange={(checked) => setSettings({ ...settings, robotsIndex: checked as boolean })}
              />
              <Label htmlFor="robotsIndex" className="cursor-pointer font-normal">
                Allow robots to index your website?
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="robotsFollow"
                checked={settings.robotsFollow !== undefined ? settings.robotsFollow : true}
                onCheckedChange={(checked) => setSettings({ ...settings, robotsFollow: checked as boolean })}
              />
              <Label htmlFor="robotsFollow" className="cursor-pointer font-normal">
                Allow robots to follow all links?
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentType">What type of content will your site display?</Label>
            <Input
              id="contentType"
              value={settings.contentType || "UTF-8"}
              onChange={(e) => setSettings({ ...settings, contentType: e.target.value })}
              placeholder="UTF-8"
            />
            <p className="text-sm text-muted-foreground">
              Character encoding (default: UTF-8)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">What is your site primary language?</Label>
            <Input
              id="language"
              value={settings.language || "English"}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              placeholder="English"
            />
            <p className="text-sm text-muted-foreground">
              Primary language of your website content
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revisitDays">
              Search engines should revisit this page after (days)
            </Label>
            <Input
              id="revisitDays"
              type="number"
              min="1"
              value={settings.revisitDays || 1}
              onChange={(e) => setSettings({ ...settings, revisitDays: parseInt(e.target.value) || 1 })}
              placeholder="1"
            />
            <p className="text-sm text-muted-foreground">
              How often search engines should crawl your site (in days)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Head Scripts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle>Custom Head Scripts</CardTitle>
          </div>
          <CardDescription>Add custom scripts to the &lt;head&gt; section (e.g., Google Analytics, verification tags)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customHeadScripts">Custom Scripts</Label>
            <Textarea
              id="customHeadScripts"
              value={settings.customHeadScripts || ""}
              onChange={(e) => setSettings({ ...settings, customHeadScripts: e.target.value })}
              placeholder='<meta name="google-site-verification" content="..." />'
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Add any custom HTML/scripts that should appear in the &lt;head&gt; section. Include full HTML tags.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Firebase Service Worker Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Firebase Messaging Service Worker</CardTitle>
          </div>
          <CardDescription>Configure Firebase Cloud Messaging service worker (firebase-messaging-sw.js)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-1">
              <Label htmlFor="firebaseMessagingSW">Service Worker Content</Label>
              <p className="text-xs text-muted-foreground">
                {settings.firebaseMessagingSW 
                  ? `Currently saved: ${settings.firebaseMessagingSW.length} characters`
                  : "No content saved yet (using default)"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingPreview(!viewingPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {viewingPreview ? "Hide Preview" : "Show Preview"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open('/firebase-messaging-sw.js', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live
              </Button>
            </div>
          </div>

          {viewingPreview && (
            <div className="space-y-2 p-4 bg-muted rounded-lg border">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Current Saved Content Preview</Label>
                <span className="text-xs text-muted-foreground">
                  {settings.firebaseMessagingSW?.length || 0} characters
                </span>
              </div>
              <pre className="text-xs font-mono bg-background p-3 rounded border overflow-auto max-h-64">
                <code>{settings.firebaseMessagingSW || "// No content saved - default will be used"}</code>
              </pre>
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              id="firebaseMessagingSW"
              value={settings.firebaseMessagingSW ?? ""}
              onChange={(e) => {
                setSettings({ ...settings, firebaseMessagingSW: e.target.value });
              }}
              placeholder={`// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon-192x192.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});`}
              rows={20}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                This content will be served at <code className="px-1 py-0.5 bg-muted rounded">/firebase-messaging-sw.js</code>. 
                Make sure to include your Firebase configuration.
              </p>
              <span className="text-xs text-muted-foreground">
                {(settings.firebaseMessagingSW || "").length} characters
              </span>
            </div>
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
