# セッション引き継ぎノート

> 最終更新: 2026-04-27 セッション 2（実機検証 → デザイン全面再構築 → Phase 2 完了）
> 引き継ぎ対象: AIアプリ開発ナレッジ共有ハブ MVP（PoC: ローカルDocker / 本番想定: Firebase Blaze）

---

## セッション 2（2026-04-27 後半）でやったこと

### 1. MVP 実機検証 + 発見した不具合の修正
HANDOVER.md セッション 1 で「未着手」だった検証項目を全て実行：
- Docker 起動 / `pnpm install` / lint / unit / rules / build / seed をすべて完走
- 検証で発覚した 7 件の不具合を `fix(verify):` として 1 コミットに集約：
  - `docker-compose.yml` の minio タグが docker.io から削除されていた → `:latest`
  - `searchByFields` のジェネリック制約が厳しすぎてドメイン型と噛み合わない
  - `MyPage.tsx` の uid 未定義時の型エラー（4 箇所）
  - `tagsSchema` が空文字を validate 前に reject（要件「空除去」と矛盾）
  - rules テストの emulator host がハードコード（Docker 内では到達できない）
  - vitest `--dir` フラグが include パターンと両立しない
  - rules テストの並列実行が `clearFirestore()` でレース → `--no-file-parallelism`
- `tsconfig.json` に `noEmit: true` を追加（`tsc -b` で `.js` が emit されていた問題）

### 2. Vite HMR の極端遅延を解決
`server.watch.usePolling: true` + `interval: 500ms` が CPU を 58% 飽和させ、HTML 応答を
11〜13 秒ブロックしていた。
- 一旦 `usePolling` を OFF（HTML 応答 8ms に改善）→ HMR が動かない問題が顕在化
- 最終的に `usePolling: true, interval: 5000ms` + watch ignored を 10 件に拡大して両立
  （HMR 反映 0〜5 秒、HTML warm 10〜140ms、CPU 56%）
- `hmr.clientPort: 3200` を明示してホスト→コンテナのポート shift にも対応

### 3. デザイン全面再構築（プロトタイプとの大乖離を解消）
ユーザーから「特にトップ画面が当初イメージと全然違う」との指摘。
`design-reference/original-bundle/ai-web/project/screenshots/01〜10.png` を正本として
**ホーム / シェル / 一覧 4 / 詳細 4 / マイページを全面リライト**。

#### feat(home+shell): ホーム・シェル + Tweaks パネル
- **ホーム**: `home-hero` 2カラム（タイトル「流さない、**蓄積する**」+ 4 hero-action |
  metric-grid 4 セル + flow-diagram 4 ステップ）+ `home-grid` 2カラム
  （link-row / qa-row / app-row | note-row + project-row）
- **サイドバー**: ブランドマーク + 検索ボックス（⌘K）+ 3 セクション
  （ワークスペース / 整理 / あなた）+ 下部 Avatar
- **トップバー**: パンくず + 再読込 / +検証メモ / +URLを共有 / ログアウト
- **Tweaks パネル**（右下フローティング）: ライト/ダーク + アンバー/インディゴ/フォレスト
  + 標準/コンパクト。`localStorage` 永続化、`document.body.dataset` で適用
- 補助: SVG Icon コンポーネント、`timeAgo` / `sourceShort` ヘルパー

#### feat(pages): 一覧 / 詳細 / マイページを再構築
- 共通: `PageHeader`（page-eyebrow + title + sub + actions）/ `FilterBar`（chip 形式）
- 行: `LinkRow` / `QARow` / `NoteRow` / `AppRow` を `src/components/rows/` に切り出して
  ホーム・一覧・お気に入り・プロジェクト詳細で再利用
- 詳細: `detail-layout` 2カラム + `detail-aside` の aside-section 列
- マイページ: `me-header`（avatar 72px + 縦 3 ボタン）+ `me-stats` 5 セル + `me-tabs` 7 タブ
  + `vis-switch` + `me-row`
- `useUser` hook（TanStack Query で User キャッシュ）追加して avatar 表示を統一

### 4. Phase 2 完了: プロジェクト / タグ / お気に入り / 管理
これまで disabled だった整理セクションを実ページとして実装。
- **プロジェクト**: card grid + 詳細（紐づく link/qa/note/app をセクション別表示）
- **タグ**: type 別グルーピング、利用件数を集計表示
- **お気に入り**: `favorites/{uid}/items/{type_id}` サブコレクション + `FavoriteButton`
  を 4 つの詳細ページ aside に追加
- **管理**: design 通りプレースホルダ（profile.role === '管理者' でゲート）
- 新規 DB レイヤ: `projectsDb` / `tagsDb` / `favoritesDb`
- 既存 Firestore Rules（favorites / tags / projects）のテストは全件パス

### 5. ドキュメント整備
- `docs/runbooks/test-accounts.md` を新設（dev-setup 末尾から専用 runbook へ切り出し、
  各ユーザーの保有データ・動作確認シナリオも併記）
- README / CLAUDE.md からリンク追加

### 6. 細かいバグ修正
- `FavoritesPage`: TanStack Query v5 で `enabled:false` 時も `isPending:true` になる仕様
  により、お気に入り 0 件でスピナー無限ループ → `isFetching` 判定に変更
- `App.tsx` のルーティング: 詳細ページのパス（`notes:id` → `notes/:id` 等）の typo 修正

### 7. コミットメッセージ規約変更
ユーザーの指示で **commit message も日本語必須**（type prefix のみ英語維持）。
これに従い直近 2 コミットを `git reset --hard` + `cherry-pick --no-commit` で書き直し
（差分 0 ファイルで安全にメッセージのみ更新）。以降のコミットは全て日本語。
グローバルメモリ `feedback_japanese_required.md` に記録。

---

## セッション 1（MVP 初期実装）でやったこと

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

### 完了確認済み（セッション 2 で全部消化した項目）
- ✅ Docker stack 起動 + 各サービスのヘルスチェック
- ✅ TypeScript（`pnpm lint`）通過
- ✅ Unit テスト 43/43、Rules テスト 41/41
- ✅ Production ビルド成功（gzip 後 約 260KB）
- ✅ ブラウザ動作確認（サインアップ → ログイン → 各画面 → 公開切替 → お気に入り → コメント）
- ✅ design 全 9 画面（home / links / qa / notes / apps / projects / tags / favorites / mypage）のピクセル整合
- ✅ admin（10）はプレースホルダで設計通り
- ✅ Tweaks パネル（テーマ / アクセント / 情報密度）動作

### まだ手をつけていない作業
- **E2E テスト**: 主要フロー（サインアップ → 投稿 → コメント → 採用 → お気に入り → 公開切替）
  を Playwright で網羅。`tools/scripts/verify-list-pages.mjs` のような検証スクリプトはあるが
  E2E テストとして体系化されていない
- **本番 Blaze 移行**: `docs/runbooks/deploy.md` の 10 ステップは未実行。予算アラート設定 +
  Cloud Functions（OG/集計トリガー）の Cloud Functions 移植が要
- **Cloud Functions 集計**: `answerCount`/`stats.likes`/タグ件数 等は MVP ではクライアント
  集計。Phase 3 でトリガー化する想定（`docs/security.md` 参照）
- **管理画面の中身**: ユーザー一覧 / ロール変更 / タグマスタ管理 / 投稿モデレーション
- **マイページのお気に入りタブ・下書きタブ**: 現状 `disabled`（タブのみ実装、中身なし）

### 既知の留意点
- **Vite HMR**: `usePolling: true, interval: 5000ms`。バランス調整済みで保存後 0〜5 秒で
  反映。500ms に下げると CPU 飽和 + HTML 応答秒単位ブロックの副作用が出るので戻さないこと
- **TanStack Query v5 の `enabled:false` は `isPending:true`**: 条件付きフェッチで
  ロード判定する場合は `isFetching` を使う（FavoritesPage で踏んだ罠）
- **ホーム metric の delta 計算**: `(visibility, createdAt >=)` の range 集計は
  `getCountFromServer`。本番では `firestore.indexes.json` の既存 composite index で動くはず
  だが、staging で要確認
- **コミットメッセージは日本語必須**（type prefix のみ英語）。グローバルメモリにルール記録済
- **Firestore Emulator export**: `docker compose down` の SIGTERM タイムアウトで失敗する
  可能性。`stop_grace_period: 30s` 設定済みだが、確実に保存したい場合は手動 export を先に
- **`tools/scripts/seed.ts` 安全装置**: `env-guard.ts` が `FIRESTORE_EMULATOR_HOST` 未設定
  / project id に "prod" を含む場合に abort
- **Auth Emulator の ID Token は本物と署名検証が異なる** → 本番 Cloud Functions 接続時に
  必ず staging Firebase プロジェクトでドライラン

### テストアカウント
詳細は [docs/runbooks/test-accounts.md](docs/runbooks/test-accounts.md)。
全員パスワード `testtest`：
- `sato.k@example.ac.jp`（DX推進、private データあり）
- `matsuoka.m@example.ac.jp`（情報支援、採用済み回答 a3-1 の作者）
- `kimura.r@example.ac.jp`（DX推進、解決済み質問 q3 の作者）

### 本番 Blaze 移行時の必須作業
[`docs/runbooks/deploy.md`](docs/runbooks/deploy.md) の 10 ステップ全項目（予算アラート +
自動停止 Function、Identity Platform、blocking trigger、App Check、Storage Rules、
API key restrictions、CSP、staging ドライラン）。

### コミット直近の状態
```
c2d0edc fix(favorites): 0件時にスピナーが永久に回る問題を修正
18ce515 fix(vite): HMR が動かない問題を解決（polling 復活 + interval 緩和）
d7f896b feat(phase2): プロジェクト / タグ / お気に入り / 管理画面を実装
50e188b docs: テストアカウント一覧を専用 runbook に切り出し
2f538ff feat(pages): 一覧 / 詳細 / マイページを Claude Design に合わせて再構築
d32b304 feat(home+shell): ホーム・シェルを Claude Design に合わせて再構築 + Tweaks パネル追加
ac3d0cb fix(verify): resolve issues found during MVP runtime verification
9329196 chore(structure): reorganize into Claude Code best-practice layout
16efaf5 chore(docker): shift host ports +200 to avoid collision with allplan_claude
... (以下セッション 1 のコミット)
```

### 主要ファイル位置（セッション 2 で追加・大改修されたもの）
- `src/pages/HomePage.tsx` — 全面書き換え
- `src/pages/{links,qa,notes,apps}/{*Page,*DetailPage}.tsx` — 全面書き換え
- `src/pages/MyPage.tsx` — 全面書き換え
- `src/pages/{projects,tags,favorites,admin}/` — 新規（Phase 2）
- `src/components/rows/` — 新規（LinkRow / QARow / NoteRow / AppRow を切り出し）
- `src/components/shared/{PageHeader,FilterBar,Icon,FavoriteButton}.tsx` — 新規
- `src/components/shell/{Sidebar,Topbar,Avatar}.tsx` — 全面書き換え
- `src/components/tweaks/TweaksPanel.tsx` — 新規
- `src/components/home/HeroActions.tsx`、`RecentProjects.tsx` — 新規
- `src/components/home/QuickActions.tsx` — 削除（HeroActions に置換）
- `src/lib/db/{projects,tags,favorites}.ts` — 新規
- `src/lib/firebase/use-user.ts` — 新規
- `src/lib/utils/{time,source,tweaks}.ts` — 新規
- `src/extra.css` — Tweaks UI / ダーク / アクセント追加（+142 行）
- `vite.config.ts` — HMR polling バランス調整
- `docs/runbooks/test-accounts.md` — 新規
