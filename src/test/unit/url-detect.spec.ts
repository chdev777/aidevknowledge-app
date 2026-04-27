import { describe, expect, it } from 'vitest';
import {
  detectSourceType,
  extractDomain,
  extractYoutubeVideoId,
  isSafeHref,
  youtubeThumbnailUrl,
} from '../../lib/utils/url.js';

describe('detectSourceType', () => {
  it('youtube.com → YouTube', () => {
    expect(detectSourceType('https://www.youtube.com/watch?v=xxxxx')).toBe('YouTube');
  });
  it('youtu.be → YouTube', () => {
    expect(detectSourceType('https://youtu.be/dQw4w9WgXcQ')).toBe('YouTube');
  });
  it('x.com / twitter.com → X', () => {
    expect(detectSourceType('https://x.com/foo/status/1')).toBe('X');
    expect(detectSourceType('https://twitter.com/foo/status/1')).toBe('X');
  });
  it('github.com → GitHub', () => {
    expect(detectSourceType('https://github.com/anthropic/claude-code')).toBe('GitHub');
  });
  it('qiita / zenn → 記事', () => {
    expect(detectSourceType('https://qiita.com/x/items/y')).toBe('記事');
    expect(detectSourceType('https://zenn.dev/x/articles/y')).toBe('記事');
  });
  it('docs.* → 公式Docs', () => {
    expect(detectSourceType('https://docs.anthropic.com/en/docs')).toBe('公式Docs');
  });
  it('その他 → Web', () => {
    expect(detectSourceType('https://example.com/page')).toBe('Web');
  });
  it('不正な URL → Web', () => {
    expect(detectSourceType('not a url')).toBe('Web');
  });
});

describe('extractDomain', () => {
  it('returns hostname', () => {
    expect(extractDomain('https://example.com/foo/bar?q=1')).toBe('example.com');
  });
  it('invalid → ""', () => {
    expect(extractDomain('not-a-url')).toBe('');
  });
});

describe('isSafeHref', () => {
  it('http/https は OK', () => {
    expect(isSafeHref('http://example.com')).toBe(true);
    expect(isSafeHref('https://example.com')).toBe(true);
  });
  it('javascript: は拒否', () => {
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
  });
  it('data: は拒否', () => {
    expect(isSafeHref('data:text/html,<script>alert(1)</script>')).toBe(false);
  });
  it('file: は拒否', () => {
    expect(isSafeHref('file:///etc/passwd')).toBe(false);
  });
  it('不正 URL は拒否', () => {
    expect(isSafeHref('////')).toBe(false);
  });
});

describe('extractYoutubeVideoId', () => {
  it('youtu.be 形式から videoId', () => {
    expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('youtube.com/watch?v= 形式から videoId', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe('dQw4w9WgXcQ');
  });
  it('11文字でなければ null', () => {
    expect(extractYoutubeVideoId('https://youtu.be/short')).toBeNull();
  });
  it('youtube 以外は null', () => {
    expect(extractYoutubeVideoId('https://example.com/dQw4w9WgXcQ')).toBeNull();
  });
});

describe('youtubeThumbnailUrl', () => {
  it('正規の videoId から ytimg URL', () => {
    expect(youtubeThumbnailUrl('dQw4w9WgXcQ')).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
  });
});
