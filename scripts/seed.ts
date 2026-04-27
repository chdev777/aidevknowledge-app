/**
 * Firestore Emulator + Auth Emulator にシードデータを投入する
 *
 * 実行: docker compose exec app pnpm seed
 *
 * 安全装置：
 * - env-guard で emulator 専用環境を強制
 * - 本番Firestore に誤接続することはできない
 */
import { ensureEmulatorOnly } from './env-guard.js';
ensureEmulatorOnly();

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const projectId = process.env['GCLOUD_PROJECT'] ?? 'aidev-knowledge-dev';

if (!getApps().length) {
  // emulator では credential 不要
  initializeApp({ projectId });
}

const auth = getAuth();
const db = getFirestore();

interface SeedUser {
  uid: string;
  email: string;
  password: string;
  name: string;
  handle: string;
  role: 'DX推進' | '情報支援' | '管理者';
  color: string;
}

const SEED_USERS: SeedUser[] = [
  {
    uid: 'u1',
    email: 'sato.k@example.ac.jp',
    password: 'testtest',
    name: '佐藤 健一',
    handle: 'sato.k',
    role: 'DX推進',
    color: '#b08968',
  },
  {
    uid: 'u2',
    email: 'matsuoka.m@example.ac.jp',
    password: 'testtest',
    name: '松岡 真理',
    handle: 'matsuoka.m',
    role: '情報支援',
    color: '#7a8b6f',
  },
  {
    uid: 'u3',
    email: 'kimura.r@example.ac.jp',
    password: 'testtest',
    name: '木村 亮介',
    handle: 'kimura.r',
    role: 'DX推進',
    color: '#6b7a99',
  },
];

const SEED_TAGS = [
  { id: 't1', name: 'RAG', type: '技術' },
  { id: 't2', name: 'ベクトルDB', type: '技術' },
  { id: 't3', name: 'Function Calling', type: '技術' },
  { id: 't4', name: 'Agents', type: '技術' },
  { id: 't5', name: 'OCR', type: '技術' },
  { id: 't6', name: 'Dify', type: 'ツール' },
  { id: 't7', name: 'LangChain', type: 'ツール' },
  { id: 't8', name: 'LlamaIndex', type: 'ツール' },
  { id: 't9', name: 'OpenAI API', type: 'ツール' },
  { id: 't10', name: 'Claude', type: 'ツール' },
  { id: 't11', name: 'Gemini', type: 'ツール' },
  { id: 't12', name: 'Next.js', type: '開発' },
  { id: 't13', name: 'Python', type: '開発' },
  { id: 't14', name: 'FastAPI', type: '開発' },
  { id: 't15', name: 'PostgreSQL', type: '開発' },
  { id: 't16', name: 'Docker', type: '開発' },
  { id: 't17', name: 'FAQ検索', type: '用途' },
  { id: 't18', name: '議事録要約', type: '用途' },
  { id: 't19', name: '文書検索', type: '用途' },
  { id: 't20', name: '研修資料', type: '用途' },
  { id: 't21', name: '個人情報', type: 'セキュリティ' },
  { id: 't22', name: '認証', type: 'セキュリティ' },
  { id: 't23', name: 'プロンプトインジェクション', type: 'セキュリティ' },
];

const SEED_PROJECTS = [
  {
    id: 'p1',
    name: '学内FAQ検索アプリ',
    description: '学内規程・手続きに関する問合せを自動応答',
    color: '#b08968',
    status: '利用中',
    owner: 'u1',
  },
  {
    id: 'p2',
    name: '議事録要約アプリ',
    description: '会議音声から要点・決定事項・ToDoを抽出',
    color: '#7a8b6f',
    status: '検証中',
    owner: 'u2',
  },
  {
    id: 'p3',
    name: '問い合わせ分類AI',
    description: '入電内容を部署別に自動分類',
    color: '#6b7a99',
    status: '試作',
    owner: 'u3',
  },
];

async function seedUsers() {
  console.log('[seed] users');
  for (const u of SEED_USERS) {
    try {
      await auth.deleteUser(u.uid).catch(() => {});
      await auth.createUser({
        uid: u.uid,
        email: u.email,
        password: u.password,
        displayName: u.name,
        emailVerified: true,
      });
    } catch (err) {
      console.error('[seed] auth failed', u.uid, err);
    }

    // public profile
    await db.doc(`users/${u.uid}`).set({
      name: u.name,
      handle: u.handle,
      role: u.role,
      color: u.color,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // private profile
    await db.doc(`users/${u.uid}/private/profile`).set({
      email: u.email,
      createdAt: FieldValue.serverTimestamp(),
    });

    // handle ロック
    await db.doc(`handles/${u.handle}`).set({
      uid: u.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}

async function seedTags() {
  console.log('[seed] tags');
  const batch = db.batch();
  for (const tag of SEED_TAGS) {
    batch.set(db.doc(`tags/${tag.id}`), { name: tag.name, type: tag.type });
  }
  await batch.commit();
}

async function seedProjects() {
  console.log('[seed] projects');
  const batch = db.batch();
  for (const p of SEED_PROJECTS) {
    batch.set(db.doc(`projects/${p.id}`), p);
  }
  await batch.commit();
}

async function main() {
  await seedUsers();
  await seedTags();
  await seedProjects();
  console.log('[seed] done — users / tags / projects');
  console.log(
    '[seed] Step 10 で URL/Q&A/検証メモ/作成アプリ/コメントの seed を追加します',
  );
}

main().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
