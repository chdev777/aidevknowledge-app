import { minioProvider } from './minio-provider.js';
import { firebaseProvider } from './firebase-provider.js';
import type { StorageProvider } from './provider.js';

const providerName = import.meta.env.VITE_STORAGE_PROVIDER ?? 'minio';

export const storage: StorageProvider =
  providerName === 'firebase' ? firebaseProvider : minioProvider;

export type { StorageProvider, UploadOpts, UploadCredentials, StorageKind } from './provider.js';
