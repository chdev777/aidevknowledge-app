#!/usr/bin/env node
// 本番 Firestore に tags マスタを投入（管理者 idToken 経由 / REST 実装）
//
// Rules: tags の write は isAdmin() のみ。事前に管理者ロールのユーザでログインが必要。
// 既存 tag は idempotent に上書き（name / type のみ更新）。document ID は seed.ts と同じ t1〜t23。
//
// 秘密値の取り扱い:
//   - パスワードは引数では受け取らない（チャット履歴・ps に残らない）
//   - --password-file <path> または環境変数 PROD_ADMIN_PASSWORD のみ
//   - 標準出力には mask() でしか出さない
//
// 使い方:
//   # dry-run（書き込みなし、認証と isAdmin 確認のみ）
//   node tools/scripts/seed-prod-tags.mjs \
//     --email chikuda@j.kobegakuin.ac.jp \
//     --password-file secrets/admin-password.txt \
//     --dry-run
//
//   # 本番投入
//   node tools/scripts/seed-prod-tags.mjs \
//     --email chikuda@j.kobegakuin.ac.jp \
//     --password-file secrets/admin-password.txt
//
// このスクリプトは tools/scripts/seed.ts の TAGS 配列と同期する必要があります。
// seed.ts を変更したらこちらも変更してください（差分は本番反映前に dry-run で確認）。

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..', '..');
const ENV_FILE = resolve(ROOT, '.env.production.local');
const PAGES_ORIGIN = 'https://aidev-knowledge-hub.pages.dev';

// seed.ts の TAGS と同期（最終更新: session 11 / 2026-05-01）
const TAGS = [
  ['t1', 'RAG', '技術'],
  ['t2', 'ベクトルDB', '技術'],
  ['t3', 'Function Calling', '技術'],
  ['t4', 'Agents', '技術'],
  ['t5', 'OCR', '技術'],
  ['t6', 'Dify', 'ツール'],
  ['t7', 'LangChain', 'ツール'],
  ['t8', 'LlamaIndex', 'ツール'],
  ['t9', 'OpenAI API', 'ツール'],
  ['t10', 'Claude', 'ツール'],
  ['t11', 'Gemini', 'ツール'],
  ['t12', 'Next.js', '開発'],
  ['t13', 'Python', '開発'],
  ['t14', 'FastAPI', '開発'],
  ['t15', 'PostgreSQL', '開発'],
  ['t16', 'Docker', '開発'],
  ['t17', 'FAQ検索', '用途'],
  ['t18', '議事録要約', '用途'],
  ['t19', '文書検索', '用途'],
  ['t20', '研修資料', '用途'],
  ['t21', '個人情報', 'セキュリティ'],
  ['t22', '認証', 'セキュリティ'],
  ['t23', 'プロンプトインジェクション', 'セキュリティ'],
];

const ALLOWED_TYPES = ['技術', 'ツール', '開発', '用途', 'セキュリティ', '状態'];

// --- args
const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    'password-file': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});

if (!values.email) {
  console.error('error: --email required');
  process.exit(1);
}

// パスワード読み込み: ファイル優先、無ければ環境変数
let password = process.env.PROD_ADMIN_PASSWORD ?? '';
if (values['password-file']) {
  const pf = resolve(values['password-file']);
  if (!existsSync(pf)) {
    console.error(`error: --password-file not found: ${pf}`);
    process.exit(1);
  }
  password = readFileSync(pf, 'utf8').trim();
}
if (!password) {
  console.error('error: 管理者パスワード未指定（--password-file <path> または環境変数 PROD_ADMIN_PASSWORD）');
  process.exit(1);
}

// --- env
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
  'Origin': PAGES_ORIGIN,
  'Referer': `${PAGES_ORIGIN}/`,
};

console.log('=== Seed prod tags ===');
console.log(`project: ${projectId}`);
console.log(`email:   ${mask(values.email)}`);
console.log(`tags:    ${TAGS.length} 件`);
console.log(`mode:    ${values['dry-run'] ? 'DRY-RUN' : 'WRITE'}`);
console.log('');

// --- TAGS バリデーション（クライアント側で先に弾く）
for (const [id, name, type] of TAGS) {
  if (typeof id !== 'string' || id.length === 0) {
    console.error(`error: invalid id ${JSON.stringify(id)}`);
    process.exit(1);
  }
  if (typeof name !== 'string' || name.length === 0 || name.length > 32) {
    console.error(`error: invalid name ${JSON.stringify(name)} (1-32 chars)`);
    process.exit(1);
  }
  if (!ALLOWED_TYPES.includes(type)) {
    console.error(`error: invalid type ${JSON.stringify(type)} (allowed: ${ALLOWED_TYPES.join('/')})`);
    process.exit(1);
  }
}

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
console.log(`✅ 1. signIn 成功 uid=${mask(uid)}`);

// --- 2. isAdmin 確認（Rules.tags.create が要求）
const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
const userRes = await fetch(userUrl, {
  headers: { ...headers, Authorization: `Bearer ${idToken}` },
});
if (!userRes.ok) {
  console.error(`❌ users/{uid} 取得失敗: HTTP ${userRes.status}`);
  process.exit(1);
}
const userBody = await userRes.json();
const role = userBody?.fields?.role?.stringValue;
if (role !== '管理者') {
  console.error(`❌ ロールが管理者ではありません（current=${role ?? '(none)'}）`);
  console.error('   tags 投入は管理者ロールのアカウントでしか実行できません');
  process.exit(1);
}
console.log(`✅ 2. role=管理者 確認`);

if (values['dry-run']) {
  console.log('');
  console.log('=== DRY-RUN: 書き込みは行いません ===');
  console.log('投入予定:');
  for (const [id, name, type] of TAGS) {
    console.log(`  ${id}: ${name} (${type})`);
  }
  process.exit(0);
}

// --- 3. atomic commit（最大 500 writes/commit、23 件は 1 コミットで OK）
const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
const writes = TAGS.map(([id, name, type]) => ({
  // currentDocument 未指定 → upsert（既存あれば update、無ければ create）
  update: {
    name: `projects/${projectId}/databases/(default)/documents/tags/${id}`,
    fields: {
      name: { stringValue: name },
      type: { stringValue: type },
    },
  },
  // updateMask を渡さないと「全フィールドを置換」扱い。
  // tags は name / type の 2 フィールドのみなので明示せず置換でよい。
}));

const commitRes = await fetch(commitUrl, {
  method: 'POST',
  headers: { ...headers, Authorization: `Bearer ${idToken}` },
  body: JSON.stringify({ writes }),
});
if (!commitRes.ok) {
  const b = await commitRes.json();
  console.error(`❌ commit 失敗: HTTP ${commitRes.status}`);
  console.error(`   ${JSON.stringify(b).slice(0, 500)}`);
  process.exit(1);
}
const commitBody = await commitRes.json();
const writeCount = commitBody?.writeResults?.length ?? 0;
console.log(`✅ 3. atomic commit 成功（${writeCount} writes）`);

// --- 4. 検証 read（先頭 3 件）
const verifyUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/tags?pageSize=5`;
const verifyRes = await fetch(verifyUrl, {
  headers: { ...headers, Authorization: `Bearer ${idToken}` },
});
if (verifyRes.ok) {
  const v = await verifyRes.json();
  const docs = v?.documents ?? [];
  console.log(`✅ 4. 検証 read: ${docs.length} 件取得（pageSize=5）`);
  for (const d of docs.slice(0, 3)) {
    const id = d.name.split('/').pop();
    const name = d.fields?.name?.stringValue;
    const type = d.fields?.type?.stringValue;
    console.log(`   ${id}: ${name} (${type})`);
  }
}

console.log('');
console.log(`=== 完了: ${TAGS.length} tags 投入 ===`);
