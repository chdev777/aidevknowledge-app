import { auth } from '../firebase/client.js';
import type { StorageProvider, UploadCredentials, UploadOpts } from './provider.js';

const proxyUrl = import.meta.env.VITE_OG_PROXY_URL ?? 'http://localhost:8787';

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) throw new Error('not signed in');
  const token = await user.getIdToken();
  return fetch(`${proxyUrl}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
}

async function prepareUpload(opts: UploadOpts): Promise<UploadCredentials> {
  const res = await authedFetch('/api/storage/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      kind: opts.kind,
      ext: opts.ext,
      contentType: opts.contentType,
      targetId: opts.targetId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'sign failed' }));
    throw new Error(err.error ?? 'sign failed');
  }
  return res.json();
}

async function upload(file: File, opts: UploadOpts): Promise<string> {
  const cred = await prepareUpload(opts);

  // 進捗UIのため XMLHttpRequest を使う（fetch は ReadableStream 対応がブラウザ依存）
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(cred.method, cred.url);
    Object.entries(cred.headers ?? {}).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    if (opts.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) opts.onProgress?.(e.loaded, e.total);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('upload network error'));
    xhr.send(file);
  });

  return cred.key;
}

async function getDownloadUrl(key: string): Promise<string> {
  const res = await authedFetch(`/api/storage/download-url?key=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error('download url failed');
  const { url } = (await res.json()) as { url: string };
  return url;
}

async function deleteObject(_key: string): Promise<void> {
  // PoC では削除APIを og-proxy に未実装（必要になったら追加）
  // 上書きアップロードでカバー
}

export const minioProvider: StorageProvider = {
  prepareUpload,
  upload,
  getDownloadUrl,
  delete: deleteObject,
};
