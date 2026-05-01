#!/usr/bin/env node
// 本番 Firebase Auth でユーザの emailVerified 状態を確認する
//
// 用途: メール検証ゲートデプロイ前に管理者の検証状態を確認し、
// デプロイ後に SPA がロックアウトされないか事前判定する。
//
// 実装: Identity Toolkit の signInWithPassword で idToken 取得 →
//       accounts:lookup で users[0].emailVerified を読み出す（admin SDK 不要）。
//
// 秘密値の取り扱い:
//   - パスワードは引数では受け取らない
//   - --password-file <path> または環境変数 PROD_USER_PASSWORD のみ
//   - 出力は mask() のみ
//
// 使い方:
//   node tools/scripts/check-prod-verified.mjs \
//     --email chikuda@j.kobegakuin.ac.jp \
//     --password-file secrets/admin-password.txt

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..', '..');
const ENV_FILE = resolve(ROOT, '.env.production.local');
const PAGES_ORIGIN = 'https://aidev-knowledge-hub.pages.dev';

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    'password-file': { type: 'string' },
  },
});

if (!values.email) {
  console.error('error: --email required');
  process.exit(1);
}

let password = process.env.PROD_USER_PASSWORD ?? '';
if (values['password-file']) {
  const pf = resolve(values['password-file']);
  if (!existsSync(pf)) {
    console.error(`error: --password-file not found: ${pf}`);
    process.exit(1);
  }
  password = readFileSync(pf, 'utf8').trim();
}
if (!password) {
  console.error('error: パスワード未指定（--password-file <path> または環境変数 PROD_USER_PASSWORD）');
  process.exit(1);
}

function loadEnv(path) {
  const raw = readFileSync(path, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function mask(s) {
  if (!s) return '(empty)';
  if (s.length <= 8) return '*'.repeat(s.length);
  return `${s.slice(0, 4)}…${s.slice(-2)} (len=${s.length})`;
}

const env = loadEnv(ENV_FILE);
const apiKey = env.VITE_FIREBASE_API_KEY;
const projectId = env.VITE_FIREBASE_PROJECT_ID;
if (!apiKey || !projectId) {
  console.error('error: VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID not in .env.production.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Origin: PAGES_ORIGIN,
  Referer: `${PAGES_ORIGIN}/`,
};

console.log('=== Check prod emailVerified ===');
console.log(`project: ${projectId}`);
console.log(`email:   ${mask(values.email)}`);
console.log('');

// --- 1. signIn
const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
const signInRes = await fetch(signInUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email: values.email, password, returnSecureToken: true }),
});
const signInBody = await signInRes.json();
if (!signInRes.ok) {
  const code = signInBody?.error?.message ?? 'UNKNOWN';
  console.error(`❌ signIn 失敗: HTTP ${signInRes.status} / ${code}`);
  process.exit(1);
}
const { idToken, localId: uid } = signInBody;
console.log(`✅ signIn 成功 uid=${mask(uid)}`);

// --- 2. accounts:lookup で emailVerified を取得
const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
const lookupRes = await fetch(lookupUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ idToken }),
});
const lookupBody = await lookupRes.json();
if (!lookupRes.ok) {
  const code = lookupBody?.error?.message ?? 'UNKNOWN';
  console.error(`❌ accounts:lookup 失敗: HTTP ${lookupRes.status} / ${code}`);
  process.exit(1);
}

const userInfo = lookupBody?.users?.[0];
if (!userInfo) {
  console.error('❌ user info 取得失敗（users[] が空）');
  process.exit(1);
}

const emailVerified = userInfo.emailVerified === true;
const createdAt = userInfo.createdAt
  ? new Date(Number(userInfo.createdAt)).toISOString()
  : '(unknown)';
const lastLoginAt = userInfo.lastLoginAt
  ? new Date(Number(userInfo.lastLoginAt)).toISOString()
  : '(unknown)';
const providers = (userInfo.providerUserInfo ?? []).map((p) => p.providerId).join(', ');

console.log('');
console.log('=== 結果 ===');
console.log(`emailVerified:  ${emailVerified ? '✅ true' : '❌ false'}`);
console.log(`providers:      ${providers || '(none)'}`);
console.log(`createdAt:      ${createdAt}`);
console.log(`lastLoginAt:    ${lastLoginAt}`);

console.log('');
if (emailVerified) {
  console.log('✅ デプロイ後もこのアカウントは通常通り使えます。');
  process.exit(0);
} else {
  console.log('⚠️  このアカウントは未検証です。メール検証ゲートデプロイ後は /verify-email');
  console.log('    に隔離され、確認メールリンクをクリックするまで管理操作ができません。');
  console.log('');
  console.log('対処:');
  console.log(`  1. ${PAGES_ORIGIN}/login でこのアカウントにサインイン`);
  console.log('  2. Topbar の「メール未検証」バッジをクリック → 確認メール送信');
  console.log('  3. メール内リンクをクリックして検証完了');
  console.log('  4. このスクリプトを再実行して emailVerified: true を確認');
  process.exit(1);
}
