# AIアプリ開発ナレッジ共有ハブ

DX推進担当者と情報支援グループ向けの、AIアプリ開発ナレッジ共有Webアプリ。外部URL／Q&A／検証メモ／作成アプリ／コメントレビューを蓄積・共有する。

## 構成

| レイヤ | PoC（ローカルDocker） | 本番（Firebase Blaze） |
|---|---|---|
| フロントエンド | Vite + React 18 + TypeScript SPA | 同左（静的ビルド） |
| ホスティング | Vite dev server `:3200` | Firebase Hosting |
| 認証 | Firebase Auth Emulator `:9299` | Firebase Auth + Identity Platform |
| DB | Firestore Emulator `:8280` | Firestore |
| ストレージ | MinIO Console `:9201` (S3互換) | Firebase Storage |
| OG/サムネ取得 | dev用 Express プロキシ `:8987` | Cloud Functions |

## クイックスタート

前提：Docker Desktop / pnpm がインストール済み。

```bash
cp .env.example .env
docker compose up -d
docker compose exec app pnpm install
docker compose exec app pnpm seed
```

ブラウザで以下を開く：

- http://localhost:3200 — アプリ
- http://localhost:4200 — Firebase Emulator UI
- http://localhost:9201 — MinIO Console
- http://localhost:8987/health — og-proxy ヘルスチェック

> ホスト公開ポートはデフォルトから **+200 シフト** しています（他Dockerプロジェクトとの衝突回避）。コンテナ内部のポートはデフォルトのままです。

### テストアカウント

`pnpm seed` で 3 名のテストユーザーが投入されます（パスワードは全員 `testtest`）：

| メール | 名前 | ロール |
|---|---|---|
| `sato.k@example.ac.jp` | 佐藤 健一 | DX推進 |
| `matsuoka.m@example.ac.jp` | 松岡 真理 | 情報支援 |
| `kimura.r@example.ac.jp` | 木村 亮介 | DX推進 |

各ユーザーの保有データ・動作確認シナリオは [docs/runbooks/test-accounts.md](docs/runbooks/test-accounts.md) を参照。

詳細手順は [docs/runbooks/dev-setup.md](docs/runbooks/dev-setup.md)。

## ドキュメント

| ファイル | 内容 |
|---|---|
| [docs/architecture.md](docs/architecture.md) | システム構成・データフロー |
| [docs/data-model.md](docs/data-model.md) | Firestore コレクション・フィールド・Rules |
| [docs/runbooks/dev-setup.md](docs/runbooks/dev-setup.md) | 開発環境セットアップ |
| [docs/runbooks/test-accounts.md](docs/runbooks/test-accounts.md) | テストアカウント一覧と動作確認シナリオ |
| [docs/security.md](docs/security.md) | Firestore/Storage Rules、CSP、認証ポリシー |
| [docs/runbooks/deploy.md](docs/runbooks/deploy.md) | 本番Firebase（Blaze）移行手順 |
| [docs/scope.md](docs/scope.md) | MVPスコープと将来計画 |
| [docs/ui-design.md](docs/ui-design.md) | UIデザイン規約（oklch / hairline / フォント） |
| [docs/review-findings.md](docs/review-findings.md) | 設計レビュー結果（architect / security / planner） |
| [docs/decisions/](docs/decisions/) | 技術選定の根拠（ADR） |

## デザイン参照

`design-reference/` に Claude Design からの hi-fi プロトタイプ（HTML/CSS/JS）と要件定義書を保管。実装の一次資料として参照する（複製禁止）。詳細は [design-reference/README.md](design-reference/README.md)。

## ライセンス

Internal use only.
