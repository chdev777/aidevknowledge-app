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

  // X / Twitter は非ブラウザ UA に対し空 HTML を返すため、
  // 公開oEmbed (publish.twitter.com) を優先で叩いて投稿者・本文を取り出す。
  if (parsed.hostname === 'x.com' || parsed.hostname === 'twitter.com' ||
      parsed.hostname.endsWith('.x.com') || parsed.hostname.endsWith('.twitter.com')) {
    const oembed = await fetchTwitterOEmbed(targetUrl).catch(() => null);
    if (oembed) return oembed;
    // oEmbed が失敗（古い・削除・非公開ツイート）でも下の通常 fetch にフォールバック
  }

  const { statusCode, body, headers } = await request(targetUrl, {
    method: 'GET',
    headers: {
      // 主要サイトは Bot UA だと簡易ページを返すので Chrome を装う
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'ja,en;q=0.9',
    },
    bodyTimeout: 8000,
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
 * Twitter oEmbed: 公開ツイートの author / text / 投稿者URL を取得
 * https://publish.twitter.com/oembed?url=<URL>
 */
async function fetchTwitterOEmbed(targetUrl: string): Promise<OgMeta | null> {
  const ep = `https://publish.twitter.com/oembed?url=${encodeURIComponent(targetUrl)}&omit_script=true`;
  const { statusCode, body } = await request(ep, {
    method: 'GET',
    headers: { accept: 'application/json' },
    bodyTimeout: 5000,
    headersTimeout: 5000,
    maxRedirections: 2,
  });
  if (statusCode !== 200) return null;
  const json = (await body.json()) as {
    author_name?: string;
    author_url?: string;
    html?: string;
    title?: string;
  };
  // html は <blockquote class="twitter-tweet">…</blockquote> 形式
  // 中身のテキストを抽出して description にする
  const text = (() => {
    if (!json.html) return undefined;
    const m = /<p[^>]*>([\s\S]*?)<\/p>/.exec(json.html);
    if (!m || !m[1]) return undefined;
    return m[1]
      .replace(/<a[^>]*>/g, '')
      .replace(/<\/a>/g, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  })();

  return {
    url: targetUrl,
    title: json.author_name ? `${json.author_name} (X)` : 'X (Twitter)',
    description: text,
    siteName: 'X (formerly Twitter)',
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
