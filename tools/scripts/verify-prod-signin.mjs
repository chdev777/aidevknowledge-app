#!/usr/bin/env node
// 本番 Firebase Auth signIn と users/{uid} bootstrap 状態の検証
// - Pages origin (Referer) を付けて signInWithPassword を叩き、auth/unauthorized-domain が出ないこと
// - 取得した idToken で Firestore users/{uid} を読み、bootstrap 済みか判定
// - 秘密値（API key / idToken / email / uid 全文）はチャット出力に出さない（マスク）

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const ENV_FILE = resolve(ROOT, '.env.production.local');
const PAGES_ORIGIN = 'https://aidev-knowledge-hub.pages.dev';
const TEST_EMAIL = process.env.PROD_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.PROD_TEST_PASSWORD || 'testtest123';

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
  console.error('error: VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID が .env.production.local に無い');
  process.exit(1);
}

console.log(`=== 本番 signIn 検証 ===`);
console.log(`project: ${projectId}`);
console.log(`apiKey:  ${mask(apiKey)}`);
console.log(`origin:  ${PAGES_ORIGIN}`);
console.log(`email:   ${mask(TEST_EMAIL)}`);
console.log('');

// --- 1. signInWithPassword（Pages Origin/Referer 付き）---
const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
const signInRes = await fetch(signInUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': PAGES_ORIGIN,
    'Referer': `${PAGES_ORIGIN}/`,
  },
  body: JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    returnSecureToken: true,
  }),
});

const signInBody = await signInRes.json();

if (!signInRes.ok) {
  const code = signInBody?.error?.message || 'UNKNOWN';
  console.error(`❌ signIn 失敗: HTTP ${signInRes.status} / code=${code}`);
  if (code.includes('UNAUTHORIZED_DOMAIN') || code === 'OPERATION_NOT_ALLOWED') {
    console.error('   → 承認済みドメインに aidev-knowledge-hub.pages.dev が未追加の可能性');
  }
  if (code === 'EMAIL_NOT_FOUND' || code === 'INVALID_PASSWORD' || code === 'INVALID_LOGIN_CREDENTIALS') {
    console.error('   → テストユーザーが本番に未作成 or パスワード不一致');
  }
  process.exit(1);
}

const { idToken, localId: uid } = signInBody;
console.log(`✅ 1. signIn 成功`);
console.log(`   idToken: ${mask(idToken)}`);
console.log(`   uid:     ${mask(uid)}`);
console.log('');

// --- 2a. Firestore 認可スモークテスト（tags をリスト）---
const tagsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/tags?pageSize=1`;
const tagsRes = await fetch(tagsUrl, {
  headers: { 'Authorization': `Bearer ${idToken}` },
});
const tagsBody = await tagsRes.json();
if (tagsRes.ok) {
  const count = (tagsBody.documents || []).length;
  console.log(`✅ 2a. Firestore 認可 OK（tags pageSize=1, doc数=${count}）`);
} else {
  console.error(`❌ 2a. Firestore 認可 NG: HTTP ${tagsRes.status}`);
  console.error(`   body: ${JSON.stringify(tagsBody).slice(0, 300)}`);
}
console.log('');

// --- 2b. Firestore users/{uid} 読み取り（bootstrap 判定）---
const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
const docRes = await fetch(docUrl, {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Origin': PAGES_ORIGIN,
    'Referer': `${PAGES_ORIGIN}/`,
  },
});

if (docRes.status === 404) {
  console.log(`⚠️  2. users/{uid} は未作成（bootstrap 未実行）`);
  console.log(`   → 本番 SPA をブラウザで開き、テストユーザーで signIn すると bootstrap-user.ts が走るはず`);
  console.log(`   URL: ${PAGES_ORIGIN}/signin`);
} else if (docRes.ok) {
  const doc = await docRes.json();
  const fields = doc.fields || {};
  const role = fields.role?.stringValue || '(none)';
  const handle = fields.handle?.stringValue || '(none)';
  const department = fields.department?.stringValue || '(none)';
  console.log(`✅ 2. users/{uid} 存在（bootstrap 済み）`);
  console.log(`   role:       ${role}`);
  console.log(`   handle:     ${mask(handle)}`);
  console.log(`   department: ${department}`);
} else {
  const errBody = await docRes.text();
  console.error(`❌ 2. users/{uid} 読み取り失敗: HTTP ${docRes.status}`);
  console.error(`   body: ${errBody.slice(0, 300)}`);
  process.exit(1);
}

console.log('');
console.log('=== 完了 ===');
