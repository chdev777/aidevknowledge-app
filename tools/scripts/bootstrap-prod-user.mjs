#!/usr/bin/env node
// 本番 Firebase に新規ユーザを bootstrap（SignupPage の bootstrapUser と等価な REST 実装）
//
// SDK が叩くエンドポイントを直接叩くことで、ブラウザ無しで本番 seed を実行する。
// Rules は idToken の Bearer 認証で適用されるので、SDK と完全に同じ検証経路を通る。
//
// 順序（bootstrapUser と同じ）:
//   1. handles/{handle} 事前重複チェック
//   2. accounts:signUp で Auth 作成 → uid + idToken 取得
//   3. accounts:update で displayName 設定
//   4. Firestore commit: handles/{handle} + users/{uid} を 1 トランザクションで set
//   5. users/{uid}/private/profile を set
//   6. accounts:sendOobCode で確認メール送信（失敗は無視）
//
// 失敗時は signUp 後なら accounts:delete で Auth ロールバック。
//
// 使い方:
//   node tools/scripts/bootstrap-prod-user.mjs \
//     --email test2@example.com --password testtest123 \
//     --name 'テスト二郎' --handle test2 \
//     --role 'DX推進' --color '#7a8b6f'
//
// 秘密値は user-visible 出力に出さない（mask）

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..', '..');
const ENV_FILE = resolve(ROOT, '.env.production.local');
const PAGES_ORIGIN = 'https://aidev-knowledge-hub.pages.dev';
const ALLOWED_ROLES = ['DX推進', '情報支援'];
const HANDLE_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    password: { type: 'string' },
    name: { type: 'string' },
    handle: { type: 'string' },
    role: { type: 'string' },
    color: { type: 'string', default: '#6b7a99' },
  },
});

for (const k of ['email', 'password', 'name', 'handle', 'role']) {
  if (!values[k]) {
    console.error(`error: --${k} required`);
    process.exit(1);
  }
}
if (!HANDLE_PATTERN.test(values.handle)) {
  console.error(`error: handle must match ${HANDLE_PATTERN}`);
  process.exit(1);
}
if (!ALLOWED_ROLES.includes(values.role)) {
  console.error(`error: role must be one of ${JSON.stringify(ALLOWED_ROLES)} (admin は招待のみ)`);
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
  'Origin': PAGES_ORIGIN,
  'Referer': `${PAGES_ORIGIN}/`,
};

console.log('=== Bootstrap prod user ===');
console.log(`project: ${projectId}`);
console.log(`email:   ${mask(values.email)}`);
console.log(`handle:  ${values.handle}`);
console.log(`role:    ${values.role}`);
console.log(`name:    ${values.name}`);
console.log(`color:   ${values.color}`);
console.log('');

// --- 1. 事前 handle 重複チェック（unauthenticated でも可: Rules は read=signedIn() だが
//        signUp 直前なので idToken なし。ここは existence チェックのみ目的。本番で重複時は
//        signUp 後の transaction でも検出される）
// → idToken 不要のため commit 系では走らせず、signUp 後に再チェック

// --- 2. signUp（createUserWithEmailAndPassword 相当）
const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
const signUpRes = await fetch(signUpUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    email: values.email,
    password: values.password,
    returnSecureToken: true,
  }),
});
const signUpBody = await signUpRes.json();
if (!signUpRes.ok) {
  const code = signUpBody?.error?.message || 'UNKNOWN';
  console.error(`❌ signUp 失敗: HTTP ${signUpRes.status} / ${code}`);
  if (code === 'EMAIL_EXISTS') {
    console.error('   → このメールは Auth に既存。別メールを指定するか、既存ユーザに対しては別の補完スクリプトを使う');
  }
  process.exit(1);
}
const { idToken, localId: uid } = signUpBody;
console.log(`✅ 1. signUp 成功 uid=${mask(uid)}`);

// 失敗時のロールバック関数
async function rollbackAuth() {
  try {
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ idToken }),
    });
    console.error('   ↩ Auth アカウントをロールバック削除');
  } catch (e) {
    console.error(`   ⚠ ロールバック失敗: ${e.message}`);
  }
}

try {
  // --- 3. updateProfile（displayName）
  const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`;
  const updateRes = await fetch(updateUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ idToken, displayName: values.name, returnSecureToken: false }),
  });
  if (!updateRes.ok) {
    const b = await updateRes.json();
    throw new Error(`updateProfile: HTTP ${updateRes.status} / ${b?.error?.message}`);
  }
  console.log(`✅ 2. displayName 設定`);

  // --- 4. handles/{handle} 重複チェック（idToken 取得済なので Rules 通過可能）
  const handleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/handles/${values.handle}`;
  const handleRes = await fetch(handleUrl, { headers: { ...headers, Authorization: `Bearer ${idToken}` } });
  if (handleRes.ok) {
    throw new Error(`handle '${values.handle}' は既に使用中`);
  } else if (handleRes.status !== 404) {
    const b = await handleRes.json();
    throw new Error(`handle 確認失敗: HTTP ${handleRes.status} / ${b?.error?.message}`);
  }
  console.log(`✅ 3. handle 空き確認 (404)`);

  // --- 5. handles + users をアトミック commit（runTransaction 相当）
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
  const nowIso = new Date().toISOString();
  const commitBody = {
    writes: [
      {
        // handles/{handle}: uid + createdAt（既存なら fail で abort）
        update: {
          name: `projects/${projectId}/databases/(default)/documents/handles/${values.handle}`,
          fields: {
            uid: { stringValue: uid },
            createdAt: { timestampValue: nowIso },
          },
        },
        currentDocument: { exists: false },
      },
      {
        update: {
          name: `projects/${projectId}/databases/(default)/documents/users/${uid}`,
          fields: {
            name: { stringValue: values.name },
            handle: { stringValue: values.handle },
            role: { stringValue: values.role },
            color: { stringValue: values.color },
            createdAt: { timestampValue: nowIso },
            updatedAt: { timestampValue: nowIso },
          },
        },
        currentDocument: { exists: false },
      },
    ],
  };
  const commitRes = await fetch(commitUrl, {
    method: 'POST',
    headers: { ...headers, Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(commitBody),
  });
  if (!commitRes.ok) {
    const b = await commitRes.json();
    throw new Error(`atomic commit (handles+users): HTTP ${commitRes.status} / ${JSON.stringify(b).slice(0, 300)}`);
  }
  console.log(`✅ 4. handles + users アトミック commit 成功`);

  // --- 6. private/profile（個人情報、users 作成後に別書込）
  const privateUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/private/profile`;
  const privateRes = await fetch(`${privateUrl}?currentDocument.exists=false`, {
    method: 'PATCH',
    headers: { ...headers, Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({
      fields: {
        email: { stringValue: values.email },
        createdAt: { timestampValue: nowIso },
      },
    }),
  });
  if (!privateRes.ok) {
    const b = await privateRes.json();
    throw new Error(`private/profile: HTTP ${privateRes.status} / ${JSON.stringify(b).slice(0, 300)}`);
  }
  console.log(`✅ 5. users/{uid}/private/profile 作成`);

  // --- 7. メール確認送信（失敗無視、bootstrapUser と同じ）
  const oobUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
  const oobRes = await fetch(oobUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken }),
  });
  if (oobRes.ok) {
    console.log(`✅ 6. 確認メール送信`);
  } else {
    console.log(`⚠️  6. 確認メール送信失敗（無視可: ${(await oobRes.json())?.error?.message ?? 'unknown'}）`);
  }

  console.log('');
  console.log(`=== 完了 ===`);
  console.log(`uid: ${uid}`);
  console.log(`本番 SPA: ${PAGES_ORIGIN}/signin で ${values.email} / (パスワード) 入力`);
} catch (err) {
  console.error(`❌ ${err.message}`);
  await rollbackAuth();
  process.exit(1);
}
