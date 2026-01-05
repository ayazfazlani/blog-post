# Storage Provider Guide

This application uses a flexible storage abstraction layer that allows you to switch between different storage providers (Cloudinary, AWS S3, or local file storage) without changing your application code.

## Current Configuration

By default, the application uses **Local Storage** for image storage (files are stored in `public/uploads/`). You can switch providers by setting the `STORAGE_PROVIDER` environment variable.

## Supported Providers

### 1. Local Storage (Default)

**Configuration:**
```env
STORAGE_PROVIDER=local
```

**Features:**
- No external services required
- Files stored in `public/uploads/` directory
- Works out of the box with zero configuration
- Images accessible via `/uploads/...` URLs
- Supports nested folders (e.g., `blog/content`)

**Setup:**
No setup required! Files are automatically stored in the `public/uploads/` directory. The directory is created automatically if it doesn't exist.

**Important Notes:**
- Files are stored directly on your server
- For production, ensure your server has enough disk space
- Consider using a CDN or external storage for high-traffic sites
- The `public/uploads/` directory should be included in your git repository (or use `.gitignore` if you prefer)

### 2. Cloudinary

**Configuration:**
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=blog_featured
```

**Features:**
- Automatic image optimization
- Transformations and resizing
- CDN delivery
- Free tier available

**Setup:**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from the dashboard
3. Create an unsigned upload preset
4. Add the environment variables above

### 3. AWS S3 (Future)

**Configuration:**
```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

**Status:** Stub implementation ready for future development


## How It Works

The storage abstraction is located in `lib/storage/`:

- **`types.ts`**: Defines the `IStorageProvider` interface
- **`providers/cloudinary.ts`**: Cloudinary implementation
- **`providers/s3.ts`**: S3 implementation (stub)
- **`providers/local.ts`**: Local storage implementation
- **`index.ts`**: Factory function to get the configured provider

## Usage

### In Server Actions

```typescript
import { getStorageProvider } from '@/lib/storage';

const storage = getStorageProvider();

// Upload an image
const result = await storage.upload(
  buffer,
  filename,
  'image/jpeg',
  { folder: 'blog' }
);

// Delete an image
await storage.delete(imageUrl);

// Get URL with transformations
const url = storage.getUrl(publicId, {
  transformation: { width: 800, height: 600 }
});
```

### In API Routes

```typescript
import { getStorageProvider } from '@/lib/storage';

export async function POST(request: Request) {
  const storage = getStorageProvider();
  const result = await storage.upload(buffer, filename, mimeType);
  return Response.json({ url: result.url });
}
```

### In Client Components

Use the `/api/upload` endpoint:

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('folder', 'blog');

const res = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await res.json();
const imageUrl = data.url;
```

## Switching Providers

To switch from Local Storage to another provider:

1. **Set the environment variable:**
   ```env
   STORAGE_PROVIDER=cloudinary  # or 's3'
   ```

2. **Configure provider-specific credentials** (see above)

3. **Restart your application**

The application will automatically use the new provider for all uploads and deletions.

## Image URLs

- **Local**: URLs are in the format `/uploads/...` (e.g., `/uploads/blog/1234567890-image.jpg`)
- **Cloudinary**: URLs are in the format `https://res.cloudinary.com/...`
- **S3**: URLs will be in the format `https://your-bucket.s3.region.amazonaws.com/...`

The storage provider automatically handles URL extraction and deletion based on the provider type.

## Migration

When switching providers, existing image URLs in your database will continue to work. However, to fully migrate:

1. Export all image URLs from your database
2. Download images from the old provider
3. Upload to the new provider using the storage abstraction
4. Update URLs in your database

## Adding a New Provider

To add a new storage provider:

1. Create a new file in `lib/storage/providers/`
2. Implement the `IStorageProvider` interface
3. Add the provider type to `StorageProviderType` in `types.ts`
4. Add a case in the factory function in `index.ts`

Example:

```typescript
// lib/storage/providers/myprovider.ts
import type { IStorageProvider, UploadResult, UploadOptions } from '../types';

export class MyProvider implements IStorageProvider {
  async upload(buffer: Buffer, filename: string, mimeType: string, options?: UploadOptions): Promise<UploadResult> {
    // Implementation
  }
  
  // ... implement other methods
}
```

## Best Practices

1. **Always use the storage abstraction** - Don't call Cloudinary/S3 directly
2. **Handle errors gracefully** - Storage operations can fail
3. **Use folders for organization** - Organize images by type (blog, gallery, etc.)
4. **Validate file types and sizes** - Do this before calling storage methods
5. **Clean up unused images** - Delete images when content is deleted

## Troubleshooting

### Local Storage Upload Fails

- Check that the `public/uploads/` directory exists and is writable
- Verify file permissions on the uploads directory
- Check server disk space
- Ensure the directory structure can be created (for nested folders)

### Images Not Displaying

- For local storage, verify files are in the `public/uploads/` directory
- Check that URLs are being generated correctly (should start with `/uploads/`)
- Verify the storage provider is correctly configured
- In production, ensure static files are being served correctly

### Cloudinary Upload Fails

- Check that all environment variables are set correctly
- Verify your upload preset exists and is unsigned
- Check Cloudinary dashboard for error logs

### Switching Providers Doesn't Work

- Clear any cached storage instances
- Restart your development server
- Check that the provider type is correctly set in environment variables

