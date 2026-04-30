// Cloudflare Workers og-worker のエンドツーエンド検証
// 1. Firebase Auth REST API で signIn → ID Token 取得
// 2. Worker の /api/og を叩いて OG メタ取得を確認
//
// 前提:
//   - .env.production.local に VITE_FIREBASE_API_KEY が設定済み
//   - Firebase Auth に test ユーザーが存在（Console から手動作成 or SPA 経由）
//
// 使い方:
//   node tools/scripts/verify-cf-worker.mjs <email> <password>

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

function loadEnv(file) {
  const path = resolve(ROOT, file);
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return {};
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = {
  ...loadEnv('.env.production'),
  ...loadEnv('.env.production.local'),
};

const apiKey = env.VITE_FIREBASE_API_KEY;
const workerUrl = env.VITE_OG_PROXY_URL;

if (!apiKey) {
  console.error('❌ .env.production.local に VITE_FIREBASE_API_KEY が無い');
  process.exit(1);
}
if (!workerUrl) {
  console.error('❌ .env.production に VITE_OG_PROXY_URL が無い');
  process.exit(1);
}

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error('使い方: node tools/scripts/verify-cf-worker.mjs <email> <password>');
  process.exit(1);
}

async function signIn(apiKey, email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`signIn failed: ${JSON.stringify(data)}`);
  }
  return data.idToken;
}

async function callOg(workerUrl, token, target) {
  const url = `${workerUrl}/api/og?url=${encodeURIComponent(target)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, body: await res.json() };
}

(async () => {
  console.log('1. Firebase Auth に signIn...');
  const idToken = await signIn(apiKey, email, password);
  console.log(`   ✅ ID Token 取得（${idToken.length} 文字、先頭: ${idToken.slice(0, 20)}...）`);

  console.log('2. /health 動作確認...');
  const health = await fetch(`${workerUrl}/health`).then((r) => r.json());
  console.log('   ✅', health);

  console.log('3. /api/og（認証なし）→ 401 期待...');
  const noauth = await fetch(`${workerUrl}/api/og?url=https://example.com`);
  console.log(`   ${noauth.status === 401 ? '✅' : '❌'} HTTP ${noauth.status}`);

  console.log('4. /api/og（認証あり）→ 200 期待...');
  const targets = [
    'https://example.com',
    'https://github.com/anthropics/claude-code',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  ];
  for (const t of targets) {
    const r = await callOg(workerUrl, idToken, t);
    console.log(`   [${r.status}] ${t}`);
    console.log(`         title: ${r.body.title ?? '(none)'}`);
    console.log(`         image: ${r.body.image ?? '(none)'}`);
  }

  console.log('\n✅ 全動作確認完了');
})().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
