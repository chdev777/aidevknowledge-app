import { request } from 'undici';
import * as cheerio from 'cheerio';
import { isPrivateIp } from './ssrf-guard.js';
import { lookup } from 'node:dns/promises';

export interface OgMeta {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export async function fetchOg(targetUrl: string): Promise<OgMeta> {
  const parsed = new URL(targetUrl);

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    throw new Error(`unsupported protocol: ${parsed.protocol}`);
  }

  // SSRF対策: ホスト名をIPに解決して、プライベート/メタデータIPを拒否
  const { address } = await lookup(parsed.hostname);
  if (isPrivateIp(address)) {
    throw new Error(`refused: private or metadata IP (${address})`);
  }

  const { statusCode, body, headers } = await request(targetUrl, {
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; aidev-knowledge-ogfetch/0.1)',
      accept: 'text/html,application/xhtml+xml',
    },
    bodyTimeout: 5000,
    headersTimeout: 5000,
    maxRedirections: 3,
  });

  if (statusCode >= 400) {
    throw new Error(`upstream ${statusCode}`);
  }

  const contentType = headers['content-type']?.toString() ?? '';
  if (!contentType.includes('text/html')) {
    return { url: targetUrl };
  }

  const html = await body.text();
  const $ = cheerio.load(html);

  const meta = (prop: string, attr = 'property') =>
    $(`meta[${attr}="${prop}"]`).attr('content');

  return {
    url: targetUrl,
    title:
      meta('og:title') ??
      meta('twitter:title', 'name') ??
      $('title').first().text() ??
      undefined,
    description:
      meta('og:description') ??
      meta('description', 'name') ??
      meta('twitter:description', 'name') ??
      undefined,
    image:
      meta('og:image') ??
      meta('twitter:image', 'name') ??
      undefined,
    siteName: meta('og:site_name') ?? undefined,
  };
}

/**
 * YouTube URL 専用：videoId からサムネイルURLを直接生成
 * （CORSなし、認証なし、ブラウザだけで完結する公開URLパターン）
 */
export function extractYoutubeThumbnail(targetUrl: string): string | null {
  try {
    const u = new URL(targetUrl);
    let videoId: string | null = null;

    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.endsWith('youtube.com')) {
      videoId = u.searchParams.get('v');
    }

    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
  } catch {
    return null;
  }
  return null;
}
