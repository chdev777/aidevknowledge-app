import express, { type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { fetchOg, extractYoutubeThumbnail } from './og-fetcher.js';
import { requireAuth, type AuthedRequest } from './auth.js';
import {
  getUploadUrl,
  getDownloadUrl,
  buildKey,
  buildUserAvatarKey,
} from './minio-signer.js';

const app = express();
app.use(express.json({ limit: '64kb' }));

// CORS — Vite dev (3000) からのみ許可
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ----- ヘルスチェック -----
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ----- OG メタ取得 -----
app.get('/api/og', requireAuth, async (req: AuthedRequest, res) => {
  const url = String(req.query['url'] ?? '').trim();
  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  try {
    // YouTube は URL pattern で先行
    const ytThumb = extractYoutubeThumbnail(url);
    const og = await fetchOg(url).catch((err: Error) => {
      // OG取得失敗時は YouTube サムネだけでも返す
      if (ytThumb) return { url, image: ytThumb };
      throw err;
    });

    if (ytThumb && !og.image) {
      og.image = ytThumb;
    }

    res.json(og);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch failed';
    res.status(502).json({ error: 'og fetch failed', detail: msg });
  }
});

// ----- ストレージ署名URL（アップロード） -----
app.post('/api/storage/upload-url', requireAuth, async (req: AuthedRequest, res) => {
  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'uid missing' });
    return;
  }
  const { kind, ext, contentType, targetId } = req.body as {
    kind?: 'avatar' | 'link-thumb' | 'note-attachment' | 'app-thumb';
    ext?: string;
    contentType?: string;
    targetId?: string;
  };
  if (!kind || !contentType || !ext) {
    res.status(400).json({ error: 'kind, ext, contentType are required' });
    return;
  }
  if (!/^[a-z0-9]{1,5}$/i.test(ext)) {
    res.status(400).json({ error: 'invalid ext' });
    return;
  }

  let key: string;
  switch (kind) {
    case 'avatar':
      key = buildUserAvatarKey(uid, ext);
      break;
    case 'link-thumb':
      if (!targetId) return void res.status(400).json({ error: 'targetId required' });
      key = buildKey('links', targetId, `thumb.${ext}`);
      break;
    case 'note-attachment':
      if (!targetId) return void res.status(400).json({ error: 'targetId required' });
      key = buildKey('notes', targetId, `${Date.now()}.${ext}`);
      break;
    case 'app-thumb':
      if (!targetId) return void res.status(400).json({ error: 'targetId required' });
      key = buildKey('apps', targetId, `thumb.${ext}`);
      break;
    default:
      return void res.status(400).json({ error: 'unknown kind' });
  }

  try {
    const signed = await getUploadUrl({ key, contentType });
    res.json({ key, ...signed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'sign failed';
    res.status(400).json({ error: 'sign failed', detail: msg });
  }
});

// ----- ストレージ署名URL（ダウンロード） -----
app.get('/api/storage/download-url', requireAuth, async (req: AuthedRequest, res) => {
  const key = String(req.query['key'] ?? '').trim();
  if (!key) {
    res.status(400).json({ error: 'key is required' });
    return;
  }
  try {
    const url = await getDownloadUrl(key);
    res.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'sign failed';
    res.status(400).json({ error: 'sign failed', detail: msg });
  }
});

// ----- エラーハンドラ -----
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[og-proxy] unhandled', err);
  res.status(500).json({ error: 'internal' });
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, '0.0.0.0', () => {
  console.log(`[og-proxy] listening on :${port}`);
});
