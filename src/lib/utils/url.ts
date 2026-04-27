import type { SourceType } from '../../types/link.js';

/**
 * URL から sourceType を推定する
 */
export function detectSourceType(url: string): SourceType {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'YouTube';
    if (host === 'x.com' || host === 'twitter.com' || host.endsWith('.x.com')) return 'X';
    if (host === 'github.com' || host.endsWith('.github.com') || host === 'gist.github.com')
      return 'GitHub';
    if (
      host === 'qiita.com' ||
      host === 'zenn.dev' ||
      host.endsWith('.zenn.dev') ||
      host === 'note.com' ||
      host === 'medium.com' ||
      host.endsWith('.hatena.ne.jp') ||
      host === 'dev.to'
    ) {
      return '記事';
    }
    if (
      host.endsWith('.openai.com') ||
      host.endsWith('.anthropic.com') ||
      host.endsWith('.googleapis.com') ||
      host.includes('docs.') ||
      host.endsWith('.google.dev') ||
      host.endsWith('.cloudflare.com')
    ) {
      return '公式Docs';
    }
    return 'Web';
  } catch {
    return 'Web';
  }
}

/** ホスト部分だけ取り出す（"example.com/foo" → "example.com"） */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/** URL がアプリケーションで許可するスキームかチェック（XSS防止） */
export function isSafeHref(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** YouTube URL から videoId を抽出（11文字） */
export function extractYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1);
    } else if (u.hostname.endsWith('youtube.com')) {
      id = u.searchParams.get('v');
    }
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    return null;
  } catch {
    return null;
  }
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
