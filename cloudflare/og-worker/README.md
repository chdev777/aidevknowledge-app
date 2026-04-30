# og-worker — Cloudflare Workers 版 og-proxy

`docker/og-proxy/`（Express + Node.js）を Cloudflare Workers 用に書き直したもの。
Cloudflare Pages（SPA）と組み合わせて、LAN ホスティング・証明書管理なしで運用するための実装。

## 移植状況

| 機能 | 元実装 | Workers 実装 | ステータス |
|---|---|---|---|
| ルーティング | Express | Hono | ✅ 完了 |
| Firebase ID Token 検証 | firebase-admin | jose + Google JWKs | ✅ 完了 |
| OG メタ取得 | undici + cheerio | fetch + HTMLRewriter | ✅ 完了 |
| Twitter oEmbed | 同左 | 同左（標準 fetch） | ✅ 完了 |
| YouTube サムネ抽出 | 同左 | 同左 | ✅ 完了 |
| SSRF 対策 | DNS lookup + private IP | URL ホスト名チェック | ⚠ Workers から LAN 不可達なので簡易化、要レビュー |
| Storage 署名 URL | aws-sdk + MinIO | Web Crypto + GCS V4 | ⚠ 初回実装、実 GCS 通信テスト未完 |
| レート制限 | express-rate-limit | Cloudflare Rate Limiting binding | ✅ 完了 |
| CORS | 自前 | Hono `cors()` | ✅ 完了 |

## 残タスク

1. **Storage V4 署名の実通信テスト**: 本番 GCS バケットに対して PUT/GET が通ること。Web Crypto の RSA-SHA256 サインが GCS の期待値と一致するかは実測必須。
2. **SSRF 強化（必要なら）**: 現状 URL リテラルチェックのみ。DNS rebinding は Cloudflare の edge 経由なので影響限定的だが、要件次第で DoH 経由の二段チェックを追加可能。
3. **Wrangler でのデプロイテスト**: `wrangler deploy` で本番投入し、SPA から実コール。
4. **`@cloudflare/workers-types` の Hono Context 型整合**: 現状 `c.env` の型推論が緩い。要 tighten。
5. **`firebase.json` の CSP 修正**: `connect-src` に Worker のドメイン（`https://aidev-og-worker.<account>.workers.dev` または カスタムドメイン）を追加。
6. **SPA 側の `VITE_OG_PROXY_URL` 切替**: 本番ビルドで Worker URL を指す。

## ローカル開発

```bash
cd cloudflare/og-worker
pnpm install
pnpm dev   # wrangler dev でローカル Workers ランタイム起動
```

## デプロイ

```bash
# 初回: シークレット投入
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY     # PEM の改行は \n でエスケープ
wrangler secret put STORAGE_BUCKET

# 配信
pnpm deploy
```

`wrangler.toml` の `compatibility_flags = ["nodejs_compat"]` は jose の一部 polyfill 用。
将来的に jose のみで完結すれば外せる。

## 性能見込み

- Cold start: 5-10ms（V8 isolate）
- OG fetch（実 HTML 取得込み）: 200ms-2s 程度（外部サイトの応答時間が支配的）
- CPU 時間: HTMLRewriter は SAX ストリーム処理なので通常 1-3ms。10ms 無料枠に収まる見込み。
- RSA-SHA256 署名: Web Crypto はハードウェア支援、1ms 未満。

## 既知の制約

- Node.js 専用 API（`node:dns`, `node:fs`, `undici`）は使えない
- 1 リクエストの Worker CPU 時間は無料 10ms（有料 $5/月 で 50ms）
- HTML サイズは Worker への流入帯域に課金されないが、`fetch` の subrequest は無料で 50/req まで

## セキュリティメモ

- サービスアカウント秘密鍵は **必ず `wrangler secret put`** で投入。`wrangler.toml` の `[vars]` には書かない（リポジトリに混入する）。
- 学院ポリシー次第で、CORS の `ALLOWED_ORIGINS` を SPA のドメインに絞り込むこと。
