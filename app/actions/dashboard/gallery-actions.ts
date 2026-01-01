"use server";

import { connectToDatabase } from "@/lib/mongodb";
import GalleryImage from "@/models/GalleryImage";
import { revalidatePath } from "next/cache";

export interface GalleryImageData {
  id: string;
  filename: string;
  path: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export async function getAllGalleryImages(): Promise<GalleryImageData[]> {
  try {
    await connectToDatabase();
    const images = await GalleryImage.find()
      .sort({ createdAt: -1 })
      .lean();

    return images.map((image) => ({
      id: image._id.toString(),
      filename: image.filename,
      path: image.path,
      originalName: image.originalName,
      size: image.size,
      mimeType: image.mimeType,
      createdAt: new Date(image.createdAt),
    }));
  } catch (error: any) {
    console.error('Error fetching gallery images:', error);
    throw new Error(`Failed to fetch gallery images: ${error?.message || 'Unknown error'}`);
  }
}