// Firebase Web App を Management API 経由で作成して config を取得
// secrets/firebase-admin.json のサービスアカウントを使用
//
// ⚠️ 学院 Google Workspace では `iam.disableServiceAccountKeyCreation` ポリシーで
//    サービスアカウント鍵の生成が禁止されているため、現在は実行不可。
//    Console UI で Web App を手動作成する運用 (2026-04-30)。
//    将来ポリシー解除 or Workload Identity Federation 等で鍵が使える環境に
//    なった場合の自動化用に温存。
//
// 使い方:
//   node tools/scripts/firebase-setup-webapp.mjs <displayName>
//   例: node tools/scripts/firebase-setup-webapp.mjs aidev-knowledge-web
//
// 出力:
//   .env.production.local に VITE_FIREBASE_* 一式を追記（既存値は上書き）

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { google } from 'googleapis';

const ROOT = resolve(import.meta.dirname, '../..');
const SECRET_PATH = resolve(ROOT, 'secrets/firebase-admin.json');
const ENV_PATH = resolve(ROOT, '.env.production.local');

if (!existsSync(SECRET_PATH)) {
  console.error(`❌ ${SECRET_PATH} が存在しない`);
  console.error('   GCP Console でサービスアカウント JSON をダウンロードして配置してください');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(SECRET_PATH, 'utf8'));
const projectId = sa.project_id;

const displayName = process.argv[2] ?? 'aidev-knowledge-web';

const auth = new google.auth.GoogleAuth({
  credentials: sa,
  scopes: ['https://www.googleapis.com/auth/firebase'],
});
const firebase = google.firebase({ version: 'v1beta1', auth });

(async () => {
  console.log(`プロジェクト ${projectId} の既存 Web App を確認...`);
  const list = await firebase.projects.webApps.list({
    parent: `projects/${projectId}`,
  });
  const existing = (list.data.apps ?? []).find(
    (a) => a.displayName === displayName,
  );

  let appId;
  if (existing) {
    console.log(`✅ 既存の Web App を再利用: ${existing.appId}`);
    appId = existing.appId;
  } else {
    console.log(`Web App "${displayName}" を作成中...`);
    const op = await firebase.projects.webApps.create({
      parent: `projects/${projectId}`,
      requestBody: { displayName },
    });
    // long-running op の完了を待つ（簡易ポーリング）
    let opName = op.data.name;
    let result;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const status = await firebase.operations.get({ name: opName });
      if (status.data.done) {
        result = status.data.response;
        break;
      }
    }
    if (!result) throw new Error('Web App 作成タイムアウト');
    appId = result.appId;
    console.log(`✅ 作成完了: ${appId}`);
  }

  console.log('config を取得中...');
  const config = await firebase.projects.webApps.getConfig({
    name: `projects/${projectId}/webApps/${appId}/config`,
  });

  const c = config.data;
  const lines = [
    `# Firebase Web App config (自動生成 by tools/scripts/firebase-setup-webapp.mjs)`,
    `VITE_FIREBASE_API_KEY=${c.apiKey}`,
    `VITE_FIREBASE_AUTH_DOMAIN=${c.authDomain}`,
    `VITE_FIREBASE_PROJECT_ID=${c.projectId}`,
    `VITE_FIREBASE_STORAGE_BUCKET=${c.storageBucket ?? ''}`,
    `VITE_FIREBASE_MESSAGING_SENDER_ID=${c.messagingSenderId}`,
    `VITE_FIREBASE_APP_ID=${c.appId}`,
  ];

  // 既存の .env.production.local がある場合、VITE_FIREBASE_* 行だけ置換
  let body = '';
  if (existsSync(ENV_PATH)) {
    body = readFileSync(ENV_PATH, 'utf8');
    body = body
      .split(/\r?\n/)
      .filter((l) => !/^VITE_FIREBASE_/.test(l) && !/^# Firebase Web App config/.test(l))
      .join('\n')
      .replace(/\n+$/, '');
    if (body) body += '\n\n';
  }
  body += lines.join('\n') + '\n';

  writeFileSync(ENV_PATH, body, 'utf8');
  console.log(`✅ ${ENV_PATH} に書き込み完了`);
  console.log(`   appId: ${c.appId}`);
  console.log(`   apiKey: ${(c.apiKey ?? '').slice(0, 8)}... (省略)`);
})().catch((err) => {
  console.error('❌', err.message);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
