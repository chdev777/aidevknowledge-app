# セッション引き継ぎノート

> 最終更新: 2026-04-27（セッション 2 通し）
> 引き継ぎ対象: AIアプリ開発ナレッジ共有ハブ MVP（PoC: ローカルDocker / 本番想定: Firebase Blaze）
> 直近コミット: `355b0af feat(link): 情報ソース別のブランドロゴアイコンを link-thumb に表示`

---

## 今回やったこと

### 1. MVP 実機検証 + 不具合の一掃
HANDOVER 前版で「未着手」だった検証項目を全消化：
- Docker 起動 / `pnpm install` / lint / unit / rules / build / seed をすべて完走
- 検証で発覚した不具合を `fix(verify):` 1 コミットに集約
  - `docker-compose.yml` の minio 固定タグが docker.io から削除されていた → `:latest`
  - `searchByFields` のジェネリック制約がドメイン型と噛み合わない
  - `MyPage.tsx` の uid 未定義時の型エラー
  - `tagsSchema` が空文字を validate 前に reject（要件「空除去」と矛盾）
  - rules テストの emulator host ハードコード → env 解決
  - vitest `--dir` フラグが include パターンと両立しない
  - rules テストの並列実行で `clearFirestore()` レース → `--no-file-parallelism`
- `tsconfig.json` に `noEmit: true`（`tsc -b` で `.js` が誤 emit される問題）

### 2. Vite HMR の極端遅延の解決と再調整
- `usePolling: true, interval: 500ms` が CPU を 58% 飽和、HTML 応答 11〜13 秒ブロック
- 一旦 polling OFF（HTML 応答 8ms に改善）→ HMR が動かない問題が顕在化
- 最終形: `usePolling: true, interval: 5000ms` + watch ignored 10 件 + `hmr.clientPort: 3200`
  - HMR 反映 0〜5 秒、HTML warm 10〜140ms、CPU 56%
  - Docker Desktop on Windows の bind mount は inotify が伝わらないので polling 必須

### 3. デザイン全面再構築（design-reference 完全準拠）
ユーザー指摘を受けて、ホーム / シェル / 一覧 4 / 詳細 4 / マイページを全面リライト。
- **ホーム + シェル + Tweaks パネル**（commit `d32b304`）
  - `home-hero` 2 カラム + `home-grid` 2 カラム
  - `Sidebar`: ブランドマーク + 検索 + 3 セクション（ワークスペース / 整理 / あなた）
  - `Topbar`: パンくず + 再読込 / +検証メモ / +URLを共有 / ログアウト
  - **Tweaks パネル**（右下フローティング ⚙）: テーマ / アクセント / 情報密度を切替、`localStorage` 永続化
  - `Icon` SVG セット、`timeAgo` / `sourceShort` ヘルパー新設
- **一覧 / 詳細 / マイページ**（commit `2f538ff`）
  - 共通: `PageHeader`（page-eyebrow + title + sub + actions） / `FilterBar`（chip 形式）
  - 行: `LinkRow` / `QARow` / `NoteRow` / `AppRow` を `src/components/rows/` に切り出し再利用
  - 詳細: `detail-layout` 2 カラム + `detail-aside`
  - マイページ: `me-header`（avatar 72px + 縦 3 ボタン）+ `me-stats` 5 セル + `me-tabs` 7 タブ + `vis-switch` + `me-row`

### 4. Phase 2 完了（プロジェクト / タグ / お気に入り / 管理）
（commit `d7f896b`）
- **プロジェクト**: card grid + 詳細（紐づく link/qa/note/app をセクション別表示）
- **タグ**: type 別グルーピング、利用件数を集計表示
- **お気に入り**: `favorites/{uid}/items/{type_id}` サブコレクション + 4 つの詳細ページに `FavoriteButton`
- **管理画面**: profile.role === '管理者' でゲートしたプレースホルダ
- 新規 DB レイヤ: `projectsDb` / `tagsDb` / `favoritesDb` / `useUser` hook

### 5. 投稿フローの細かい不具合を一掃
- **`fix(favorites)`** お気に入り 0 件で永遠スピナー → TanStack Query v5 の `enabled:false` でも `isPending:true` のまま、`isFetching` 判定に切替
- **`fix(og)`** X URL のメタ取得が空応答 → og-proxy で `publish.twitter.com/oembed` を先に叩くフォールバック追加。UA を Chrome 化、空応答や通信エラーをユーザーに通知
- **`fix(compose)`** Compose を開くと前回入力が暗黙復元 → `wasRestored` フラグと `DraftRestoredBanner`、「破棄して新規作成」ボタンを追加
- **`fix(compose)`** メタ取得後タイトルが入らない → `set()` 連続呼び出しのクロージャでキャプチャした `draft` 値の問題。`patch` を構築して 1 回だけ `setDraft({ ...draft, ...patch })`
- **`fix(firebase)`** X URL の登録で「操作に失敗」エラー → `thumbnailUrl: undefined` を Firestore SDK が拒否。`initializeFirestore(app, { ignoreUndefinedProperties: true })` に変更
- **`feat(link)`** サムネイル表示追加（フォーム 160x90 プレビュー + 詳細ページのヒーロー画像）
- **`feat(link)`** YouTube facade 再生（サムネクリックで `<iframe src="https://www.youtube-nocookie.com/embed/...">`、CSP に `frame-src` 追加）
- **`feat(link)`** 情報ソース別のブランドロゴアイコン（YouTube/GitHub/X/Qiita/Zenn/doc/book/globe）+ 薄ブランドカラー背景

### 6. ドキュメント整備 / 規約変更
- `docs/runbooks/test-accounts.md` を新設（README / CLAUDE.md からリンク）
- HANDOVER.md を 2 度更新（途中版 → 本コミットで全面刷新）
- **コミットメッセージは日本語必須**（type prefix のみ英語）。グローバルメモリ `feedback_japanese_required.md` に記録

---

## 決定事項

### 技術スタック / 環境
- **フロントエンド**: Vite + React 18 + TypeScript（pnpm 9.12 / Node 20+）
- **DB**: Firestore（PoC: Emulator / 本番: 本物。スキーマ移行不要）
- **認証**: Firebase Auth（PoC: Emulator / 本番: Identity Platform）
- **ストレージ**: PoC: MinIO + og-proxy 署名URL / 本番: Firebase Storage 直
- **ホスティング**: Firebase Hosting（CSP / X-Frame-Options / HSTS / Permissions-Policy 設定済）
- **OG/oEmbed**: dev は Express 自作 og-proxy / 本番は Cloud Functions に同ロジック移植
- **ホスト公開ポートはデフォルトから +200 シフト**（3200/4200/8280/8987/9201/9299）

### スコープ
- **MVP 範囲**: 認証 + private/shared 2 段階公開 + Q&A（採用 + 投票 ±1）+ タグ自由入力 + 下書き自動保存 + アバターアップロード + 5 主要画面 + 詳細 + マイページ
- **Phase 2 完了**: プロジェクト一覧/詳細、タグ一覧、お気に入り（CRUD + 詳細ページボタン）、管理画面プレースホルダ
- **Tweaks パネル**: テーマ（light/dark）/ アクセント（amber/indigo/forest）/ 情報密度（standard/compact）

### 設計ルール（破ってはいけない原則）
- **MinIO のシークレットは SPA に渡さない**（`VITE_*` で渡すと成果物に埋め込まれる）。og-proxy のサーバ環境変数のみで保持し、SPA は署名URL経由
- **`createdBy` / `createdAt` / `role` / `handle` は update 不可**。Rules の `immutableOnUpdate()` で強制
- **管理者ロールは招待のみ**。自己申告サインアップは `['DX推進','情報支援']` のみ
- **comments は親doc の visibility を `targetVisibility` に非正規化保持**（Rules `get()` コスト回避）
- **`design-reference/` と `src/globals.css` は編集禁止**。CSS追加は `src/extra.css` に集約
- **本番 Blaze の課金事故対策**: 予算アラート3段（$1/$5/$20）+ 自動停止 Function + Storage Rules + maxInstances + App Check
- **コミットメッセージは日本語必須**（type prefix のみ英語）

### 状態管理ポリシー
- 一覧 / フィルタ → TanStack Query + `getDocs`、staleTime 60秒
- 詳細・コメント・採用状態 → MVP は invalidate、Phase 2 で `onSnapshot` 移行
- カウントバッジ → `getCountFromServer` を staleTime 5 分でキャッシュ
- TanStack Query v5 の `enabled:false` 罠: ロード判定は `isFetching` を使う（`isPending` は永続 true）

### 投稿時のオプショナルフィールド
- Firestore は **`ignoreUndefinedProperties: true`** 設定済み（`src/lib/firebase/client.ts`）。
  これにより `thumbnailUrl` / `projectId` 等の undefined フィールドは自動省略される

### Vite 開発サーバ
- `usePolling: true, interval: 5000ms` + `hmr.clientPort: 3200`
- watch ignored は 10 件（node_modules / .git / .emulator-data / dist / .vite / design-reference / docker / .claude / .firebase / coverage）
- 500ms に下げると CPU 飽和して HTML 応答秒単位ブロック → 戻さない

### CSP（`firebase.json`）
- `img-src`: 'self' + i.ytimg.com + firebasestorage + googleusercontent + data:
- `frame-src`: youtube-nocookie.com + youtube.com（YouTube embed 用）
- 他: default-src 'self'、script-src 'self'、style-src 'self' + fonts.googleapis、connect-src 各 Firebase

### コミット履歴（最新 12 件）
```
355b0af feat(link): 情報ソース別のブランドロゴアイコンを link-thumb に表示
2b07d9a fix(firebase): undefined フィールドで write が失敗する問題を修正
1871972 feat(link): YouTube サムネクリックで埋め込み再生（facade パターン）
2d30cec feat(link): サムネイル取得後の表示を追加（フォーム + 詳細ページ）
f7c3075 fix(compose): メタ取得後にタイトルが反映されないクロージャバグを修正
03d8af4 fix(compose): 下書き復元時にバナーを表示し破棄ボタンを追加
dc70d92 fix(og): X URL のメタ取得対応 + エラー時の無反応を解消
c2d0edc fix(favorites): 0件時にスピナーが永久に回る問題を修正
18ce515 fix(vite): HMR が動かない問題を解決（polling 復活 + interval 緩和）
d7f896b feat(phase2): プロジェクト / タグ / お気に入り / 管理画面を実装
2f538ff feat(pages): 一覧 / 詳細 / マイページを Claude Design に合わせて再構築
d32b304 feat(home+shell): ホーム・シェルを Claude Design に合わせて再構築 + Tweaks パネル追加
```

---

## 捨てた選択肢と理由

### Vite `usePolling` を一律 OFF
HMR 即応 + CPU ゼロを狙ったが、**Docker Desktop on Windows の bind mount では inotify がコンテナ側に伝わらず HMR が動かない**ことが判明。代わりに polling を残しつつ interval を 5000ms に緩めて両立。

### YouTube 常時 iframe 埋め込み
シンプルだが複数動画ページで初期ロード/メモリ消費が増える。**Facade パターン**（サムネ + クリックで iframe 差替）を採用。

### Twitter/X の OG 直接スクレイプ
X.com は非ブラウザ UA に空 HTML を返す。**`publish.twitter.com/oembed` 公開エンドポイント**を先に叩く方式に変更。oEmbed 失敗時のみ通常 fetch にフォールバック。

### 情報ソースアイコンに favicon 取得（Plan B）
Google サービス（s2/favicons）依存・CSP 拡張・画質低い・ブランドガイドライン違反気味。**Plan A（公式ブランド SVG ロゴ）**を選択。Qiita/Zenn はドメイン優先で個別ロゴ。

### 情報ソースアイコンに OG image 縮小（Plan C）
44px に縮小するとサムネ内容が判別不能 + 一覧で CPU/メモリ浪費。詳細ページの大型サムネに専念。

### Compose モーダル開閉時に下書きを silent restore
誤閉じ復帰の保護として localStorage 自動保存は維持しつつ、**復元時に `DraftRestoredBanner` を出して「破棄して新規作成」ボタンを設置**。silent な復元は混乱の元。

### 直近コミットのサブジェクトを英語のまま
ユーザー指示で「コミットメッセージも日本語必須」と確定。直近 2 コミットを `git reset --hard` + `cherry-pick --no-commit` で**差分 0 ファイルでメッセージのみ書換**。以降は全て日本語。

### `tags/{id}` マスタ管理画面 + 多対多
MVP 規模では自由入力 `tags: string[]` で運用可能。マスタ化は名称変更時の一括 update が要るので Phase 2 で Cloud Functions と合わせて検討。MVP では `tags` コレクションは seed 投入のみ。

### `getFirestore(app)` のままで undefined を許容
SDK 既定では undefined フィールドが拒否されるため X URL 登録（thumbnailUrl 不在）が失敗。**`initializeFirestore(app, { ignoreUndefinedProperties: true })`** に切替。

### 集計フィールド（`answerCount` / `stats.likes` / タグ件数）の Cloud Functions 化
Spark 制約下では Functions 不可。MVP では「クライアント `increment()` + 信頼」で運用、Blaze 移行後にトリガー実装する前提。

---

## 次セッションへの注意点

### 完了確認済み（このセッションで全部消化）
- ✅ Docker stack 起動 / pnpm install / lint / unit (43/43) / rules (41/41) / build / seed
- ✅ ブラウザ動作確認（サインアップ → ログイン → 投稿 → 公開切替 → コメント → お気に入り → メタ取得 → YouTube 再生）
- ✅ design 全 9 画面（home/links/qa/notes/apps/projects/tags/favorites/mypage）のピクセル整合
- ✅ admin (10) はプレースホルダで設計通り
- ✅ Tweaks パネル（テーマ/アクセント/密度）動作

### まだ手をつけていない作業
- **E2E テスト**: 主要フロー（サインアップ → 投稿 → コメント → 採用 → お気に入り → 公開切替）を Playwright で網羅。`tools/scripts/verify-list-pages.mjs` のような one-off は存在
- **本番 Blaze 移行**: `docs/runbooks/deploy.md` の 10 ステップ未実行
- **Cloud Functions**: 集計（answerCount/stats/タグ件数）+ OG 取得 + 課金停止 + blocking trigger
- **管理画面の中身**: ユーザー一覧 / ロール変更 / タグマスタ管理 / 投稿モデレーション
- **マイページのお気に入りタブ・下書きタブ**: タブ枠は実装済、中身（タブ切替時の表示）は disabled

### 既知の留意点
- **Vite HMR**: `usePolling: true, interval: 5000ms`。500ms に下げると CPU 飽和+ HTML 応答秒単位遅延
- **TanStack Query v5 `enabled:false` で `isPending:true`**: ロード判定は `isFetching` を使う
- **Firestore は `ignoreUndefinedProperties: true`**（`src/lib/firebase/client.ts` で設定）
- **コミットメッセージは日本語**（type prefix のみ英語）
- **本番 CSP**: `img-src` は限定的（GitHub OG 画像 `opengraph.githubassets.com` 等は本番で表示されない）。デプロイ時に `firebase.json` の CSP 拡張要検討
- **og-proxy の Twitter oEmbed**: 公開ツイート/プロフィールのみ動作。削除/非公開ツイートは空応答 → ユーザーに通知される

### テストアカウント
詳細は [docs/runbooks/test-accounts.md](docs/runbooks/test-accounts.md)。
全員パスワード `testtest`：
- `sato.k@example.ac.jp`（DX推進、private データあり）
- `matsuoka.m@example.ac.jp`（情報支援、採用済み回答 a3-1 の作者）
- `kimura.r@example.ac.jp`（DX推進、解決済み質問 q3 の作者）

### 主要ファイル位置（このセッションで新規 or 大改修）
- `src/pages/HomePage.tsx`、`src/pages/MyPage.tsx` — 全面書き換え
- `src/pages/{links,qa,notes,apps}/{*Page,*DetailPage}.tsx` — 全面書き換え
- `src/pages/{projects,tags,favorites,admin}/` — 新規（Phase 2）
- `src/components/rows/` — 新規（LinkRow / QARow / NoteRow / AppRow）
- `src/components/shared/{PageHeader,FilterBar,Icon,SourceIcon,FavoriteButton,YouTubeEmbed}.tsx` — 新規
- `src/components/shell/{Sidebar,Topbar,Avatar,AppShell}.tsx` — 全面書き換え
- `src/components/tweaks/TweaksPanel.tsx` — 新規
- `src/components/home/{HeroActions,RecentProjects}.tsx` — 新規
- `src/components/compose/{DraftRestoredBanner}.tsx` — 新規
- `src/lib/db/{projects,tags,favorites}.ts` — 新規
- `src/lib/firebase/{client,use-user}.ts` — client.ts に initializeFirestore、use-user.ts 新規
- `src/lib/utils/{time,source,tweaks,og}.ts` — 新規 / 全面書き換え
- `src/extra.css` — Tweaks UI / ダーク / アクセント / link-thumb ブランド色（+200 行超）
- `vite.config.ts`、`firebase.json` — HMR / CSP 調整
- `docker/og-proxy/src/og-fetcher.ts` — Twitter oEmbed 対応
- `docs/runbooks/test-accounts.md` — 新規
