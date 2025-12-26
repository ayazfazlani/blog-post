// components/admin/SettingsForm.tsx
"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget, CldImage } from "next-cloudinary";
import Image from "next/image";
import { updateSiteSettings, getSiteSettings } from "@/app/actions/dashboard/settings/site-settings-actions";
import { toast } from "sonner";



export default function SettingsForm() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettings().then((data) => {
      setSettings(data);
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
    if (settings.logoPublicId) {
      formData.append("logoPublicId", settings.logoPublicId);
    }
    if (settings.logoUrl) {
      formData.append("logoUrl", settings.logoUrl);
    }

    try {
      const result = await updateSiteSettings(formData);
      if (result.success) {
        setSettings(result.settings);
        toast.success("Settings saved!");
      }
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div>
        <label htmlFor="siteName" className="block font-medium mb-2">Site Name</label>
        <input
          type="text"
          id="siteName"
          value={settings.siteName || ""}
          onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label htmlFor="siteDescription" className="block font-medium mb-2">Site Description</label>
        <textarea
          id="siteDescription"
          value={settings.siteDescription || ""}
          onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label htmlFor="logo" className="block font-medium mb-2">Logo</label>
        <div className="flex items-start gap-6">
          {settings.logoUrl ? (
            <div className="relative w-48 h-32 border rounded-lg overflow-hidden bg-gray-50">
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
            <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <p className="text-sm text-gray-400">No logo</p>
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
                <button
                  type="button"
                  onClick={() => open()}
                  className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {settings.logoUrl ? "Change Logo" : "Upload Logo"}
                </button>
              )}
            </CldUploadWidget>
            {settings.logoUrl && (
              <button
                type="button"
                onClick={() => {
                  setSettings((prev: any) => ({
                    ...prev,
                    logoUrl: null,
                    logoPublicId: null,
                  }));
                }}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Remove Logo
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Recommended: Transparent PNG, at least 400px wide
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}