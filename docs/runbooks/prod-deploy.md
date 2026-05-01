# 本番デプロイ手順（Cloudflare Pages + Workers + Firebase Spark）

session 6-7 で確定した本番構成のデプロイ手順。

```
[ Cloudflare Pages ]               [ Cloudflare Workers ]      [ Firebase Spark ]
  aidev-knowledge-hub.pages.dev      aidev-og-worker             aidevknowledge-app
       ↑ SPA 配信                       ↑ OG メタ取得 + 認証検証     ↑ Auth + Firestore
       └────────── ID Token ───────────┘            ↑
                                                    │
       └──────────────────── ID Token + Firestore SDK ──┘
```

## 前提

- Cloudflare アカウント `lpc_claudeapps001@kobegakuin.ac.jp`
- Firebase プロジェクト `aidevknowledge-app`（Spark プラン）
- API トークン: `cloudflare/og-worker/.env.local`（gitignore 済、UTF-16 LE）
- `.env.production.local` に Firebase Web 設定一式（gitignore 済）
- Storage は Spark で使用不可。**option B**（添付・アバター無し）。

## 1. SPA を Cloudflare Pages にデプロイ

### 初回のみ: プロジェクト作成

```bash
TOKEN=$(iconv -f UTF-16LE -t UTF-8 cloudflare/og-worker/.env.local \
  | sed 's/^\xef\xbb\xbf//' | grep -E '^CLOUDFLARE_API_TOKEN=' \
  | sed 's/^CLOUDFLARE_API_TOKEN=//' | tr -d '\r\n')

docker compose exec -T -e CLOUDFLARE_API_TOKEN="$TOKEN" app sh -c \
  "cd cloudflare/og-worker && pnpm exec wrangler pages project create aidev-knowledge-hub --production-branch=main"
```

### 通常デプロイ

```bash
TOKEN=$(iconv -f UTF-16LE -t UTF-8 cloudflare/og-worker/.env.local \
  | sed 's/^\xef\xbb\xbf//' | grep -E '^CLOUDFLARE_API_TOKEN=' \
  | sed 's/^CLOUDFLARE_API_TOKEN=//' | tr -d '\r\n')

# production
docker compose exec -T -e CLOUDFLARE_API_TOKEN="$TOKEN" app tools/scripts/deploy-pages.sh production

# preview branch
docker compose exec -T -e CLOUDFLARE_API_TOKEN="$TOKEN" app tools/scripts/deploy-pages.sh preview

# build のみ（デプロイなし）
docker compose exec -T app tools/scripts/deploy-pages.sh --dry-run
```

`tools/scripts/deploy-pages.sh` が内部で:

1. `pnpm build:prod` を呼ぶ（VITE_* 環境変数を unset → `.env.production` + `.env.production.local` を Vite に再読込させる）
2. `wrangler pages deploy dist --project-name=aidev-knowledge-hub --branch=main` を実行
3. `dist/_headers` と `dist/_redirects` がアップロードされる

### 本番 URL

- **canonical**: `https://aidev-knowledge-hub.pages.dev`
- **preview**: `https://<8桁hash>.aidev-knowledge-hub.pages.dev`（毎デプロイで自動発行）

## 2. Worker (og-worker) のデプロイ

```bash
docker compose exec -T -e CLOUDFLARE_API_TOKEN="$TOKEN" app sh -c \
  "cd cloudflare/og-worker && pnpm exec wrangler deploy"
```

`ALLOWED_ORIGINS`（カンマ区切り、`wrangler.toml` 内）に Pages の本番 URL を必ず含めること。

## 3. Firebase Console 手動作業

API 経由ではなく Console UI で対応（Service Account 鍵が学院ポリシーで生成不可のため）。

### 承認済みドメイン追加（初回 + Pages URL 変更時）

[Firebase Console → Authentication → Settings → 承認済みドメイン](https://console.firebase.google.com/project/aidevknowledge-app/authentication/settings) で以下を追加:

- `aidev-knowledge-hub.pages.dev`
- 必要に応じて `*.aidev-knowledge-hub.pages.dev`（preview deployments）

未追加だと SPA から signIn 試行時に `auth/unauthorized-domain` エラー。

### テストユーザー作成

[Authentication → Users → ユーザーを追加](https://console.firebase.google.com/project/aidevknowledge-app/authentication/users) でメール+パスワード作成。

### users コレクション初期化

Auth 作成だけでは `users/{uid}` レコードが無いので SPA からは初回サインイン時に bootstrap される（`src/lib/firebase/bootstrap-user.ts`）。
管理者ロール付与は Console の Firestore エディタから手動で `role: '管理者'` を立てる。

### tags マスタ投入（初回のみ）

23 種の初期タグ（`RAG` / `Dify` / `Claude` / `FAQ検索` など）を Firestore に投入。Rules で `tags.write` は管理者のみ許可されているため、管理者ロールのアカウントでログインして REST 経由で投入する。

スクリプトは Node 標準ライブラリのみ（`fetch` / `node:fs` / `node:util`）で実装されているため、**ホストの Node 18+ で直接実行できる**（Docker 不要）:

```bash
# 管理者パスワードを secrets/ に保存（gitignore 済）
printf '%s' '<password>' > secrets/admin-password.txt

# dry-run（書き込みなし、認証と isAdmin 確認のみ）
node tools/scripts/seed-prod-tags.mjs \
  --email <admin-email> \
  --password-file secrets/admin-password.txt \
  --dry-run

# 本番投入
node tools/scripts/seed-prod-tags.mjs \
  --email <admin-email> \
  --password-file secrets/admin-password.txt
```

スクリプトは idempotent なので再実行で既存 tag を上書き更新する。`tools/scripts/seed.ts` の `TAGS` 配列と同期して保つこと（双方手動編集）。

### お知らせ（changelog）の追加

`announcements` / `changelog` は Firestore 投入ではなく **`src/lib/data/changelog.ts` の静的バンドル**に追記するだけ。先頭が最新リリース。追記後、再ビルド + Cloudflare Pages 再デプロイで反映（`deploy-pages.sh` は wrangler を使うため Docker 経由）:

```bash
export CLOUDFLARE_API_TOKEN=$(cat cloudflare/og-worker/.env.local | grep CLOUDFLARE_API_TOKEN | cut -d= -f2)
docker compose exec -T -e CLOUDFLARE_API_TOKEN app tools/scripts/deploy-pages.sh
```

`audience: 'admin'` を付けると一般ユーザーには非表示になる（管理者・運用周りの内容向け）。

## 4. デプロイ後検証

```bash
node tools/scripts/verify-cf-pages.mjs
```

検証項目（全 7 項目）:

1. ルートが 200 で index.html を返す
2. セキュリティヘッダ（CSP / X-Frame-Options / HSTS / Referrer-Policy / Permissions-Policy）
3. CSP の connect-src に Worker URL を含む
4. SPA fallback（deep link → index.html）
5. `/assets/*` の immutable cache 設定
6. Worker CORS preflight が Pages origin から通る
7. Worker `/health` 200

エンドツーエンド（Auth 経由 OG メタ取得）の確認は:

```bash
node tools/scripts/verify-cf-worker.mjs <test-email> <test-password>
```

## 5. ロールバック

Cloudflare Pages の deployment 履歴から旧バージョンを「Rollback」できる:

[Cloudflare Dashboard → Workers & Pages → aidev-knowledge-hub → Deployments](https://dash.cloudflare.com)

Worker は `wrangler rollback <version-id>` で前バージョンに戻せる。

## 6. 既知の制約

- **Storage（添付・アバター）非対応**: Spark プラン制約。option B として MVP では機能カット。将来必要なら R2 + 自作署名 URL（Worker `cloudflare/og-worker/src/storage.ts` に下書きあり）
- **本番 seed スクリプト未実装**: tags / changelog / 初期管理者は Console から手動投入
- **CI 未整備**: `pnpm lint` + `pnpm test:rules` は手元で実行する運用
- **Service Account 鍵生成不可**: 学院 Workspace ポリシー（`iam.disableServiceAccountKeyCreation`）。Console UI 手動運用が前提
