import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject as fbDeleteObject,
} from 'firebase/storage';
import { app, auth } from '../firebase/client.js';
import type { StorageProvider, UploadCredentials, UploadOpts } from './provider.js';

const storage = getStorage(app);

function buildKey(opts: UploadOpts): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('not signed in');

  const ext = opts.ext.replace(/^\./, '');
  const id = opts.targetId;

  switch (opts.kind) {
    case 'avatar':
      return `users/${uid}/avatar/avatar.${ext}`;
    case 'link-thumb':
      if (!id) throw new Error('targetId is required');
      return `links/${id}/thumb/thumb.${ext}`;
    case 'note-attachment':
      if (!id) throw new Error('targetId is required');
      return `notes/${id}/attachments/${Date.now()}.${ext}`;
    case 'app-thumb':
      if (!id) throw new Error('targetId is required');
      return `apps/${id}/thumb/thumb.${ext}`;
  }
}

async function prepareUpload(opts: UploadOpts): Promise<UploadCredentials> {
  const key = buildKey(opts);
  // Firebase Storage では署名URL方式ではなく直接 SDK で put するため、key だけ返す
  return {
    key,
    url: '',
    method: 'PUT',
    headers: { 'content-type': opts.contentType },
  };
}

async function upload(file: File, opts: UploadOpts): Promise<string> {
  const key = buildKey(opts);
  const storageRef = ref(storage, key);
  const task = uploadBytesResumable(storageRef, file, { contentType: opts.contentType });

  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => opts.onProgress?.(snap.bytesTransferred, snap.totalBytes),
      reject,
      () => resolve(),
    );
  });

  return key;
}

async function getDownloadUrl(key: string): Promise<string> {
  return getDownloadURL(ref(storage, key));
}

async function deleteObject(key: string): Promise<void> {
  await fbDeleteObject(ref(storage, key));
}

export const firebaseProvider: StorageProvider = {
  prepareUpload,
  upload,
  getDownloadUrl,
  delete: deleteObject,
};
