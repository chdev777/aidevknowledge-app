// Firebase Auth にユーザーを 1 件作成（Admin SDK 経由）
// secrets/firebase-admin.json のサービスアカウントを使用
//
// ⚠️ 学院 Google Workspace では `iam.disableServiceAccountKeyCreation` ポリシーで
//    サービスアカウント鍵の生成が禁止されているため、現在は実行不可。
//    Console UI でユーザーを手動追加する運用 (2026-04-30)。
//    将来ポリシー解除や seed 大量投入の必要が出た時用に温存。
//
// 使い方:
//   node tools/scripts/firebase-create-user.mjs <email> <password> [displayName]
//   例: node tools/scripts/firebase-create-user.mjs test@example.com testtest123 "テスト太郎"

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const ROOT = resolve(import.meta.dirname, '../..');
const SECRET_PATH = resolve(ROOT, 'secrets/firebase-admin.json');

if (!existsSync(SECRET_PATH)) {
  console.error(`❌ ${SECRET_PATH} が存在しない`);
  process.exit(1);
}

const [, , email, password, displayName] = process.argv;
if (!email || !password) {
  console.error('使い方: node firebase-create-user.mjs <email> <password> [displayName]');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(SECRET_PATH, 'utf8'));

if (!getApps().length) {
  initializeApp({ credential: cert(sa) });
}
const auth = getAuth();

(async () => {
  // 既存ユーザーは更新ではなく報告のみ
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`ℹ️  既存ユーザー: uid=${existing.uid}`);
    console.log('   パスワードを更新したい場合は --force オプションを将来追加');
    return;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }

  const user = await auth.createUser({
    email,
    password,
    displayName: displayName ?? email.split('@')[0],
    emailVerified: true,
  });

  console.log(`✅ 作成完了`);
  console.log(`   uid: ${user.uid}`);
  console.log(`   email: ${user.email}`);
  console.log(`   displayName: ${user.displayName}`);
})().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
