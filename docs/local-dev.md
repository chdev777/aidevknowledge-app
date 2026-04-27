# 開発環境セットアップ

## 前提

- **Docker Desktop** インストール済み（WSL2 backend 推奨）
- **pnpm** インストール済み（`npm install -g pnpm`）
- ホスト公開ポートが空いていること：`3200, 4200, 8280, 8987, 9201, 9299`
  （他のDockerプロジェクトとの衝突を避けるため、デフォルトから **+200 シフト** している）

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
| http://localhost:3200 | アプリ本体（Vite dev） |
| http://localhost:4200 | Firebase Emulator UI（Auth/Firestore操作） |
| http://localhost:9201 | MinIO Console（バケット確認） |
| http://localhost:8987/health | og-proxy ヘルスチェック |

## サービス構成

ホスト公開ポート（左）とコンテナ内部ポート（右、不変）：

```
docker-compose.yml
├─ app                   3200 → 3000        Vite dev (pnpm dev --host)
├─ firebase-emulator     9299 → 9099        Auth
│                        8280 → 8080        Firestore
│                        4200 → 4000        Emulator UI
├─ minio                 9201 → 9001        Console（9000 は internal network のみ）
├─ minio-init            oneshot            bucket作成 + IAM policy
└─ og-proxy              8987 → 8787        Express + 署名URL発行
```

> ホスト公開ポートはデフォルトから **+200 シフト**。コンテナ内部のポートはデフォルトのままなので、Firebase SDK や og-proxy のコードは何も変更不要。

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

### ポートが既に使われている（"port is already allocated"）

別の Docker プロジェクトが同じホストポートを掴んでいる可能性。確認：

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

または OS レベル：

```bash
# Windows PowerShell
netstat -ano | findstr :3200
```

`docker-compose.yml` のホスト側ポート（左の数字）を空いているものに変更してから
`docker compose up -d`。`.env` の `VITE_FIREBASE_AUTH_EMULATOR_HOST` /
`VITE_FIRESTORE_EMULATOR_HOST` / `VITE_OG_PROXY_URL` も合わせて更新する。

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
