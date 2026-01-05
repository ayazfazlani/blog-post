import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import { revalidatePath } from 'next/cache';
import { getStorageProvider } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Get storage provider
    const storage = getStorageProvider();

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;

    // Upload to storage
    const uploadResult = await storage.upload(
      buffer,
      filename,
      file.type,
      {
        folder: 'gallery',
      }
    );

    // Save image metadata to database
    await connectToDatabase();
    const image = await GalleryImage.create({
      filename: uploadResult.publicId || filename,
      originalName: file.name,
      path: uploadResult.url,
      size: uploadResult.bytes || file.size,
      mimeType: file.type,
    });

    revalidatePath('/dashboard/gallery');

    return NextResponse.json({
      success: true,
      image: {
        id: image._id.toString(),
        filename: image.filename,
        path: image.path,
        originalName: image.originalName,
        size: image.size,
        mimeType: image.mimeType,
        createdAt: image.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
