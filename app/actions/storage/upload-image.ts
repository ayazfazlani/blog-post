"use server";

import { getStorageProvider } from "@/lib/storage";

export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Server action to upload an image
 * This can be used by client components or API routes
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder?: string
): Promise<UploadImageResult> {
  try {
    // Validate file type
    if (!mimeType.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image',
      };
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      return {
        success: false,
        error: 'File size must be less than 10MB',
      };
    }

    const storage = getStorageProvider();
    const result = await storage.upload(buffer, filename, mimeType, {
      folder: folder || 'blog',
    });

    return {
      success: true,
      url: result.url,
    };
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
}

/**
 * Server action to delete an image
 */
export async function deleteImage(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const storage = getStorageProvider();
    const deleted = await storage.delete(url);

    if (!deleted) {
      return {
        success: false,
        error: 'Failed to delete image',
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete image',
    };
  }
}

