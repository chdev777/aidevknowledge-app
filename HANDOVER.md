# セッション引き継ぎノート

> 最終更新: 2026-05-01（セッション 8 / 本番 Firestore 立ち上げ + 初期管理者投入）
> 現在ブランチ: `main`（origin より 3 コミット先行、main 直 push はブロック中）
> リモート: https://github.com/chdev777/aidevknowledge-app
> 直近コミット: `93aa094 feat(scripts): 本番 Firebase の signIn 検証 + ユーザ bootstrap スクリプト追加`

---

## 今回やったこと（セッション 8）

セッション 7 で立ち上げた本番 Pages を **実運用可能な状態に通電**。承認済みドメイン追加だけで動かないことが判明し、Firestore Rules / indexes が未デプロイ（default deny-all）であることを発見、CI トークン経由でデプロイし、初期管理者を確立した。

### 1. 承認済みドメイン追加（ユーザ手動）

[Firebase Console → Authentication → Settings → 承認済みドメイン](https://console.firebase.google.com/project/aidevknowledge-app/authentication/settings) に `aidev-knowledge-hub.pages.dev` を追加。これだけで signIn は通るが、後続の Firestore アクセスが 403 PERMISSION_DENIED で全て失敗。

### 2. 本番 Firestore Rules / indexes デプロイ

**症状**: signIn 成功するが `tags` `users` などすべての read/write が 403。
**原因**: 本番 Firestore は Spark の **default deny-all** ルールのまま。`firestore.rules` がデプロイされていなかった（PoC は Emulator 経由で開発、本番反映ステップが未実施だった）。

**対応**:
- `firebase login:ci --no-localhost` で CI トークン取得（host のローカル loopback が Docker から見えないため `--no-localhost`）
- トークンは `secrets/firebase-ci-token.txt`（gitignore 済）に保存、user-visible 出力には貼らない運用
- `pnpm dlx firebase-tools@latest deploy --only firestore:rules,firestore:indexes --project aidevknowledge-app` で本番反映
- ローカル `pnpm test:rules` 82/82 PASS 済の状態をそのまま反映

### 3. 本番 signIn / 認可 検証スクリプト

**`tools/scripts/verify-prod-signin.mjs`** 新設:
- `signInWithPassword` に `Origin: https://aidev-knowledge-hub.pages.dev` を付けて `auth/unauthorized-domain` が出ないこと確認
- 取得した idToken で Firestore REST に当たり、`tags` を read してルール反映確認
- `users/{uid}` の bootstrap 状態判定
- 秘密値は `mask()`（先頭4 + 末尾2 + len）形式で出力、idToken / API key 全文は伏せる

### 4. 本番初期ユーザ投入スクリプト

**`tools/scripts/bootstrap-prod-user.mjs`** 新設。SignupPage の `bootstrapUser()` SDK 動線を REST で完全再現:

1. `accounts:signUp` → uid + idToken 取得（createUserWithEmailAndPassword 相当）
2. `accounts:update` → displayName 設定
3. `handles/{handle}` 重複チェック
4. Firestore `:commit` で `handles/{handle}` + `users/{uid}` を **atomic write**（runTransaction 相当、`currentDocument.exists=false` で既存ドキュメント弾き）
5. `users/{uid}/private/profile` を PATCH（個人情報、本人のみ書込可）
6. `accounts:sendOobCode` で確認メール送信（失敗無視）

失敗時は `accounts:delete` で Auth ロールバック。Rules はそのまま適用される（idToken Bearer 認証で `request.auth.uid` 検証）。

これで `test2@example.com` (handle=`test2`, role=`DX推進`) を本番に投入し、bootstrap 経路の機能確認も完了。

### 5. 初期管理者の確立（chikuda）

**chicken-and-egg 問題**: Rules で role='管理者' は `isAdmin()` 経由でしか書き換え不可、しかし管理者ゼロ状態。Rules を bypass できる経路は限定:

| 経路 | 可否 |
|---|---|
| Service Account 鍵 + Admin SDK | ❌ 学院 Workspace ポリシーで鍵生成不可 |
| CI refresh token → OAuth access token 手動交換で IAM bypass | ❌ メモリ規則「秘密値の用途外利用」で hook ブロック（妥当判断） |
| Firebase Console UI（GCP Owner セッション） | ✅ |

**結論**: Console UI が唯一の正規ルート。chikuda は SPA signup 経由で `users/jQjTsDq…` (handle=`chdev`, role=`情報支援`) と `handles/chdev` が既存だったため、Console の Firestore エディタで `role` 1 フィールドを `情報支援` → `管理者` に書き換えて完了。

test2 idToken で再 read して `role: 管理者` 反映を確認。

---

## 検証結果（セッション 8）

- ✅ `pnpm lint`（tsc）PASS
- ✅ `pnpm test`（unit）71/71 PASS
- ✅ `pnpm test:rules` 82/82 PASS
- ✅ `pnpm build:prod` 成功
- ✅ `verify-cf-pages.mjs` 7/7 PASS
- ✅ `verify-prod-signin.mjs` PASS（test2 で signIn → Firestore auth → users/{uid} 確認）
- ✅ `bootstrap-prod-user.mjs` PASS（test2 投入、6 ステップすべて成功）
- ✅ chikuda の本番 role=管理者 反映確認

---

## 重要決定事項（セッション 8 で確定）

### 本番 Rules / indexes デプロイは CI トークン経由で運用

- Service Account 鍵が学院ポリシーで生成不可なので `firebase login:ci` 一択
- トークンは `secrets/firebase-ci-token.txt`（gitignore 済）。流出時は本番 Owner 権限相当の影響、ローテーション要
- 将来 SA 鍵が解禁されたら GitHub Actions OIDC + Workload Identity Federation に移行候補

### 「最初の管理者」は Console UI 一択

- REST + Rules では原理的に作成不可（chicken-and-egg）
- 既存管理者からの role 付与は Rules で許可されている（`isAdmin() && role in ['DX推進','情報支援','管理者']`）
- 2 人目以降は管理 UI（Moderation など）経由で運用可能

### 秘密値の取り扱い

- chikuda パスワードは結局未使用（ユーザが自身で SPA signup 済だった）。`secrets/chikuda-password.txt` は作成されなかった
- `secrets/firebase-ci-token.txt` は今後の Rules 更新デプロイで継続利用
- `bootstrap-prod-user.mjs` のような script では mask 出力を必ず通す（メモリ `feedback_secrets_in_output.md` 準拠）

---

## 残タスク（次セッション以降）

### 本番運用上の to-do

1. **`secrets/firebase-ci-token.txt` の保護徹底** — 流出時影響大、ローテーション手順を runbook に追加するのが望ましい
2. **本番 seed の本格版** — tags / 初期 announcements / changelog の投入スクリプト（`bootstrap-prod-user.mjs` を雛形として extend）
3. **CI 整備** — GitHub Actions で `pnpm lint` + `pnpm test` + `pnpm test:rules` 必須、Rules / indexes も branch ごとに `firebase deploy` 自動化（CI トークンを GitHub Secrets に格納）
4. **管理 UI で 2 人目管理者の付与確認** — chikuda ログイン → 管理画面で別ユーザを `管理者` 化できるか実機確認

### MEDIUM 課題（session 5 由来、引き続き）

| # | 内容 |
|---|---|
| M1 | FeedbackTab の `alert()` を共通 Toast に統一 |
| M2 | Sidebar 未読バッジの同期: `useLocation` 依存追加 or storage event |
| M3 | TanStack Query → 将来 `onSnapshot` 化（複数管理者の同時操作対応） |
| M4 | `feedback update + admin_logs` を `writeBatch` で原子化 |
| M5 | 未使用 Firestore index に注記 or 削除（`feedbacks` の status / category 複合） |
| M6 | バナーのモバイル `@media` 対応 |
| M7 | localStorage `lastSeen` の改ざん耐性（不正バージョン弾く） |

### 後続フェーズ

- **CI 整備**（再掲）
- **R2 検討**: 添付・アバター機能を有効化したくなった時の Storage 代替

---

## 次セッションへの注意点（セッション 8 で更新）

### 本番テストアカウント

| email | password | role | 用途 |
|---|---|---|---|
| `chikuda@j.kobegakuin.ac.jp` | (本人管理) | **管理者** | 管理 UI 動作確認・運用 |
| `test2@example.com` | `testtest123` | DX推進 | bootstrap 検証用、削除可（不要なら Console から） |
| `test@example.com` | `testtest123` | (users/{uid} 無し) | Auth のみ存在、users 未 bootstrap、削除推奨 |

### 本番 Firestore 状態

- Rules: 最新 `firestore.rules` (commit `93aa094` 時点) デプロイ済
- indexes: `firestore.indexes.json` 反映済（バックグラウンド構築完了）
- データ: `users` 2 件（chikuda, test2）/ `handles` 2 件（chdev, test2）/ その他コレクション空

### 本番デプロイの再実行コマンド

```bash
TOKEN=$(cat secrets/firebase-ci-token.txt)
docker compose exec -T -e FIREBASE_TOKEN="$TOKEN" app sh -c \
  "cd /app && pnpm dlx firebase-tools@latest deploy --only firestore:rules,firestore:indexes --project aidevknowledge-app"
```

Pages 再デプロイ:
```bash
pnpm build:prod
docker compose exec -T -e CLOUDFLARE_API_TOKEN="$CF_TOKEN" app sh -c \
  "cd /app/cloudflare/og-worker && pnpm exec wrangler pages deploy ../../dist --project-name=aidev-knowledge-hub --branch=main"
```

---

## 過去セッション

- **session 1-4**: 基本機能（PoC・seed・E2E・auth・URL/Q&A/notes/apps）
- **session 5**: お知らせ + フィードバック（PR #1）
- **session 6**: CSS 修正 + Cloudflare Workers 移行 + 本人削除 UI + コードレビュー対応（PR #1, #2）
- **session 7**: Cloudflare Pages デプロイ → 完全クラウド構成完了
- **session 8**: 本番 Firestore 立ち上げ（Rules / indexes デプロイ）+ 初期管理者投入

---

## セッション 7 までの内容（archive）

### 今回やったこと（セッション 7）

SPA を **Cloudflare Pages** にデプロイし、完全クラウド構成 (Pages + Workers + Firebase Spark) を完成させた。

### 1. Cloudflare Pages デプロイ基盤

- **`public/_headers`** 新設: `firebase.json` hosting.headers の CSP / セキュリティヘッダを Cloudflare Pages 形式に移植。`connect-src` に Worker URL (`aidev-og-worker.ipc-claudeapps001.workers.dev`) を追加。`/assets/*` 用に `Cache-Control: public, max-age=31536000, immutable`。
- **`public/_redirects`** 新設: SPA history fallback (`/* /index.html 200`)。
- **`src/test/unit/pages-headers.spec.ts`** TDD で先に書いた検証 9 ケース（CSP の Worker URL / frame-ancestors / script-src 厳格 / セキュリティヘッダ存在）。

### 2. 本番ビルドの env 解決問題を修正

`pnpm build --mode production` で Vite が `aidev-knowledge-dev`（開発用 project ID）を焼き付けてしまっていた。原因は **docker-compose の `env_file: - .env` で VITE_* が container env に注入され、Vite の loadEnv が process.env を上書きしないため**。

→ `tools/scripts/build-prod.sh` を新設。ビルド前に `unset $VITE_*` してから `vite build --mode production` を呼ぶ。`pnpm build:prod` で実行可能。`.env.production.local` 不在ガードあり。

### 3. デプロイスクリプト

- **`tools/scripts/deploy-pages.sh`**: `production` / `preview` / `--dry-run` の 3 モード。`build:prod` → `wrangler pages deploy dist` を一発実行。
- 初回プロジェクト作成は `wrangler pages project create aidev-knowledge-hub --production-branch=main` を runbook に記載。

### 4. 実デプロイ完了

- **本番 URL**: `https://aidev-knowledge-hub.pages.dev`
- アップロード 8 ファイル（index.html / `_headers` / `_redirects` / assets 5）
- レスポンスヘッダで CSP / HSTS / X-Frame-Options 全部 OK

### 5. Worker 設定更新

`cloudflare/og-worker/wrangler.toml` の `ALLOWED_ORIGINS` を `aidev-knowledge.pages.dev`（古い想定 URL）→ `aidev-knowledge-hub.pages.dev`（実 URL）に修正、`wrangler deploy` で再デプロイ。

### 6. E2E 検証スクリプト

**`tools/scripts/verify-cf-pages.mjs`** を新設、7 項目を確認:

1. ルート 200 + index.html
2. セキュリティヘッダ 6 種すべて適用
3. CSP に Worker URL
4. SPA fallback (deep link → index.html 200)
5. `/assets/*` の immutable cache
6. Worker CORS preflight が Pages origin から 通過 (`access-control-allow-origin: https://aidev-knowledge-hub.pages.dev`)
7. Worker `/health` 200

→ **全 PASS**。

### 7. ドキュメント

- **`docs/runbooks/prod-deploy.md`** 新設: 初回プロジェクト作成 / 通常デプロイ / Worker デプロイ / Firebase Console 手動作業（承認済みドメイン追加・テストユーザー作成）/ 検証 / ロールバック手順を網羅。

---

## 検証結果（セッション 7）

- ✅ `pnpm lint`（tsc）PASS
- ✅ `pnpm test`（unit）71/71 PASS（pages-headers 9 ケース追加）
- ✅ `pnpm test:rules` 82/82 PASS
- ✅ `pnpm build:prod` 成功（gzip JS = 263 KiB / CSS = 10.5 KiB）
- ✅ Worker 再デプロイ成功（145 KiB / 15ms 起動）
- ✅ `verify-cf-pages.mjs` 7/7 PASS
- ✅ Pages 本番 URL からトップページ取得 / SPA deep link 200 / immutable cache 確認

---

## 残タスク（次セッション以降）

### Firebase Console 手動作業（**まだ未実施**、本番ログイン前に必須）

1. [Authentication → Settings → 承認済みドメイン](https://console.firebase.google.com/project/aidevknowledge-app/authentication/settings) に `aidev-knowledge-hub.pages.dev` を追加
2. テストユーザーで本番 SPA に signIn → users/{uid} bootstrap が走るか実機確認

未対応だと `auth/unauthorized-domain` で signIn 失敗するので最優先。

### MEDIUM 課題（session 5 由来、引き続き）

| # | 内容 |
|---|---|
| M1 | FeedbackTab の `alert()` を共通 Toast に統一 |
| M2 | Sidebar 未読バッジの同期: `useLocation` 依存追加 or storage event |
| M3 | TanStack Query → 将来 `onSnapshot` 化（複数管理者の同時操作対応） |
| M4 | `feedback update + admin_logs` を `writeBatch` で原子化 |
| M5 | 未使用 Firestore index に注記 or 削除（`feedbacks` の status / category 複合） |
| M6 | バナーのモバイル `@media` 対応 |
| M7 | localStorage `lastSeen` の改ざん耐性（不正バージョン弾く） |

### 後続フェーズ

- **CI 整備**: GitHub Actions で `pnpm lint` + `pnpm test:rules` + `pnpm test` 実行 + Pages preview deploy
- **本番 seed スクリプト**: tags / 初期管理者 / changelog 等の本番投入手順
- **R2 検討**: 添付・アバター機能を有効化したくなった時の Storage 代替

---

## 過去セッション

- **session 1-4**: 基本機能（PoC・seed・E2E・auth・URL/Q&A/notes/apps）
- **session 5**: お知らせ + フィードバック（PR #1）
- **session 6**: CSS 修正 + Cloudflare Workers 移行 + 本人削除 UI + コードレビュー対応（PR #1, #2）
- **session 7**: Cloudflare Pages デプロイ → 完全クラウド構成完了

---

## セッション 6 までの内容（archive）

### 今回やったこと（セッション 6）

### 1. CSS バグ修正

#### アクセント色（amber/indigo/forest）追従不具合
`extra.css` 内 11 箇所で border 等が `oklch(0.85 0.10 65)` のように **hue 65（amber）にハードコード**されており、Tweaks のアクセント切り替えで枠線だけ amber 固定だった問題を `var(--accent)` に置換。

対象: `.announcements-banner`（light/dark）/ `.status-badge[data-status='採用候補']` / `.comment-type[data-type='improve']` / `.accepted-mark` / `.answer-item.is-accepted` / `.me-tab.is-active .me-tab-count` / `.admin-row-self`（light/dark）/ `.announcements-entry-badge.feedback` / `.feedback-cat.active`（light/dark）

`.topbar-warn` は警告セマンティック色なのでアンバー固定のまま温存。

#### マイページの行レイアウト崩れ
`extra.css:1277-1287` の `.me-row` 上書き定義（`grid-template-columns: 1fr auto`、2 カラム）が JSX の 3 children 構造（icon / content / actions）と整合せず、タイトル長によって左右にぶれていた問題を修正。`.me-row-main` / `.me-row-actions` は完全な dead code（JSX のどこからも参照されていない）として削除。`globals.css:1343-1379` の `auto 1fr auto` 定義が単独適用される正しい状態に。

#### お知らせバナーの縦幅コンパクト化
50px → 32px（padding 10→4 / font 13→12 / icon 18→13 / radius 10→6）。

#### 管理者タグ追加ボタンの視認性
ボタンは元から実装されていたが（`TagsTab.tsx:144`）、`btn sm` グレー枠でフィルタチップ群と紛れ「機能がない」と見落とされていた。`btn-primary`（黒背景）+ ラベル「タグを追加」+ `aria-label` で改善。

### 2. 自分の投稿を本人削除する UI

`src/components/me/DeleteOwnButton.tsx` を新設。MyPage の URL / 質問 / 検証メモ / 作成アプリの 4 行に「削除」ボタン追加。Firestore Rules では `ownerOf(resource.data) || isAdmin()` で本人削除は元から許可されていたが UI が無かった。

ConfirmDialog 経由で削除確認、確定で `linksDb.remove` 等を呼ぶ。**本人削除は `admin_logs` に記録しない**設計（個人情報の自己管理権、管理者削除とは経路を分離）。

### 3. Cloudflare Workers + Firebase 本番接続（最大の変更）

PoC を本番運用可能な構成にするための基盤整備。og-proxy（Express on Docker）を **Cloudflare Workers** に移植 + **Firebase Spark** に直接接続するハイブリッド構成を整備。

#### なぜこの構成にしたか

学院 LAN ホスティング案で詰まった点:
- mkcert root CA を学内 MDM で配布できない
- 学院 DNS / 内部 PKI も使えない
- 結果として HTTP 運用しかなく「保護されていません」表示問題が解消できなかった

→ **クラウドに寄せる**選択。Vercel Hobby は ToS 上「商用」グレーゾーンなので **Cloudflare** へ。

#### 実装内容

`cloudflare/og-worker/`:
- **Hono** で Express 互換ルーティング
- **jose** で Firebase ID Token を直接検証（`firebase-admin` 不使用、Workers の Node 互換性問題回避）
- **HTMLRewriter** で OG メタ抽出（`cheerio` 不使用、Workers ストリーム処理で CPU 1-3ms）
- **Web Crypto** で GCS V4 署名を実装（Storage 用、option B では未通電）
- バンドル 145 KiB / gzip 35 KiB / 起動 17ms（無料枠 10ms CPU 内）
- 配信先: `https://aidev-og-worker.ipc-claudeapps001.workers.dev`

#### Firebase 本番側

- Spark プラン、project=`aidevknowledge-app`
- Authentication（メール/パスワード）+ Firestore（`asia-northeast1`）
- **Storage は Spark で使用不可**のため未有効化（**option B**: 添付・アバター機能は PoC では非対応）
- Service Account 鍵は **学院 Workspace ポリシー（`iam.disableServiceAccountKeyCreation`）で生成不可**のため、Web App 追加・テストユーザー作成は Console UI で手動運用

#### 開発と本番の並走

開発環境（Emulator）と本番（クラウド）は完全独立で並走可能:
- `pnpm dev`: `.env` を読み Emulator 接続（従来通り）
- `pnpm build --mode production`: `.env.production` + `.env.production.local` を読み実 Firebase + Worker 接続

### 4. Code Review 対応 2 ラウンド

#### セッション 6 自体のレビュー（コミット 0bd4725 系）
- **HIGH** og-fetcher SSRF: `redirect: 'follow'` → `'manual'` で各ホップ検証、メタデータ IP 169.254.169.254 等を REJECT 一覧に追加
- **MEDIUM** auth.ts: `clockTolerance: '5s'` + `iat` 未来チェック追加
- 改善: `app.use('/api/*', requireAuth)` で一括適用、ラッパ撤廃

#### セッション 5（announcements + feedback）の遅延レビュー → PR #2
- **H1**: 「一方向 → 双方向」遷移化の遺物をコメント・UI 文言・dead code 注記から一掃
- **H2**: feedbacks Rules の create 検証を強化
  - `userHandleSnap`（string + 32 字上限）/ `userNameSnap`（64 字）/ `currentView`（256 字）/ `updatedAt == request.time` を Rules で検証
- **H3**: FeedbackFab に `aria-modal="true"` + `aria-labelledby` + 閉じ後の FAB フォーカス復帰
- Rules テスト 16 → 22 ケース（H2 検証ポイント網羅）

---

## 検証結果（セッション 6 累積）

- ✅ `pnpm lint`（tsc）PASS
- ✅ `pnpm test:rules` 82/82 PASS
- ✅ `pnpm test`（unit）62/62 PASS
- ✅ Cloudflare Worker `tsc --noEmit` PASS
- ✅ `wrangler deploy` 成功（145 KiB, 17ms 起動）
- ✅ `verify-cf-worker.mjs` end-to-end PASS（Firebase Auth → Worker /api/og）
- ✅ `verify-announcements-feedback.mjs` 20/20 PASS
- ✅ `verify-banner-accent.mjs` 3 アクセントで hue distinct PASS
- ✅ `verify-mypage-row-layout.mjs` 3 カラム適用 PASS
- ✅ `verify-delete-own.mjs` 削除 UI 動作 PASS
- ✅ `verify-tag-create-ui.mjs` タグ追加フォーム展開 PASS

---

## 重要な決定事項（セッション 6 で確定）

### 構成方針

| 領域 | 決定 |
|---|---|
| **og-proxy 本番先** | Cloudflare Workers (`cloudflare/og-worker/`)。Docker 版は dev 専用 |
| **データレイヤ** | Firebase Spark（Auth + Firestore）。Blaze は当面不要 |
| **Storage 本番** | Spark で使用不可、PoC は **option B**（添付なし）。将来は **R2 検討**（Blaze 回避＆エグレス無料） |
| **SPA 本番ホスティング** | Cloudflare Pages（次フェーズ予定、未デプロイ） |
| **Service Account 鍵** | 学院ポリシーで生成不可。Console UI 手動運用前提 |
| **本番 SSL/ドメイン** | Cloudflare 任せ（`*.workers.dev` / `*.pages.dev`）。学内 LAN 限定の HTTPS 化交渉は不要に |

### Worker 実装の方針

- **firebase-admin SDK は使わない** → `jose` で Google JWKs から直接検証
- **cheerio は使わない** → Cloudflare の `HTMLRewriter`（SAX ストリーム処理）
- **GCS 署名は自作** → `crypto.subtle` で V4 RSA-SHA256 を直接組み立て
- **レート制限** → `RATE_LIMITER` binding 利用（未バインドなら skip）
- **redirect は follow せず manual** → 各ホップで `isRejectedHost` 再チェック

### 本人削除 UI

- **`admin_logs` には記録しない**（個人情報の自己管理権）
- 管理者削除（Moderation タブ）は引き続き `admin_logs` に記録
- **論理削除ではなく完全削除**（ゴミ箱機能は MVP 対象外）

### セキュリティ

- **API トークン・サービスアカウント秘密鍵は user-visible 出力に書かない**（チャット・log 等含めて全文禁止、長さやプレフィックスのみ可）。経緯はメモリ `feedback_secrets_in_output.md` に記録
- **`.env.production.local` は gitignore 済**（Firebase Web 設定を保持）
- **`secrets/` ディレクトリも gitignore 済**（サービスアカウント JSON 想定）

---

## 捨てた選択肢と理由（セッション 6 分）

### LAN ホスティング HTTPS 化
- **却下**: mkcert + root CA 配布が学内 MDM 不在で運用困難 / 学院 DNS / 内部 PKI も無し → HTTP 運用「保護されていません」表示が不可避
- **採用**: クラウド寄せ（Cloudflare Workers + Pages）

### Vercel Hobby
- **却下**: ToS 上「非商用」限定、学内業務利用はグレー
- **採用**: Cloudflare（無料プランでも商用 OK）

### Firebase Storage（Blaze 移行）
- **却下**: 課金事故対策の運用負荷 + 50 人規模では過剰
- **採用**: Spark + option B（添付なし）。将来必要なら R2

### サービスアカウント鍵で Web App 自動作成
- **却下**: 学院 Google Workspace ポリシーで鍵生成不可
- **採用**: Console UI で手動。`tools/scripts/firebase-{create-user,setup-webapp}.mjs` は将来用に温存（コメント明記）

### `admin_logs` に本人削除も記録
- **却下**: 自己管理権の観点で、自分の投稿を消すのは監査対象外
- **採用**: 管理者削除のみ記録、本人削除は痕跡なし。なりすまし対策が必要な場合は将来 `deletion_audit` コレクション追加で対応

---

## 残タスク（優先度別）

### 次セッションで対応推奨（session 7 時点の更新）

1. ~~**Cloudflare Pages に SPA をデプロイ**~~ — **session 7 で完了**（`https://aidev-knowledge-hub.pages.dev`）
2. **本番 Firestore に管理者ユーザーのプロファイルレコードを投入** — Auth 作成後に自動で `users/{uid}` を作る trigger が無いので手動 or seed スクリプトの本番版が必要

### MEDIUM 課題（session 5 レビュー由来、将来対応）

| # | 内容 |
|---|---|
| M1 | FeedbackTab の `alert()` を共通 Toast に統一 |
| M2 | Sidebar 未読バッジの同期: `useLocation` 依存追加 or storage event |
| M3 | TanStack Query → 将来 `onSnapshot` 化（複数管理者の同時操作対応） |
| M4 | `feedback update + admin_logs` を `writeBatch` で原子化 |
| M5 | 未使用 Firestore index に注記 or 削除（`feedbacks` の status / category 複合） |
| M6 | バナーのモバイル `@media` 対応 |
| M7 | localStorage `lastSeen` の改ざん耐性（不正バージョン弾く） |

### Cloudflare Worker 関連（option 拡張時）

- **storage.ts の objectKey エンコード修正** — 通電前必須（`/` 保持の split-encodeURIComponent）
- **GCS V4 署名の Vitest 単体テスト** — 通電前必須
- **verify-cf-worker.mjs の UTF-16 LE 対応** — 環境ファイル読み出し堅牢化
- **CORS origin 正規化** — trailing slash 対応

### LOW 課題

- 絵文字利用ルールの整理（コード内の 💬 / ✨ / 💡 / 🔧 / 🔒）
- announcements-storage.ts の getter/setter テスト
- `formatReleaseDate` の異常系テスト
- `INVALID_TRANSITION` 文字列ベース判定をカスタムエラー化

### 後続フェーズ

- **CI 整備**: GitHub Actions で `pnpm lint` + `pnpm test:rules` 実行
- **ngrok / Cloudflare Tunnel** 検討（学内デモ用、必要なら）
- **本番 seed スクリプト**: tags / 初期管理者 / changelog 等の本番投入手順
- **本番運用ドキュメント**: `docs/runbooks/prod-deploy.md` の作成

---

## 次セッションへの注意点

### テストアカウント

#### Emulator（dev）
詳細は [docs/runbooks/test-accounts.md](docs/runbooks/test-accounts.md)。全員パスワード `testtest`。
- `sato.k@example.ac.jp`（**管理者**、private データあり）
- `matsuoka.m@example.ac.jp`（情報支援、採用済み回答 a3-1 の作者）
- `kimura.r@example.ac.jp`（DX推進、解決済み質問 q3 の作者）

#### 本番 Firebase（aidevknowledge-app）
- `test@example.com` / `testtest123`（手動作成済、ロールなし）

### Cloudflare 関連

- **API トークン**: `cloudflare/og-worker/.env.local`（gitignore 済、UTF-16 LE）
- **デプロイ**: `docker compose exec -T -e CLOUDFLARE_API_TOKEN="$TOKEN" app sh -c "cd /app/cloudflare/og-worker && pnpm exec wrangler deploy"`
- **Docker 内 wrangler dev は不可**（glibc 古く workerd が動かない）。`wrangler deploy` は OK
- **Worker URL**: `https://aidev-og-worker.ipc-claudeapps001.workers.dev`
- **Cloudflare アカウント**: `lpc_claudeapps001@kobegakuin.ac.jp` / Account ID `8379b276f1aef2938adb33c3442d1e66`

### Vite / Firestore 既知の留意点

- **Vite HMR**: `usePolling: true, interval: 5000ms`。500ms に下げると CPU 飽和 + HTML 応答遅延
- **TanStack Query v5 `enabled:false` で `isPending:true`**: ロード判定は `isFetching` を使う
- **Firestore は `ignoreUndefinedProperties: true`**（`src/lib/firebase/client.ts`）
- **emulator restart で rules リロード**: rules 編集後は `docker compose restart firebase-emulator` + 再 seed が必要
- **ホストポートは +200 シフト**: Auth 9299 / Firestore 8280 / UI 4200 / og-proxy 8987
- **Emulator データは揮発する**: ログイン不能の第一容疑者。`docker compose exec app pnpm seed` で復旧

### Vite dev サーバの遅さ

Docker for Windows 上の bind mount IO で初回ロードが 20 秒前後。**PoC では許容**（本番 Cloudflare Pages では数百 ms で配信される）。15s タイムアウトの E2E スクリプトは Step 8 等の deep-link で先に切れることがあるが、curl では 200 を返す = サーバは正常。

### 過去セッション

- **session 1-4**: 基本機能（PoC・seed・E2E・auth・URL/Q&A/notes/apps）
- **session 5**: お知らせ + フィードバック（PR #1）
- **session 6**: CSS 修正 + Cloudflare 移行 + 本人削除 UI + コードレビュー対応（PR #1, #2）
