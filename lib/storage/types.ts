/**
 * Storage abstraction types
 * This allows switching between different storage providers (Cloudinary, S3, Local, etc.)
 */

export interface UploadResult {
  url: string;
  publicId?: string; // For Cloudinary, S3 key, etc.
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface UploadOptions {
  folder?: string;
  transformation?: Record<string, any>;
  publicId?: string;
  overwrite?: boolean;
}

export interface DeleteOptions {
  publicId?: string;
  url?: string;
}

/**
 * Storage provider interface
 * All storage providers must implement this interface
 */
export interface IStorageProvider {
  /**
   * Upload a file buffer to storage
   */
  upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Upload a file from a URL (for importing external images)
   */
  uploadFromUrl?(url: string, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Delete a file from storage
   */
  delete(identifier: string | DeleteOptions): Promise<boolean>;

  /**
   * Get the public URL for a stored file
   */
  getUrl(identifier: string, options?: { transformation?: Record<string, any> }): string;

  /**
   * Check if a URL belongs to this storage provider
   */
  isUrlFromProvider(url: string): boolean;

  /**
   * Extract identifier from a URL (e.g., public_id from Cloudinary URL)
   */
  extractIdentifier(url: string): string | null;
}

export type StorageProviderType = 'cloudinary' | 's3' | 'local';

