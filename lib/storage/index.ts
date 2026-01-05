/**
 * Storage factory and main export
 * This module provides a unified interface for storage operations
 */

import type { IStorageProvider, StorageProviderType } from './types';
import { CloudinaryProvider } from './providers/cloudinary';
import { S3Provider } from './providers/s3';
import { LocalStorageProvider } from './providers/local';

let storageInstance: IStorageProvider | null = null;

/**
 * Get the configured storage provider instance
 */
export function getStorageProvider(): IStorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const providerType = (process.env.STORAGE_PROVIDER || 'local') as StorageProviderType;

  switch (providerType) {
    case 'cloudinary':
      storageInstance = new CloudinaryProvider();
      break;
    case 's3':
      storageInstance = new S3Provider();
      break;
    case 'local':
      storageInstance = new LocalStorageProvider();
      break;
    default:
      console.warn(`Unknown storage provider: ${providerType}. Falling back to Local storage.`);
      storageInstance = new LocalStorageProvider();
  }

  return storageInstance;
}

/**
 * Reset the storage instance (useful for testing)
 */
export function resetStorageInstance() {
  storageInstance = null;
}

// Re-export types and providers
export type { IStorageProvider, UploadResult, UploadOptions, DeleteOptions, StorageProviderType } from './types';
export { CloudinaryProvider } from './providers/cloudinary';
export { S3Provider } from './providers/s3';
export { LocalStorageProvider } from './providers/local';

