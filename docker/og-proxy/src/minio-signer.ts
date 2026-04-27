import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.MINIO_ENDPOINT ?? 'http://minio:9000';
const accessKeyId = process.env.MINIO_ROOT_USER ?? 'minioadmin';
const secretAccessKey = process.env.MINIO_ROOT_PASSWORD ?? 'minioadmin';
const bucket = process.env.MINIO_BUCKET ?? 'aidev-uploads';

const s3 = new S3Client({
  endpoint,
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPE = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;

export async function getUploadUrl(opts: {
  key: string;
  contentType: string;
  maxSize?: number;
}): Promise<{ url: string; method: 'PUT'; headers: Record<string, string> }> {
  if (!ALLOWED_CONTENT_TYPE.test(opts.contentType)) {
    throw new Error(`unsupported contentType: ${opts.contentType}`);
  }
  const maxSize = opts.maxSize ?? MAX_UPLOAD_SIZE;
  if (maxSize > MAX_UPLOAD_SIZE) {
    throw new Error('maxSize exceeds limit');
  }

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: opts.key,
    ContentType: opts.contentType,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 5 * 60 });

  return {
    url,
    method: 'PUT',
    headers: { 'content-type': opts.contentType },
  };
}

export async function getDownloadUrl(key: string, expiresIn = 60 * 60): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function buildUserAvatarKey(uid: string, ext: string): string {
  return `users/${uid}/avatar.${ext.replace(/^\./, '')}`;
}

export function buildKey(prefix: string, id: string, name: string): string {
  // 簡易サニタイズ：スラッシュとnullバイトを除去
  const safe = name.replace(/[/\0]/g, '_');
  return `${prefix}/${id}/${safe}`;
}
