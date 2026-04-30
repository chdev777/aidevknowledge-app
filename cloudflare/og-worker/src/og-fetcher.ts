/**
 * OG メタ取得（Workers 版）
 *
 * cheerio は使わず、Cloudflare Workers の HTMLRewriter でストリーム処理。
 * - メモリ効率良い、CPU 時間も短い（HTMLRewriter は SAX 系で全 DOM を構築しない）
 * - <meta> タグを直接掴む実装
 *
 * SSRF 対策:
 *  - Workers から学内 LAN への到達は構造的に不可能（外部 fetch のみ）
 *  - ただし URL ホストが localhost / プライベート IP リテラルなどは弾く
 *  - DNS-rebinding 系は Workers の fetch がリゾルブ時に edge IP を経由するため別経路
 */

export interface OgMeta {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

const REJECT_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
];

function isRejectedHost(host: string): boolean {
  return REJECT_HOST_PATTERNS.some((re) => re.test(host));
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function fetchOg(targetUrl: string): Promise<OgMeta> {
  const parsed = new URL(targetUrl);

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`unsupported protocol: ${parsed.protocol}`);
  }
  if (isRejectedHost(parsed.hostname)) {
    throw new Error(`refused: blocked host (${parsed.hostname})`);
  }

  // Twitter/X は oEmbed 優先
  if (
    parsed.hostname === 'x.com' ||
    parsed.hostname === 'twitter.com' ||
    parsed.hostname.endsWith('.x.com') ||
    parsed.hostname.endsWith('.twitter.com')
  ) {
    const oembed = await fetchTwitterOEmbed(targetUrl).catch(() => null);
    if (oembed) return oembed;
  }

  const res = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'user-agent': UA,
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'ja,en;q=0.9',
    },
    redirect: 'follow',
    cf: {
      // Cloudflare 側のキャッシュ設定（Workers 専用フィールド）
      cacheTtl: 300,
      cacheEverything: true,
    },
  });

  if (res.status >= 400) {
    throw new Error(`upstream ${res.status}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('text/html')) {
    return { url: targetUrl };
  }

  return parseOgMetaWithHTMLRewriter(res, targetUrl);
}

/**
 * HTMLRewriter で <meta> と <title> を抽出
 */
async function parseOgMetaWithHTMLRewriter(
  res: Response,
  targetUrl: string,
): Promise<OgMeta> {
  const meta: OgMeta = { url: targetUrl };
  let titleText = '';

  const rewriter = new HTMLRewriter()
    .on('meta', {
      element(el) {
        const property = el.getAttribute('property');
        const name = el.getAttribute('name');
        const content = el.getAttribute('content');
        if (!content) return;

        if (property === 'og:title') meta.title ??= content;
        if (property === 'og:description') meta.description ??= content;
        if (property === 'og:image') meta.image ??= content;
        if (property === 'og:site_name') meta.siteName ??= content;

        if (name === 'twitter:title') meta.title ??= content;
        if (name === 'twitter:description') meta.description ??= content;
        if (name === 'twitter:image') meta.image ??= content;
        if (name === 'description') meta.description ??= content;
      },
    })
    .on('title', {
      text(t) {
        titleText += t.text;
      },
    });

  // HTMLRewriter は Response をストリーム処理する。consume 必要。
  const transformed = rewriter.transform(res);
  await transformed.text();

  if (!meta.title && titleText.trim()) {
    meta.title = titleText.trim();
  }

  return meta;
}

async function fetchTwitterOEmbed(targetUrl: string): Promise<OgMeta | null> {
  const ep = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
    targetUrl,
  )}&omit_script=true`;
  const res = await fetch(ep, {
    method: 'GET',
    headers: { accept: 'application/json' },
  });
  if (res.status !== 200) return null;
  const json = (await res.json()) as {
    author_name?: string;
    author_url?: string;
    html?: string;
    title?: string;
  };

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
