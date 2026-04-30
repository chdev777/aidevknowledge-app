/**
 * Firebase Storage V4 署名 URL 発行（Workers 版）
 *
 * @google-cloud/storage は Workers で動かないため、Web Crypto API で
 * GCS V4 署名（RSA-SHA256）を直接実装する。
 *
 * フロー:
 *  1. サービスアカウントの private_key (PEM) を CryptoKey にインポート
 *  2. canonical request → string-to-sign を構築
 *  3. RSA-SHA256 で署名
 *  4. クエリ文字列に X-Goog-Signature を付与した URL を返す
 *
 * 参考: https://cloud.google.com/storage/docs/access-control/signed-urls-v4
 *
 * NOTE: 初回実装。本番投入前に以下のテストが必要:
 *  - 既存 MinIO/Firebase 連携の SPA から実 PUT/GET が通ること
 *  - Web Crypto の RSA-SHA256 サインが GCS の期待値と一致すること
 *  - 署名 URL の有効期限と CORS が適切に動作すること
 */

export interface SignUrlOptions {
  bucket: string;
  objectKey: string;
  method: 'PUT' | 'GET';
  contentType?: string;
  expiresInSeconds?: number;
  serviceAccountEmail: string;
  privateKeyPem: string;
}

const HOST = 'storage.googleapis.com';

export async function generateSignedUrl(opts: SignUrlOptions): Promise<string> {
  const expiresIn = opts.expiresInSeconds ?? 5 * 60;
  const now = new Date();
  const datestamp = formatDate(now); // YYYYMMDD
  const timestamp = formatDateTime(now); // YYYYMMDDTHHMMSSZ
  const credentialScope = `${datestamp}/auto/storage/goog4_request`;
  const credential = `${opts.serviceAccountEmail}/${credentialScope}`;

  const headers: Record<string, string> = {
    host: HOST,
  };
  if (opts.contentType && opts.method === 'PUT') {
    headers['content-type'] = opts.contentType;
  }
  const sortedHeaderKeys = Object.keys(headers).sort();
  const signedHeaders = sortedHeaderKeys.join(';');
  const canonicalHeaders =
    sortedHeaderKeys.map((k) => `${k}:${headers[k]}\n`).join('') ;

  const queryParams: Record<string, string> = {
    'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
    'X-Goog-Credential': credential,
    'X-Goog-Date': timestamp,
    'X-Goog-Expires': String(expiresIn),
    'X-Goog-SignedHeaders': signedHeaders,
  };
  const canonicalQuery = Object.keys(queryParams)
    .sort()
    .map(
      (k) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k] ?? '')}`,
    )
    .join('&');

  const canonicalRequest = [
    opts.method,
    `/${opts.bucket}/${encodeURI(opts.objectKey)}`,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const canonicalRequestHash = await sha256Hex(canonicalRequest);

  const stringToSign = [
    'GOOG4-RSA-SHA256',
    timestamp,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  const signatureHex = await rsaSha256Sign(stringToSign, opts.privateKeyPem);

  return (
    `https://${HOST}/${opts.bucket}/${encodeURI(opts.objectKey)}` +
    `?${canonicalQuery}&X-Goog-Signature=${signatureHex}`
  );
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function formatDateTime(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return bufferToHex(buf);
}

async function rsaSha256Sign(
  input: string,
  privateKeyPem: string,
): Promise<string> {
  const key = await importRsaPrivateKey(privateKeyPem);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(input),
  );
  return bufferToHex(sig);
}

async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
  // PEM の改行が \n 文字列で渡されているケースを正規化
  const normalized = pem.replace(/\\n/g, '\n');
  const base64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const der = base64ToArrayBuffer(base64);
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) {
    view[i] = bin.charCodeAt(i);
  }
  return buf;
}

function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * オブジェクトキー生成ヘルパー（minio-signer.ts 互換）
 */
export function buildKey(prefix: string, id: string, name: string): string {
  return `${prefix}/${id}/${name}`;
}

export function buildUserAvatarKey(uid: string, ext: string): string {
  return `users/${uid}/avatar.${ext}`;
}
