# セッション引き継ぎノート

> 最終更新: 2026-04-27（Auto Mode による1セッション通し実装）
> 引き継ぎ対象: AIアプリ開発ナレッジ共有ハブ MVP（PoC: ローカルDocker / 本番想定: Firebase Blaze）

---

## 今回やったこと

### 0. デザインバンドルの取得と理解
- Claude Design (`claude.ai/design`) の handoff URL から gzip tar をダウンロード・展開
- README / chat ログ / 要件定義書 / マイページ仕様 / HTML プロトタイプ（React + Babel standalone）を読解
- `design-reference/` に原本を保管（`source-bundle.tar.gz` 込み、編集禁止）

### 1. プラン策定（3エージェント並列レビュー）
- 計画書 `~/.claude/plans/fetch-this-design-file-keen-chipmunk.md` 作成
- architect / security-reviewer / planner の3視点でレビュー
- CRITICAL+HIGH+MEDIUM 全指摘を計画書に反映、レビュー結果は `docs/review-findings.md` に保存

### 2. 実装（プラン Step 0a〜12 を全19ステップ完了、10コミット）
- **基盤**: Vite + React 18 + TS SPA、Docker（app / firebase-emulator / MinIO / og-proxy / minio-init）
- **Firestore Rules**: 強化版＋ 30+ ケースのRules unit test
  - visibility-aware read、`createdBy`/`role`/`createdAt`/`handle` 改ざん防止
  - comments の親 visibility を `targetVisibility` 非正規化保持
  - answers の3パターン update（投稿者編集 / 質問者の accepted / 投票±1）
- **認証**: Firebase Auth（メール/パスワード）、`bootstrapUser()` で users + handles + private profile を順序保証作成、role 自己申告は `['DX推進','情報支援']` のみ
- **画面**: ホーム / URL共有 / Q&A（採用・投票）/ 検証メモ / 作成アプリ / マイページ（5タブ）/ 認証3画面
- **共通**: ErrorBoundary、logger（PIIマスク）、AppError、ConfirmDialog、ComposeModal（URLクエリ駆動、4種フォーム + localStorage 下書き）
- **Storage 抽象化**: `prepareUpload`/`upload`/`getDownloadUrl`/`delete` の Provider インターフェース、PoC は MinIO（og-proxy 署名）、本番は Firebase Storage 直
- **og-proxy**: Express + cheerio + undici、SSRF対策（プライベートIP拒否）、Auth IDトークン検証、レート制限60/分
- **検索 / タグ / 下書き**: client-side filter（NFKC + ひらがな↔カタカナ + AND）、自由入力タグ（最大10/各32字）、localStorage 自動保存（500ms debounce）
- **テスト**: unit（url-detect / schemas / search）+ rules（30+ ケース）
- **ドキュメント**: README / docs/{architecture, data-model, security, scope, ui-design, review-findings} / docs/runbooks/{dev-setup, deploy} / docs/decisions/{0001,0002,0003}

### 3. ポート競合対策
- 既存 `allplan_claude` プロジェクトがホスト +100（3100/4100/8180/9199）を使用中
- 共存と将来余地のため本プロジェクトは **+200 シフト**（3200/4200/8280/9299/8987/9201）
- コンテナ内部ポートはデフォルトのまま、ホスト側マッピングのみ変更

---

## 決定事項

### 技術スタック
- **フロントエンド**: Vite + React 18 + TypeScript（pnpm 9.12）、SPA、SSR なし
- **DB**: Firestore（PoC は Emulator、本番は本物。スキーマ移行不要）
- **認証**: Firebase Auth（PoC は Emulator、本番は Identity Platform + reCAPTCHA Enterprise）
- **ストレージ**: PoC は MinIO（og-proxy 経由の署名URL）、本番は Firebase Storage（直 SDK + Storage Rules + App Check）
- **OG/サムネ取得**: PoC は dev用 Express プロキシ（Docker内 og-proxy）、本番は Cloud Functions に同ロジック移植
- **ホスティング**: Firebase Hosting（CSP / X-Frame-Options / HSTS / Permissions-Policy 設定済み）

### スコープ（MVP）
- 認証 / 公開状態管理（**private / shared の2段階**）/ 検索（タイトル部分一致）/ タグ自由入力 / 採用回答 + 投票±1 / 下書き自動保存 / アバターアップロード
- マイページは7タブ中**5タブ**実装（自分のURL / 質問 / メモ / アプリ / コメント履歴）。お気に入り・下書きはプレースホルダ
- 後回し: プロジェクト機能 UI / タグマスタ管理 / 管理画面 / Cloud Functions（集計・OG・blocking trigger）/ App Check / E2E

### 設計ルール（破ってはいけない原則）
- **MinIO のシークレットは SPA に渡さない**（`VITE_*` で渡すとビルド成果物に埋め込まれる）。og-proxy のサーバ環境変数のみで保持し、SPA は署名URL経由でアクセス
- **`createdBy` / `createdAt` は update 不可**、`role` / `handle` も自己改変不可。Rules で `immutableOnUpdate()` を強制
- **管理者ロールは招待のみ**（自己申告サインアップは `['DX推進','情報支援']` のみ）
- **comments は親docの visibility を `targetVisibility` に非正規化保持**（Rules の `get()` コスト回避、要件書 §8 の「非公開に戻すと過去コメントも見えなくなる」と整合）
- **本番 Blaze の課金事故対策**: 予算アラート3段（$1/$5/$20）+ Cloud Functions による自動停止 + Storage Rules + maxInstances + App Check
- **プロトタイプ CSS（`globals.css`）は編集禁止**、追加は `extra.css` に集約
- **`design-reference/` は実装の正、編集禁止**

### Docker ホスト公開ポート（+200 シフト）
| サービス | ホスト | コンテナ内 |
|---|---|---|
| Vite SPA | **3200** | 3000 |
| Emulator UI | **4200** | 4000 |
| Firestore | **8280** | 8080 |
| Auth | **9299** | 9099 |
| og-proxy | **8987** | 8787 |
| MinIO Console | **9201** | 9001 |

### 状態管理ポリシー
- 一覧 / フィルタ / ページング → TanStack Query + `getDocs`
- 詳細・コメント・採用状態（即時反映が必要） → Phase 2 で `onSnapshot` 移行（MVP は invalidate でも実用上十分）
- ホーム集約 → staleTime 60秒の Query 一本
- カウントバッジ → `getCountFromServer` を staleTime 5分でキャッシュ

### コミット履歴の構造
1コミット = 1ステップ単位で粒度を保ち、コミットメッセージは `<type>(scope): <summary>` + 詳細本文。`Co-Authored-By:` は付けない（ユーザー設定）。

---

## 捨てた選択肢と理由

### Next.js 14 (App Router)
- **却下理由**: Firebase Hosting は静的ホスティングで SSR を活かせず、App Hosting は Blaze プラン必須かつ新しい。middleware の Edge Runtime に firebase-admin が乗らない。サーバー用と SPA 用で2つの実行コンテキストを管理する複雑さに見合うメリットがない。内部ツールで SEO 不要なら SPA で十分。
- 検討内容: ADR 0001 に記録

### PostgreSQL + Prisma + Cloud SQL
- **却下理由**: 本番 Cloud SQL は月 $7+ の固定コスト（無料枠なし）。Firebase 統合のメリット（Auth/Storage/Hosting）が消える。PoC（Docker postgres）→ 本番（Cloud SQL）でホスト名と接続管理が複雑化。Firestore は無料枠が大きく社内10〜50人なら $0 で済む見込み。全文検索の弱さは Phase 3 で Algolia/Typesense/Vertex AI Vector Search を検討してカバー。
- 検討内容: ADR 0002 に記録

### Firebase Spark プラン一本での運用
- **却下理由**: Cloud Functions が使えず OG 自動取得サーバーが立てられない。Firebase Storage が新規プロジェクトで Blaze 必須となり、画像アップロード機能が作れない。App Hosting も Blaze 必須で SSR 不可。PoC で機能を妥協すると、本番 Blaze 移行時に大改修が必要。「ローカル Docker で完結 + 本番は Blaze」のほうが PoC ↔ 本番の差分を環境変数 + Storage Provider 切替に絞れる。
- 検討内容: ADR 0003 に記録

### `VITE_MINIO_ACCESS_KEY` を SPA に渡す
- **却下理由**: `VITE_*` 環境変数はビルド成果物の JS にそのまま埋め込まれ、ブラウザ DevTools から閲覧可能。本番 `VITE_*` で同じ癖を持ち込むと Firebase Storage の鍵漏洩につながる致命的設計。og-proxy（Express）に署名 URL 発行サービスを併設し、シークレットはサーバー側のみで保持する設計に統一。

### 公開 CORS プロキシ（allorigins.win 等）で OG 取得
- **却下理由**: 第三者サービス依存・本番不可・不安定。dev用 Express プロキシ（半日で実装）の方がコード共通化でき、Cloud Functions への移植も容易。

### マイページの公開状態 4段階（private/shared/limited/archived）
- **却下理由**: 要件書 §2 自身が「最初はシンプルに private/shared の2段階で始めてもよい」と明記。MVP では2段階で十分。limited（プロジェクト関係者限定）と archived（公開停止）はプロジェクト機能の Phase 2 と合わせて拡張する。

### タグのマスタ管理画面 + `tags/{id}` 多対多
- **却下理由**: MVP の規模では自由入力 `tags: string[]` で運用可能。マスタ化はタグ名変更時の一括 update が必要で、Phase 2 で Cloud Functions と合わせて検討。MVP 段階では `tags` コレクションは seed 投入のみ。

### 集計フィールド（`answerCount` / `stats.likes` 等）の Cloud Functions 化
- **却下理由（MVPで遅らせた）**: Spark 制約下では Functions 不可。Blaze 移行後の Phase 2 でトリガー実装する前提。MVP では「社内利用前提でクライアント信頼」と `docs/security.md` に明記し、`firestore.rules` で許可するパターンを限定（`votes` は ±1、`accepted` は質問者のみ）して被害を抑制。

### React Router v7 / TanStack Query v4
- **却下理由**: v7 は2024年末リリースで `react-router-dom` 名称が `react-router` に変わるなど破壊的変更あり、今は v6 で固定。TanStack Query は v5 を採用（`cacheTime` → `gcTime`、`isLoading` → `isPending` の breaking change を最初から踏まえた実装）。

### Step 0 で docs を 7本 一気に作成
- **却下理由**: typical 過剰設計。Step 0b では README + local-dev + review-findings の3本だけ先に作成し、残りは Step 5 以降の実装と並行してインクリメンタルに肉付けする方針に変更。

### ホストポートをデフォルト（3000/4000/...）のまま使う
- **却下理由**: 既存 `allplan_claude` プロジェクトが +100 シフト（3100 等）で動作中。デフォルト未使用ではあるが、将来別プロジェクトとの衝突に備え本プロジェクトも +200 シフトに統一。コンテナ内部ポートはデフォルト維持で SDK 側コードに影響なし。

---

## 次セッションへの注意点

### まだ手をつけていない確認・実機検証
- `docker compose up -d` の実機動作確認（`pnpm install` の依存解決、emulator 起動、bucket 自動作成、og-proxy ヘルスチェック）
- TypeScript コンパイル（`pnpm lint` = `tsc --noEmit`）の通過確認
- Vitest 実行（`pnpm test` および `pnpm test:rules`）の通過確認
- ブラウザ動作確認（サインアップ → ログイン → 各画面 → 公開切替 → コメント投稿）
- ピクセルパーフェクト回帰（プロトタイプ HTML を並列表示し 1280px viewport で比較）

### 既知の留意点
- **Vite HMR + Docker(Windows)**: `usePolling: true` 設定済み、CPU 負荷高めなので不要時は `docker compose stop app`
- **Firestore Emulator export**: `docker compose down` の SIGTERM タイムアウトで失敗する可能性。`stop_grace_period: 30s` を設定済みだが、確実に保存したい場合は `docker compose exec firebase-emulator firebase emulators:export ./.emulator-data --force` を先に実行
- **`tools/scripts/seed.ts` 安全装置**: `env-guard.ts` が `FIRESTORE_EMULATOR_HOST` 未設定 / project id に "prod" を含む場合に abort
- **Auth Emulator の ID Token は本物と署名検証が異なる** → 本番 Cloud Functions 接続時に必ず staging Firebase プロジェクトでドライラン

### 本番 Blaze 移行時の必須作業
[`docs/runbooks/deploy.md`](docs/runbooks/deploy.md) の10ステップ全項目（予算アラート + 自動停止 Function、Identity Platform、blocking trigger、App Check、Storage Rules、API key restrictions、CSP、staging ドライラン）。

### コミット直近の状態
```
16efaf5 chore(docker): shift host ports +200 to avoid collision with allplan_claude
813b57d docs+test+seed: complete MVP with full sample data, unit tests, and docs
b0bf803 feat(mypage): profile + metrics + 5 tabs + visibility toggle
6e0b171 feat(qa+notes+apps): list and detail pages for remaining MVP entities
8f6babd feat(links+compose): URL sharing list, detail, and unified compose modal
dfede9f feat(home): implement dashboard with shared-only feeds
5f816c6 feat(auth+shell): wire Firebase Auth, routing, and app shell
1d4d556 feat(security): enforce strict Firestore Rules with full test coverage
972eace feat: add Firebase client, Storage abstraction, types, and seed scaffold
aff5a47 feat(docker): add PoC dev environment with og-proxy and MinIO
20ac92c chore: initial project setup with design reference and docs
```
