/**
 * Local file system storage provider implementation
 * Stores files in the public/uploads directory
 */
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { IStorageProvider, UploadResult, UploadOptions, DeleteOptions } from '../types';

export class LocalStorageProvider implements IStorageProvider {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  }

  async upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Create uploads directory if it doesn't exist
      if (!existsSync(this.uploadsDir)) {
        await mkdir(this.uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const finalFilename = options?.folder
        ? `${options.folder}/${timestamp}-${sanitizedFilename}`
        : `${timestamp}-${sanitizedFilename}`;

      const filepath = path.join(this.uploadsDir, finalFilename);

      // Ensure folder exists
      const folderPath = path.dirname(filepath);
      if (!existsSync(folderPath)) {
        await mkdir(folderPath, { recursive: true });
      }

      // Save file
      await writeFile(filepath, buffer);

      // Return URL path
      const url = `/uploads/${finalFilename}`;

      return {
        url,
        publicId: finalFilename,
        bytes: buffer.length,
      };
    } catch (error: any) {
      throw new Error(`Local storage upload failed: ${error.message}`);
    }
  }

  async delete(identifier: string | DeleteOptions): Promise<boolean> {
    try {
      let filepath: string;

      if (typeof identifier === 'string') {
        if (this.isUrlFromProvider(identifier)) {
          // Extract path from URL
          const pathFromUrl = identifier.replace(/^\/uploads\//, '');
          filepath = path.join(this.uploadsDir, pathFromUrl);
        } else {
          // Assume it's a filename
          filepath = path.join(this.uploadsDir, identifier);
        }
      } else {
        const url = identifier.url || '';
        if (url) {
          const pathFromUrl = url.replace(/^\/uploads\//, '');
          filepath = path.join(this.uploadsDir, pathFromUrl);
        } else {
          filepath = path.join(this.uploadsDir, identifier.publicId || '');
        }
      }

      if (existsSync(filepath)) {
        await unlink(filepath);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Local storage delete error:', error);
      return false;
    }
  }

  getUrl(identifier: string, options?: { transformation?: Record<string, any> }): string {
    if (this.isUrlFromProvider(identifier)) {
      return identifier;
    }

    // If it's a filename, return the URL path
    return `/uploads/${identifier}`;
  }

  isUrlFromProvider(url: string): boolean {
    return url.startsWith('/uploads/') || url.includes('/uploads/');
  }

  extractIdentifier(url: string): string | null {
    if (!this.isUrlFromProvider(url)) {
      return null;
    }

    // Extract filename from URL
    const match = url.match(/\/uploads\/(.+)$/);
    return match ? match[1] : null;
  }
}

