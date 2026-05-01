// Cloudflare Pages デプロイの E2E 検証
// 1. ルートが 200 + index.html を返す
// 2. レスポンスヘッダに CSP / X-Frame-Options / HSTS が含まれる
// 3. CSP の connect-src に Worker URL を含む
// 4. SPA fallback: 任意のパスが index.html (200) を返す
// 5. Worker /health が Pages origin から CORS 許可される
//
// 使い方:
//   node tools/scripts/verify-cf-pages.mjs                # 既定 URL を使う
//   node tools/scripts/verify-cf-pages.mjs https://...    # URL 指定

const PAGES_URL = process.argv[2] ?? 'https://aidev-knowledge-hub.pages.dev';
const WORKER_URL = 'https://aidev-og-worker.ipc-claudeapps001.workers.dev';

let failures = 0;

function fail(label, detail) {
  console.log(`❌ ${label}: ${detail}`);
  failures++;
}

function pass(label, detail = '') {
  console.log(`✅ ${label}${detail ? ': ' + detail : ''}`);
}

async function main() {
  console.log(`\n=== Cloudflare Pages 検証 (${PAGES_URL}) ===\n`);

  // 1. ルート 200 + index.html
  const root = await fetch(PAGES_URL + '/');
  const rootBody = await root.text();
  if (root.status !== 200) fail('1. ルート GET', `expected 200, got ${root.status}`);
  else if (!rootBody.includes('<div id="root">')) fail('1. ルート GET', '#root が見つからない');
  else pass('1. ルート GET 200 + index.html');

  // 2. セキュリティヘッダ
  const requiredHeaders = {
    'content-security-policy': /connect-src/i,
    'x-frame-options': /^DENY$/i,
    'x-content-type-options': /^nosniff$/i,
    'referrer-policy': /strict-origin-when-cross-origin/i,
    'strict-transport-security': /max-age=\d+/i,
    'permissions-policy': /camera=\(\)/i,
  };
  for (const [name, pattern] of Object.entries(requiredHeaders)) {
    const v = root.headers.get(name);
    if (!v || !pattern.test(v)) fail(`2. ヘッダ ${name}`, `value=${v}`);
    else pass(`2. ヘッダ ${name}`);
  }

  // 3. CSP に Worker URL
  const csp = root.headers.get('content-security-policy') ?? '';
  if (!csp.includes('aidev-og-worker.ipc-claudeapps001.workers.dev')) {
    fail('3. CSP connect-src Worker URL', 'Worker URL が CSP に無い');
  } else pass('3. CSP connect-src Worker URL');

  // 4. SPA fallback
  const deep = await fetch(PAGES_URL + '/links/non-existent-id-' + Date.now());
  const deepBody = await deep.text();
  if (deep.status !== 200) fail('4. SPA fallback', `expected 200, got ${deep.status}`);
  else if (!deepBody.includes('<div id="root">')) fail('4. SPA fallback', 'index.html ではない');
  else pass('4. SPA fallback (deep link → index.html)');

  // 5. assets immutable cache
  const assetMatch = /\/assets\/[A-Za-z0-9._-]+\.js/.exec(rootBody);
  if (!assetMatch) {
    fail('5. assets cache', 'index.html から asset URL を抽出できない');
  } else {
    const asset = await fetch(PAGES_URL + assetMatch[0]);
    const cc = asset.headers.get('cache-control') ?? '';
    if (!/immutable/.test(cc) || !/max-age=31536000/.test(cc)) {
      fail('5. assets immutable cache', `cache-control=${cc}`);
    } else pass('5. assets immutable cache', cc);
  }

  // 6. Worker CORS preflight from Pages origin
  const preflight = await fetch(WORKER_URL + '/api/og?url=https://example.com', {
    method: 'OPTIONS',
    headers: {
      Origin: PAGES_URL,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization',
    },
  });
  const allowOrigin = preflight.headers.get('access-control-allow-origin');
  if (preflight.status !== 204 && preflight.status !== 200) {
    fail('6. Worker CORS preflight', `status=${preflight.status}`);
  } else if (allowOrigin !== PAGES_URL && allowOrigin !== '*') {
    fail('6. Worker CORS preflight', `allow-origin=${allowOrigin}`);
  } else pass('6. Worker CORS preflight from Pages origin', `allow-origin=${allowOrigin}`);

  // 7. Worker /health（Pages origin GET）
  const health = await fetch(WORKER_URL + '/health', { headers: { Origin: PAGES_URL } });
  if (health.status !== 200) fail('7. Worker /health', `status=${health.status}`);
  else pass('7. Worker /health', `status=${health.status}`);

  console.log(`\n=== ${failures === 0 ? '全 PASS' : `${failures} 件失敗`} ===\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('実行時エラー:', err);
  process.exit(2);
});
