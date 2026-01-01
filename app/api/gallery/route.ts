import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';

export async function GET() {
  try {
    await connectToDatabase();
    
    const images = await GalleryImage.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      images: images.map((image) => ({
        id: image._id.toString(),
        filename: image.filename,
        path: image.path,
        originalName: image.originalName,
        size: image.size,
        mimeType: image.mimeType,
        createdAt: image.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
