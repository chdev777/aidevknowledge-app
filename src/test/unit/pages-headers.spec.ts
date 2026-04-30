// Cloudflare Pages 用 public/_headers と public/_redirects の構成検証
//
// 設計: firebase.json hosting.headers の CSP / セキュリティヘッダを
// Cloudflare Pages の静的 _headers ファイル形式へ移植する。
// Worker (`aidev-og-worker.ipc-claudeapps001.workers.dev`) を connect-src に追加。
//
// _redirects は SPA history fallback (`/* /index.html 200`) を提供。
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');

function readPublic(name: string): string {
  return readFileSync(resolve(ROOT, 'public', name), 'utf8');
}

describe('public/_redirects (Cloudflare Pages SPA fallback)', () => {
  let body: string;

  it('ファイルが存在しテキストを読める', () => {
    body = readPublic('_redirects');
    expect(body.length).toBeGreaterThan(0);
  });

  it('SPA fallback ルールが含まれる（/* → /index.html 200）', () => {
    body ??= readPublic('_redirects');
    // 末尾改行・コメント混在を許容
    const lines = body
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    const hasFallback = lines.some((l) => /^\/\*\s+\/index\.html\s+200\b/.test(l));
    expect(hasFallback).toBe(true);
  });
});

describe('public/_headers (Cloudflare Pages security headers)', () => {
  let body: string;

  it('ファイルが存在しテキストを読める', () => {
    body = readPublic('_headers');
    expect(body.length).toBeGreaterThan(0);
  });

  it('全パス（/*）に対するヘッダブロックを含む', () => {
    body ??= readPublic('_headers');
    expect(body).toMatch(/^\/\*\s*$/m);
  });

  it('CSP に Worker URL（connect-src）を含む', () => {
    body ??= readPublic('_headers');
    const csp = extractHeader(body, 'Content-Security-Policy');
    expect(csp).toBeTruthy();
    // Worker は workers.dev サブドメイン。明示 or ワイルドカード許容
    const ok =
      /aidev-og-worker\.ipc-claudeapps001\.workers\.dev/.test(csp!) ||
      /https:\/\/\*\.workers\.dev/.test(csp!);
    expect(ok).toBe(true);
  });

  it('CSP の connect-src に Firebase Auth / Firestore エンドポイントを含む', () => {
    body ??= readPublic('_headers');
    const csp = extractHeader(body, 'Content-Security-Policy');
    expect(csp).toMatch(/identitytoolkit\.googleapis\.com/);
    expect(csp).toMatch(/securetoken\.googleapis\.com/);
    expect(csp).toMatch(/\*\.googleapis\.com/);
  });

  it('CSP に frame-ancestors none を含む（クリックジャック防止）', () => {
    body ??= readPublic('_headers');
    const csp = extractHeader(body, 'Content-Security-Policy');
    expect(csp).toMatch(/frame-ancestors\s+'none'/);
  });

  it('CSP の script-src は self のみ（unsafe-inline / unsafe-eval なし）', () => {
    body ??= readPublic('_headers');
    const csp = extractHeader(body, 'Content-Security-Policy');
    const scriptSrc = /script-src\s+([^;]+)/.exec(csp!)?.[1] ?? '';
    expect(scriptSrc).not.toMatch(/unsafe-inline/);
    expect(scriptSrc).not.toMatch(/unsafe-eval/);
  });

  it('必須セキュリティヘッダが揃っている', () => {
    body ??= readPublic('_headers');
    expect(extractHeader(body, 'X-Content-Type-Options')).toBe('nosniff');
    expect(extractHeader(body, 'X-Frame-Options')).toBe('DENY');
    expect(extractHeader(body, 'Referrer-Policy')).toMatch(/strict-origin-when-cross-origin/);
    expect(extractHeader(body, 'Permissions-Policy')).toMatch(/camera=\(\)/);
    expect(extractHeader(body, 'Strict-Transport-Security')).toMatch(/max-age=\d+/);
  });
});

/**
 * `_headers` のパスブロック（`/*`）配下から、指定ヘッダの値を抽出する。
 * Cloudflare Pages 形式: 値はインデント 2 スペース、`Name: value` 行。
 */
function extractHeader(body: string, name: string): string | null {
  // /* ブロックの開始位置を探す
  const lines = body.split(/\r?\n/);
  let inBlock = false;
  for (const raw of lines) {
    if (/^\/\*\s*$/.test(raw)) {
      inBlock = true;
      continue;
    }
    // 別パスブロックに入ったら終了（インデントなしで `/` で始まる行）
    if (inBlock && /^\//.test(raw) && !/^\/\*/.test(raw)) {
      inBlock = false;
    }
    if (!inBlock) continue;
    const m = new RegExp(`^\\s+${escapeRegex(name)}:\\s*(.+)$`, 'i').exec(raw);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
