/**
 * Cloudinary storage provider implementation
 */
import { v2 as cloudinary } from 'cloudinary';
import type { IStorageProvider, UploadResult, UploadOptions, DeleteOptions } from '../types';

export class CloudinaryProvider implements IStorageProvider {
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.initialized = true;
  }

  async upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        resource_type: 'auto',
        folder: options?.folder || 'blog',
        overwrite: options?.overwrite ?? true,
      };

      if (options?.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      if (options?.transformation) {
        uploadOptions.transformation = options.transformation;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary upload failed: No result returned'));
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  async uploadFromUrl(url: string, options?: UploadOptions): Promise<UploadResult> {
    try {
      const uploadOptions: any = {
        resource_type: 'auto',
        folder: options?.folder || 'blog',
        overwrite: options?.overwrite ?? true,
      };

      if (options?.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      if (options?.transformation) {
        uploadOptions.transformation = options.transformation;
      }

      const result = await cloudinary.uploader.upload(url, uploadOptions);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error: any) {
      throw new Error(`Cloudinary upload from URL failed: ${error.message}`);
    }
  }

  async delete(identifier: string | DeleteOptions): Promise<boolean> {
    try {
      let publicId: string;

      if (typeof identifier === 'string') {
        // If it's a URL, extract the public_id
        if (this.isUrlFromProvider(identifier)) {
          publicId = this.extractIdentifier(identifier) || identifier;
        } else {
          publicId = identifier;
        }
      } else {
        publicId = identifier.publicId || this.extractIdentifier(identifier.url || '') || '';
      }

      if (!publicId) {
        throw new Error('No public ID provided for deletion');
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });

      return result.result === 'ok';
    } catch (error: any) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  getUrl(identifier: string, options?: { transformation?: Record<string, any> }): string {
    if (this.isUrlFromProvider(identifier)) {
      // If it's already a Cloudinary URL, apply transformations if needed
      if (options?.transformation) {
        // Extract public_id and rebuild URL with transformations
        const publicId = this.extractIdentifier(identifier);
        if (publicId) {
          return cloudinary.url(publicId, {
            secure: true,
            transformation: options.transformation,
          });
        }
      }
      return identifier;
    }

    // If it's a public_id, generate URL
    return cloudinary.url(identifier, {
      secure: true,
      transformation: options?.transformation,
    });
  }

  isUrlFromProvider(url: string): boolean {
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
  }

  extractIdentifier(url: string): string | null {
    if (!this.isUrlFromProvider(url)) {
      return null;
    }

    try {
      // Extract public_id from Cloudinary URL
      // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{public_id}.{format}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match && match[1]) {
        // Remove folder prefix if present
        return match[1];
      }

      // Fallback: try to extract from public_id pattern
      const publicIdMatch = url.match(/\/([^\/]+)\.[^.]+$/);
      return publicIdMatch ? publicIdMatch[1] : null;
    } catch {
      return null;
    }
  }
}

