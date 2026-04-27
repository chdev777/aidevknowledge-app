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
if (!getApps().length) initializeApp({ projectId });

const auth = getAuth();
const db = getFirestore();

// =================== USERS ===================
interface SeedUser {
  uid: string;
  email: string;
  password: string;
  name: string;
  handle: string;
  role: 'DX推進' | '情報支援' | '管理者';
  color: string;
}
const USERS: SeedUser[] = [
  { uid: 'u1', email: 'sato.k@example.ac.jp', password: 'testtest', name: '佐藤 健一', handle: 'sato.k', role: 'DX推進', color: '#b08968' },
  { uid: 'u2', email: 'matsuoka.m@example.ac.jp', password: 'testtest', name: '松岡 真理', handle: 'matsuoka.m', role: '情報支援', color: '#7a8b6f' },
  { uid: 'u3', email: 'kimura.r@example.ac.jp', password: 'testtest', name: '木村 亮介', handle: 'kimura.r', role: 'DX推進', color: '#6b7a99' },
];

// =================== TAGS / PROJECTS ===================
const TAGS = [
  ['t1', 'RAG', '技術'], ['t2', 'ベクトルDB', '技術'], ['t3', 'Function Calling', '技術'],
  ['t4', 'Agents', '技術'], ['t5', 'OCR', '技術'],
  ['t6', 'Dify', 'ツール'], ['t7', 'LangChain', 'ツール'], ['t8', 'LlamaIndex', 'ツール'],
  ['t9', 'OpenAI API', 'ツール'], ['t10', 'Claude', 'ツール'], ['t11', 'Gemini', 'ツール'],
  ['t12', 'Next.js', '開発'], ['t13', 'Python', '開発'], ['t14', 'FastAPI', '開発'],
  ['t15', 'PostgreSQL', '開発'], ['t16', 'Docker', '開発'],
  ['t17', 'FAQ検索', '用途'], ['t18', '議事録要約', '用途'], ['t19', '文書検索', '用途'],
  ['t20', '研修資料', '用途'],
  ['t21', '個人情報', 'セキュリティ'], ['t22', '認証', 'セキュリティ'],
  ['t23', 'プロンプトインジェクション', 'セキュリティ'],
] as const;

const PROJECTS = [
  ['p1', '学内FAQ検索アプリ', '学内規程・手続きに関する問合せを自動応答', '#b08968', '利用中', 'u1'],
  ['p2', '議事録要約アプリ', '会議音声から要点・決定事項・ToDoを抽出', '#7a8b6f', '検証中', 'u2'],
  ['p3', '問い合わせ分類AI', '入電内容を部署別に自動分類', '#6b7a99', '試作', 'u3'],
] as const;

// =================== LINKS ===================
const LINKS = [
  {
    id: 'l1', title: 'RAG設計の失敗例 ─ チャンクサイズと埋め込みの落とし穴',
    url: 'https://youtube.com/watch?v=example-rag-01', sourceType: 'YouTube', domain: 'youtube.com',
    summary: 'RAG実装でよくある5つの失敗パターンを実ログで解説。チャンク・オーバーラップの影響を定量検証。',
    userComment: 'うちのFAQ検索でチャンク512→256にしたら精度が下がった件、3章で同じ失敗例が出てくる。要視聴。',
    importance: '高', status: '検証済み', tags: ['RAG', 'FAQ検索'],
    createdBy: 'u1', visibility: 'shared',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  },
  {
    id: 'l2', title: 'OpenAI Function Calling 実装パターン集',
    url: 'https://github.com/example/openai-function-calling', sourceType: 'GitHub', domain: 'github.com',
    summary: 'Function Calling を業務 API に組み込むときの典型パターン6種。',
    userComment: '問い合わせ分類AIで使えそう。エラーハンドリングが参考になる。',
    importance: '中', status: '採用候補', tags: ['Function Calling', 'OpenAI API'],
    createdBy: 'u2', visibility: 'shared',
  },
  {
    id: 'l3', title: 'Dify で社内FAQ を組む手順',
    url: 'https://qiita.com/example/dify-faq', sourceType: '記事', domain: 'qiita.com',
    summary: 'Dify ローカルセットアップから KnowledgeBase 投入まで。',
    userComment: 'Dify を社内に置くなら参考になる。要件は今すぐ満たせる。',
    importance: '高', status: '検証中', tags: ['Dify', 'FAQ検索'],
    createdBy: 'u3', visibility: 'shared',
  },
  {
    id: 'l4', title: 'プロンプトインジェクション対策まとめ',
    url: 'https://example.com/security/prompt-injection', sourceType: '記事', domain: 'example.com',
    summary: '入力サニタイズとシステムプロンプト分離の実務的な対策。',
    userComment: '本番運用前に必読。',
    importance: '高', status: '未確認', tags: ['プロンプトインジェクション', 'セキュリティ'.replace('セキュリティ', '認証')],
    createdBy: 'u1', visibility: 'private', // 自分用メモ
  },
  {
    id: 'l5', title: 'LangChain v0.2 の API 変更点',
    url: 'https://x.com/example/status/123', sourceType: 'X', domain: 'x.com',
    summary: 'LangChain v0.2 のメジャー変更点5つ。',
    userComment: '既存実装の影響調査が必要。',
    importance: '中', status: '確認中', tags: ['LangChain'],
    createdBy: 'u2', visibility: 'shared',
  },
];

// =================== QUESTIONS ===================
const QUESTIONS = [
  {
    id: 'q1', title: 'PDF内の表データをRAGで扱う方法は？',
    body: 'PDFの表が崩れて埋め込まれてしまう。tabula や camelot は試したが精度が出ない。実務でうまくいったやり方があれば教えてほしい。',
    status: '未回答', tags: ['RAG', 'OCR'], createdBy: 'u1', visibility: 'shared', answerCount: 0,
  },
  {
    id: 'q2', title: 'DifyとLangChainの使い分けは？',
    body: 'Dify は早く立ち上がるが、複雑な分岐が必要なときは LangChain か。境界をどう引くべきか。',
    status: '回答中', tags: ['Dify', 'LangChain'], createdBy: 'u2', visibility: 'shared', answerCount: 1,
  },
  {
    id: 'q3', title: 'YouTube動画を要約してナレッジ化したい',
    body: '研修動画を 1 時間ごとに 5 分のサマリにできないか。字幕→要約のパイプラインで OK か。',
    status: '解決済み', tags: ['議事録要約'], createdBy: 'u3', visibility: 'shared', answerCount: 2,
    acceptedAnswerId: 'a3-1',
  },
];

const ANSWERS: { qid: string; aid: string; body: string; createdBy: string; votes: number; accepted: boolean }[] = [
  { qid: 'q2', aid: 'a2-1', body: 'Dify はノーコード GUI でユーザー編集ができる。LangChain は分岐・状態管理が必要なとき。', createdBy: 'u1', votes: 3, accepted: false },
  { qid: 'q3', aid: 'a3-1', body: 'whisper.cpp で字幕→GPT-4o で要約。プロンプトに「決定事項」「ToDo」項目を強制すると拾えます。', createdBy: 'u2', votes: 5, accepted: true },
  { qid: 'q3', aid: 'a3-2', body: 'YouTube oEmbed で動画タイトルだけ取って、本文要約は別途生成APIに渡すパイプラインで動きました。', createdBy: 'u1', votes: 2, accepted: false },
];

// =================== NOTES ===================
const NOTES = [
  {
    id: 'n1', title: 'DifyでFAQ検索アプリを試作',
    purpose: '学内規程の問合せを Dify で自動応答できるか確認',
    tried: 'Dify v0.7 をローカル Docker で起動。学則PDFを KnowledgeBase に投入。GPT-4o-mini で回答生成。',
    result: '上位3件の引用は妥当。ただし複数規程にまたがる質問では混ざる。',
    conclusion: 'チャンク戦略を再設計すれば本採用可能。次は recursive splitter を試す。',
    tags: ['Dify', 'FAQ検索'], links: ['l3'], createdBy: 'u3', visibility: 'shared',
  },
  {
    id: 'n2', title: '議事録要約のプロンプト比較',
    purpose: '同じ議事録に対し3種のプロンプトの差を測る',
    tried: 'A: 単純要約 / B: 決定事項+ToDo抽出 / C: 役割別整理 を 5 件で評価。',
    result: 'B が最も実用的。決定事項抜けが半減。',
    conclusion: '本採用。テンプレを社内 wiki に登録。',
    tags: ['議事録要約'], links: [], createdBy: 'u2', visibility: 'shared',
  },
  {
    id: 'n3', title: '個人検証: Claude Sonnet vs GPT-4o の日本語精度',
    purpose: '社内文書の翻訳精度比較',
    tried: '社内議事録10件を両方で翻訳して校正者がスコア', result: '両者同等。Claudeは敬語が安定。',
    conclusion: '個人検証メモ', tags: ['Claude', 'OpenAI API'], links: [],
    createdBy: 'u1', visibility: 'private',
  },
];

// =================== APPS ===================
const APPS = [
  {
    id: 'app1', name: '議事録要約アプリ',
    url: 'https://meeting-summary.example.ac.jp', summary: '会議音声から要点と ToDo を自動抽出',
    purpose: '議事録作成の手作業時間を削減', technologies: ['Next.js', 'Python', 'whisper.cpp'],
    aiModel: 'GPT-4o', usageScope: 'グループ内', status: '検証中',
    caution: '個人情報を含む録音はアップロードしないでください。30日で自動削除。',
    tags: ['議事録要約'], createdBy: 'u2', visibility: 'shared',
  },
  {
    id: 'app2', name: 'FAQ検索アプリ',
    url: 'https://faq-search.example.ac.jp', summary: '学則・規程の問合せに自動応答',
    purpose: '事務窓口の問合せ対応工数削減', technologies: ['Dify', 'PostgreSQL'],
    aiModel: 'Claude 3.5 Sonnet', usageScope: '関係者限定', status: '改善中',
    caution: '回答は参考情報。正式回答は事務窓口で確認してください。',
    tags: ['FAQ検索', 'Dify'], createdBy: 'u3', visibility: 'shared',
  },
  {
    id: 'app3', name: '問い合わせ分類AI',
    url: 'https://classify.example.ac.jp', summary: '入電内容を部署別に自動分類',
    purpose: '電話対応のルーティング自動化', technologies: ['Python', 'FastAPI'],
    aiModel: 'GPT-4o-mini', usageScope: '個人検証', status: '試作',
    caution: '誤分類率は約 8%。人による確認を併用してください。',
    tags: ['Function Calling'], createdBy: 'u1', visibility: 'shared',
  },
];

// =================== COMMENTS ===================
const COMMENTS: {
  id: string; targetType: 'link'|'question'|'note'|'app';
  targetId: string; targetVisibility: 'private'|'shared';
  type: '感想'|'改善提案'|'不具合報告'|'活用アイデア'|'技術メモ'|'セキュリティ指摘';
  body: string; createdBy: string;
}[] = [
  { id: 'c1', targetType: 'app', targetId: 'app1', targetVisibility: 'shared', type: '感想', body: '会議後すぐ ToDo が出てきて便利。', createdBy: 'u1' },
  { id: 'c2', targetType: 'app', targetId: 'app1', targetVisibility: 'shared', type: '改善提案', body: '発言者ラベルを付けると検索がしやすくなりそう。', createdBy: 'u3' },
  { id: 'c3', targetType: 'app', targetId: 'app2', targetVisibility: 'shared', type: 'セキュリティ指摘', body: '個人情報を含む問合せが入った場合のマスキングを検討してください。', createdBy: 'u2' },
  { id: 'c4', targetType: 'link', targetId: 'l1', targetVisibility: 'shared', type: '技術メモ', body: 'チャンク 512、オーバーラップ 64 で再現実験予定。', createdBy: 'u2' },
  { id: 'c5', targetType: 'note', targetId: 'n1', targetVisibility: 'shared', type: '活用アイデア', body: '研修資料検索にも転用できそう。', createdBy: 'u1' },
  { id: 'c6', targetType: 'app', targetId: 'app3', targetVisibility: 'shared', type: '不具合報告', body: 'まれに「経理」と「総務」が逆になることがある。', createdBy: 'u3' },
];

// =================== INSERT ===================
async function seedUsers() {
  console.log('[seed] users');
  for (const u of USERS) {
    await auth.deleteUser(u.uid).catch(() => {});
    await auth.createUser({
      uid: u.uid, email: u.email, password: u.password,
      displayName: u.name, emailVerified: true,
    });
    await db.doc(`users/${u.uid}`).set({
      name: u.name, handle: u.handle, role: u.role, color: u.color,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    await db.doc(`users/${u.uid}/private/profile`).set({
      email: u.email, createdAt: FieldValue.serverTimestamp(),
    });
    await db.doc(`handles/${u.handle}`).set({
      uid: u.uid, createdAt: FieldValue.serverTimestamp(),
    });
  }
}

async function seedSimple() {
  console.log('[seed] tags');
  let batch = db.batch();
  for (const [id, name, type] of TAGS) batch.set(db.doc(`tags/${id}`), { name, type });
  await batch.commit();

  console.log('[seed] projects');
  batch = db.batch();
  for (const [id, name, description, color, status, owner] of PROJECTS) {
    batch.set(db.doc(`projects/${id}`), { name, description, color, status, owner });
  }
  await batch.commit();
}

async function seedLinks() {
  console.log('[seed] links');
  for (const l of LINKS) {
    await db.doc(`links/${l.id}`).set({
      ...l,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function seedQuestions() {
  console.log('[seed] questions + answers');
  for (const q of QUESTIONS) {
    await db.doc(`questions/${q.id}`).set({
      ...q,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  for (const a of ANSWERS) {
    await db.doc(`questions/${a.qid}/answers/${a.aid}`).set({
      body: a.body, createdBy: a.createdBy, votes: a.votes, accepted: a.accepted,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function seedNotes() {
  console.log('[seed] notes');
  for (const n of NOTES) {
    await db.doc(`notes/${n.id}`).set({
      ...n, attachments: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function seedApps() {
  console.log('[seed] apps');
  for (const a of APPS) {
    await db.doc(`apps/${a.id}`).set({
      ...a,
      stats: { views: 0, comments: 0, likes: 0 },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function seedComments() {
  console.log('[seed] comments');
  for (const c of COMMENTS) {
    await db.doc(`comments/${c.id}`).set({
      ...c,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

async function main() {
  await seedUsers();
  await seedSimple();
  await seedLinks();
  await seedQuestions();
  await seedNotes();
  await seedApps();
  await seedComments();
  console.log('[seed] done');
  console.log(`  users: ${USERS.length}, tags: ${TAGS.length}, projects: ${PROJECTS.length}`);
  console.log(`  links: ${LINKS.length}, questions: ${QUESTIONS.length}, answers: ${ANSWERS.length}`);
  console.log(`  notes: ${NOTES.length}, apps: ${APPS.length}, comments: ${COMMENTS.length}`);
}

main().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
