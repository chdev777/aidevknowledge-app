# 開発環境セットアップ

## 前提

- **Docker Desktop** インストール済み（WSL2 backend 推奨）
- **pnpm** インストール済み（`npm install -g pnpm`）
- ポートが空いていること：`3000, 4000, 8080, 8787, 9001, 9099`

## 初回セットアップ

```bash
git clone <repo>
cd aidevknowledge
cp .env.example .env
docker compose up -d
docker compose exec app pnpm install
docker compose exec app pnpm seed
```

## 起動確認

| URL | 用途 |
|---|---|
| http://localhost:3000 | アプリ本体（Vite dev） |
| http://localhost:4000 | Firebase Emulator UI（Auth/Firestore操作） |
| http://localhost:9001 | MinIO Console（バケット確認） |
| http://localhost:8787/health | og-proxy ヘルスチェック |

## サービス構成

```
docker-compose.yml
├─ app                   ports 3000        Vite dev (pnpm dev --host)
├─ firebase-emulator     ports 9099/8080/4000  Auth / Firestore / UI
├─ minio                 ports 9001 (Consoleのみホスト公開)
├─ minio-init            oneshot           bucket作成 + IAM policy
└─ og-proxy              ports 8787        Express + 署名URL発行
```

`og-proxy` は MinIO アクセスキーを保持する唯一の場所。**SPA には絶対に渡さない**。

## よく使うコマンド

```bash
# ログ確認
docker compose logs -f app
docker compose logs -f firebase-emulator
docker compose logs -f og-proxy

# シード再投入
docker compose exec app pnpm seed

# テスト
docker compose exec app pnpm test          # vitest 単体
docker compose exec app pnpm test:rules    # Firestore Rules

# ビルド
docker compose exec app pnpm build

# 停止（emulatorデータは ./.emulator-data に export される）
docker compose down

# データを完全リセット
docker compose down -v
rm -rf ./.emulator-data
```

## Firestore Emulator のデータ永続化

Emulator 起動時に `--import=./.emulator-data --export-on-exit` を指定。`docker compose down` で SIGTERM 後、export完了まで `stop_grace_period: 30s` 待機する。

**手動 export:**

```bash
docker compose exec firebase-emulator \
  firebase emulators:export ./.emulator-data --force
```

## トラブルシュート

### Vite HMR が効かない（Docker × Windows）

`vite.config.ts` で `server.watch.usePolling: true` を有効化。CPUに負荷がかかるため、開発しないときは `docker compose stop app` で止める。

### Firestore Emulator が起動しない

Java 不足の可能性。`Dockerfile.emulator` で `default-jre-headless` を入れているが、ベースイメージを変えた場合は要再ビルド：

```bash
docker compose build firebase-emulator
```

### MinIO の bucket がない

`minio-init` サービスがエラーで止まっている：

```bash
docker compose logs minio-init
docker compose up -d minio-init
```

### og-proxy が 502 を返す

Firebase Emulator が先に起動完了していない。`docker compose restart og-proxy`。

### emulator export が失敗（docker compose down で）

`stop_grace_period` を超えた可能性。停止前に手動 export：

```bash
docker compose exec firebase-emulator firebase emulators:export ./.emulator-data --force
docker compose down
```

### `.env` の `VITE_*` を変更しても反映されない

Vite はビルド時に環境変数を埋め込むため、変更したら **app コンテナを再起動**：

```bash
docker compose restart app
```

## 認証情報

シードで作成されるテストユーザー：

| メール | パスワード | role |
|---|---|---|
| sato.k@example.ac.jp | testtest | DX推進 |
| matsuoka.m@example.ac.jp | testtest | 情報支援 |
| kimura.r@example.ac.jp | testtest | DX推進 |

すべてメール検証済み状態でシード投入される。

## セキュリティ注意

- `.env` を **コミットしない**（`.gitignore` 設定済）
- MinIO のアクセスキーは `.env.example` の値を必ず変更（`openssl rand -hex 16`）
- 本番Firebase に誤接続しないよう、`scripts/env-guard.ts` が自動チェック
