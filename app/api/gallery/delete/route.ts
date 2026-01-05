import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import { revalidatePath } from 'next/cache';
import { getStorageProvider } from '@/lib/storage';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the image in database
    const image = await GalleryImage.findById(id);
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Get storage provider and delete file
    const storage = getStorageProvider();
    try {
      await storage.delete(image.path);
    } catch (deleteError) {
      console.error('Error deleting file from storage:', deleteError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await GalleryImage.findByIdAndDelete(id);

    revalidatePath('/dashboard/gallery');

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}
