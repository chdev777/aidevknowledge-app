# アーキテクチャ

## 概要

AIアプリ開発ナレッジ共有Webアプリ。**ローカルDocker のフルスタック PoC** と **Firebase Blaze 本番** の2構成を、環境変数と Storage Provider 切替だけで切り替えられるよう設計している。

## レイヤ別構成

| レイヤ | PoC（Docker） | 本番（Firebase Blaze） |
|---|---|---|
| フロントエンド | Vite + React 18 + TypeScript SPA | 同左（静的ビルド） |
| ホスティング | Vite dev :3000 | Firebase Hosting + CSP/security headers |
| 認証 | Firebase Auth Emulator :9099 | Firebase Auth + Identity Platform |
| DB | Firestore Emulator :8080 | Firestore（強化Rules + indexes） |
| ストレージ | MinIO :9000（S3互換） | Firebase Storage + Storage Rules + App Check |
| OG/サムネ取得 | Express プロキシ :8787 | Cloud Functions (HTTPS callable) |
| 集計フィールド | クライアント `increment()`（PoCのみ） | Cloud Functions トリガー |
| 監視 | なし | Cloud Logging / 予算超過自動停止Function |

## ディレクトリ構造

```
src/
├─ App.tsx                       BrowserRouter + AuthProvider + QueryClient + ErrorBoundary
├─ main.tsx                      エントリ
├─ globals.css                   プロトタイプの styles.css をそのまま移植
├─ extra.css                     プロトタイプに無いUIの追加CSS（auth/topbar/empty-state ほか）
├─ pages/                        ルート単位のページコンポーネント
│   ├─ LoginPage / SignupPage / ResetPasswordPage
│   ├─ HomePage / MyPage / Forbidden / NotFound
│   └─ links/, qa/, notes/, apps/   一覧 + 詳細
├─ components/
│   ├─ shell/                    Sidebar, Topbar, Avatar, AppShell, RequireAuth
│   ├─ shared/                   Spinner, EmptyState, ErrorBoundary, ConfirmDialog,
│   │                            Markdown, Tag, StatusBadge, VisibilityBadge
│   ├─ home/                     QuickActions, KnowledgeFlow, RecentLinks, UnansweredQs,
│   │                            RecentNotes, RecentApps, Metrics
│   ├─ comments/                 CommentList, CommentItem, CommentComposer, CommentTypeBadge
│   ├─ compose/                  ComposeModal + 4種フォーム + TagInput, VisibilityRadio, useDraft
│   └─ me/                       TabBar, MetricsRow, VisibilityToggle
├─ lib/
│   ├─ firebase/                 client (emulator接続), auth-context, bootstrap-user
│   ├─ db/                       converters + 各エンティティのCRUD（visibility-aware）
│   ├─ storage/                  StorageProvider 抽象 + minio-provider + firebase-provider
│   ├─ schemas/                  zod スキーマ（フォーム入力検証）
│   └─ utils/                    log（PIIマスク）, error（AppError）, url（XSS安全）, og, search
├─ types/                        ドメインモデル（Visibility, Link, Question, Note, AiApp, ...）
└─ test/
    ├─ rules/                    @firebase/rules-unit-testing 30+ ケース
    └─ unit/                     url-detect / schemas / search のVitest
```

## データフロー

```
Browser
  │ Firebase Web SDK
  ├──▶ Auth (verifyIdToken on og-proxy)
  ├──▶ Firestore (visibility-aware Rules)
  ├──▶ og-proxy /api/og?url=        OG/サムネ取得（SSRF guard）
  └──▶ og-proxy /api/storage/sign   署名付き PUT/GET URL
                              │
                              ▼ AWS SigV4
                            MinIO (PoC)
                          / Firebase Storage (本番、SDK直)
```

**重要：MinIO のシークレットは og-proxy のサーバ環境変数のみ。** SPA に `VITE_*` で渡すと
ビルド成果物に埋め込まれて漏洩する。本番でも同じ癖を持ち込まないため、PoC 段階から
分離している。

## 状態管理ポリシー

| 場面 | 戦略 |
|---|---|
| 一覧表示・フィルタ・ページング | TanStack Query + `getDocs` |
| 検索 | `useQuery` で全件 → `useMemo` でクライアント側 filter |
| 詳細・コメントフィード（即時反映必要） | `onSnapshot`（Step 11+ で導入予定、MVPでは Query invalidate でも十分） |
| ホーム集約 | TanStack Query 一本（staleTime 60秒、再取得で十分） |
| カウントバッジ | `getCountFromServer` + 5分キャッシュ（quota 節約） |

## エラーハンドリング

- ルートレベル `<ErrorBoundary>` で白画面化を防止
- `lib/utils/error.ts` の `toAppError()` が Firebase errorCode をユーザー向けメッセージに翻訳
- `lib/utils/log.ts` の logger が PII（メール・パスワード・トークン）を自動マスク

## 認証フロー

```
SignupPage
  │
  ├─ bootstrapUser()
  │    1. handles/{handle} 重複チェック (read)
  │    2. createUserWithEmailAndPassword
  │    3. updateProfile(displayName)
  │    4. transaction: handles/{handle} + users/{uid}
  │    5. setDoc users/{uid}/private/profile (email)
  │    6. sendEmailVerification (任意)
  │    失敗時はAuthアカウントを削除してロールバック
  │
  ▼
RequireAuth (4状態：loading | authed | unauthed | profileMissing)
  │
  ▼
AppShell (Sidebar + Topbar + Outlet + ComposeModal)
```

## 公開状態モデル

すべての投稿系コレクションに `visibility: 'private' | 'shared'`。

- 一覧クエリは `where('visibility','==','shared')`
- マイページクエリは `where('createdBy','==',uid)`（自分の private 含む）
- 詳細ページは Firestore Rules が allow read を判定
- コメントは親docのvisibilityを `targetVisibility` フィールドに非正規化保持
  （Rules 内で `get()` を呼ばずに済むためコスト削減）

## PoC ↔ 本番の差分

切り替え対象は **環境変数 + Provider** だけ。

```
VITE_USE_EMULATOR=1 → 0
VITE_STORAGE_PROVIDER=minio → firebase
+ Cloud Functions のデプロイ（OG fetcher / 集計 / blocking trigger / billing stop）
+ App Check / Identity Platform / reCAPTCHA Enterprise の有効化
```

詳細は [blaze-migration.md](./blaze-migration.md)。

## 関連ドキュメント

- [data-model.md](./data-model.md) — Firestore スキーマと Rules 全文
- [security.md](./security.md) — 防衛戦略・OWASP対応
- [scope.md](./scope.md) — MVP/Phase 2/Phase 3 の線引き
- [ui-design.md](./ui-design.md) — デザイントークン・命名規約
- [blaze-migration.md](./blaze-migration.md) — 本番化手順
- [review-findings.md](./review-findings.md) — 設計時の3エージェントレビュー
- [adr/](./adr/) — 技術選定の根拠（ADR）
