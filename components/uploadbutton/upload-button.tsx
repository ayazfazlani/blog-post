"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface UploadButtonProps {
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: Error) => void;
  folder?: string;
}

export function UploadButton({ onUploadSuccess, onUploadError, folder = "blog" }: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type/size
    if (!file.type.startsWith("image/")) {
      onUploadError(new Error("Please select an image file"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      onUploadError(new Error("Image must be smaller than 10MB"));
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    if (folder) {
      formData.append("folder", folder);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Upload failed with status ${res.status}`);
      }

      if (!data.url) {
        throw new Error("Upload succeeded but no image URL was returned.");
      }

      onUploadSuccess(data.url);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        onUploadError(new Error("Network error. Please check your internet connection and try again."));
      } else {
        onUploadError(err instanceof Error ? err : new Error("Upload failed. Please try again."));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
        />
        {uploading && <p className="mt-2 text-sm">Uploading...</p>}
      </label>
    </div>
  );
}