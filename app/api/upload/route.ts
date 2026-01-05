import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/app/actions/storage/upload-image';

/**
 * API route for uploading images
 * This can be used by client components that need to upload images
 */
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get folder from form data (optional)
    const folder = (formData.get('folder') as string) || 'blog';

    // Upload image
    const result = await uploadImage(
      buffer,
      file.name,
      file.type,
      folder
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload image' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error: any) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

