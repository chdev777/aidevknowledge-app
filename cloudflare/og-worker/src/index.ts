/**
 * Cloudflare Worker entrypoint
 * og-proxy 互換 API:
 *   GET  /health
 *   GET  /api/og?url=...
 *   POST /api/storage/upload-url
 *   GET  /api/storage/download-url?key=...
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth } from './auth.js';
import { fetchOg, extractYoutubeThumbnail } from './og-fetcher.js';
import {
  generateSignedUrl,
  buildKey,
  buildUserAvatarKey,
} from './storage.js';
import type { FirebaseTokenPayload } from './auth.js';

interface Env {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  STORAGE_BUCKET: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMITER?: { limit: (opts: { key: string }) => Promise<{ success: boolean }> };
}

type Variables = {
  user: FirebaseTokenPayload;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  return cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
    allowHeaders: ['authorization', 'content-type'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  })(c, next);
});

// レート制限（Cloudflare Rate Limiting binding 利用、未バインドなら skip）
app.use('/api/*', async (c, next) => {
  if (c.env.RATE_LIMITER) {
    const ip =
      c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'anon';
    const { success } = await c.env.RATE_LIMITER.limit({ key: ip });
    if (!success) {
      return c.json({ error: 'rate limited' }, 429);
    }
  }
  await next();
  return;
});

app.get('/health', (c) =>
  c.json({ ok: true, ts: new Date().toISOString() }),
);

// ----- OG メタ取得 -----
app.get('/api/og', async (c, next) => {
  const mw = requireAuth(c.env.FIREBASE_PROJECT_ID);
  return mw(c, next);
}, async (c) => {
  const url = (c.req.query('url') ?? '').trim();
  if (!url) return c.json({ error: 'url is required' }, 400);

  try {
    const ytThumb = extractYoutubeThumbnail(url);
    const og = await fetchOg(url).catch((err: Error) => {
      if (ytThumb) return { url, image: ytThumb };
      throw err;
    });
    if (ytThumb && !og.image) og.image = ytThumb;
    return c.json(og);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch failed';
    return c.json({ error: 'og fetch failed', detail: msg }, 502);
  }
});

// ----- Storage 署名URL（アップロード） -----
app.post('/api/storage/upload-url', async (c, next) => {
  const mw = requireAuth(c.env.FIREBASE_PROJECT_ID);
  return mw(c, next);
}, async (c) => {
  if (!c.env.FIREBASE_CLIENT_EMAIL || !c.env.FIREBASE_PRIVATE_KEY || !c.env.STORAGE_BUCKET) {
    return c.json(
      { error: 'storage not configured', detail: 'Storage backend (Firebase or R2) は未設定。PoC option B では未使用。' },
      503,
    );
  }
  const user = c.get('user');
  const uid = user.uid;
  const body = await c.req.json<{
    kind?: 'avatar' | 'link-thumb' | 'note-attachment' | 'app-thumb';
    ext?: string;
    contentType?: string;
    targetId?: string;
  }>();

  if (!body.kind || !body.contentType || !body.ext) {
    return c.json({ error: 'kind, ext, contentType are required' }, 400);
  }
  if (!/^[a-z0-9]{1,5}$/i.test(body.ext)) {
    return c.json({ error: 'invalid ext' }, 400);
  }

  let key: string;
  switch (body.kind) {
    case 'avatar':
      key = buildUserAvatarKey(uid, body.ext);
      break;
    case 'link-thumb':
      if (!body.targetId)
        return c.json({ error: 'targetId required' }, 400);
      key = buildKey('links', body.targetId, `thumb.${body.ext}`);
      break;
    case 'note-attachment':
      if (!body.targetId)
        return c.json({ error: 'targetId required' }, 400);
      key = buildKey('notes', body.targetId, `${Date.now()}.${body.ext}`);
      break;
    case 'app-thumb':
      if (!body.targetId)
        return c.json({ error: 'targetId required' }, 400);
      key = buildKey('apps', body.targetId, `thumb.${body.ext}`);
      break;
    default:
      return c.json({ error: 'unknown kind' }, 400);
  }

  try {
    const signedUrl = await generateSignedUrl({
      bucket: c.env.STORAGE_BUCKET,
      objectKey: key,
      method: 'PUT',
      contentType: body.contentType,
      expiresInSeconds: 5 * 60,
      serviceAccountEmail: c.env.FIREBASE_CLIENT_EMAIL,
      privateKeyPem: c.env.FIREBASE_PRIVATE_KEY,
    });
    return c.json({ key, url: signedUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'sign failed';
    return c.json({ error: 'sign failed', detail: msg }, 400);
  }
});

// ----- Storage 署名URL（ダウンロード） -----
app.get('/api/storage/download-url', async (c, next) => {
  const mw = requireAuth(c.env.FIREBASE_PROJECT_ID);
  return mw(c, next);
}, async (c) => {
  if (!c.env.FIREBASE_CLIENT_EMAIL || !c.env.FIREBASE_PRIVATE_KEY || !c.env.STORAGE_BUCKET) {
    return c.json(
      { error: 'storage not configured', detail: 'Storage backend は未設定。PoC option B では未使用。' },
      503,
    );
  }
  const key = (c.req.query('key') ?? '').trim();
  if (!key) return c.json({ error: 'key is required' }, 400);
  try {
    const signedUrl = await generateSignedUrl({
      bucket: c.env.STORAGE_BUCKET,
      objectKey: key,
      method: 'GET',
      expiresInSeconds: 10 * 60,
      serviceAccountEmail: c.env.FIREBASE_CLIENT_EMAIL,
      privateKeyPem: c.env.FIREBASE_PRIVATE_KEY,
    });
    return c.json({ url: signedUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'sign failed';
    return c.json({ error: 'sign failed', detail: msg }, 400);
  }
});

app.onError((err, c) => {
  console.error('[og-worker] unhandled', err);
  return c.json({ error: 'internal' }, 500);
});

export default app;
