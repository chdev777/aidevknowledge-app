# AIアプリ開発ナレッジ共有ハブ — Claude Code 用プロジェクトメモリ

DX推進担当者と情報支援グループ向け、AIアプリ開発のナレッジ（外部URL／Q&A／検証メモ／作成アプリ／コメント）を蓄積・共有する社内Webアプリ。
PoC（ローカルDocker）と本番（Firebase Blaze）を環境変数と Storage Provider 切替だけで両対応する設計。

## 技術スタック

- **フロント**: Vite + React 18 + TypeScript（pnpm 9.12 / Node 20+）
- **ルーティング**: React Router v6 / 状態管理: TanStack Query v5
- **DB**: Firestore（PoC: Emulator / 本番: 本物）
- **認証**: Firebase Auth（PoC: Emulator / 本番: Identity Platform）
- **ストレージ**: PoC は MinIO + og-proxy 署名URL、本番は Firebase Storage 直
- **検証**: Zod / テスト: Vitest（unit + Rules）

## クイックスタート

```bash
cp .env.example .env
docker compose up -d
docker compose exec app pnpm install
docker compose exec app pnpm seed
```

| URL | 用途 |
|---|---|
| http://localhost:3200 | アプリ |
| http://localhost:4200 | Firebase Emulator UI |
| http://localhost:9201 | MinIO Console |
| http://localhost:8987/health | og-proxy ヘルスチェック |

ホスト公開ポートはデフォルトから **+200 シフト**（他Dockerプロジェクトとの衝突回避）。詳細は [docs/runbooks/dev-setup.md](docs/runbooks/dev-setup.md)。

## プロジェクト構造

```
.
├── CLAUDE.md                        ← このファイル（プロジェクト全体の指針）
├── README.md                        利用者向けの入り口
├── HANDOVER.md                      最新セッション引き継ぎノート
├── docs/
│   ├── architecture.md              システム構成・データフロー
│   ├── data-model.md                Firestore スキーマと Rules 概要
│   ├── security.md                  Rules / CSP / 認証ポリシー
│   ├── scope.md                     MVP スコープと将来計画
│   ├── ui-design.md                 UI 規約（oklch / hairline / フォント）
│   ├── review-findings.md           設計レビュー結果
│   ├── decisions/                   ADR（技術選定の根拠）
│   └── runbooks/                    開発・運用手順
├── .claude/
│   ├── settings.local.json          Claude Code 権限設定
│   ├── hooks/                       自動化フック
│   └── skills/                      再利用可能なAIワークフロー
├── tools/
│   ├── scripts/                     CLI ユーティリティ（seed / env-guard）
│   └── prompts/                     LLM プロンプトテンプレート（必要に応じて）
├── src/
│   ├── pages/                       ルート単位のページ
│   ├── components/                  共通UI（compose は CLAUDE.md あり）
│   ├── lib/
│   │   ├── firebase/                ★CLAUDE.md：bootstrap 順序・auth context
│   │   ├── db/                      ★CLAUDE.md：converter / クエリパターン
│   │   ├── storage/                 Provider 抽象（MinIO / Firebase Storage）
│   │   ├── schemas/                 Zod スキーマ
│   │   └── utils/                   検索・URL検出・ロガー
│   └── test/
│       ├── unit/                    Vitest unit
│       └── rules/                   ★CLAUDE.md：Firestore Rules テスト
├── design-reference/                ★CLAUDE.md：編集禁止（実装の正）
├── docker/                          Dockerfile・emulator 設定
├── firestore.rules / firestore.indexes.json
└── storage.rules / firebase.json
```

## 設計方針（破ってはいけない原則）

1. **MinIO のシークレットは SPA に渡さない**（`VITE_*` はビルド成果物に埋め込まれる）。鍵は og-proxy のサーバ環境変数のみで保持し、SPA は署名URL経由でアクセスする。
2. **`createdBy` / `createdAt` / `role` / `handle` は update 不可**。Rules の `immutableOnUpdate()` で強制。
3. **管理者ロールは招待のみ**。自己申告サインアップは `['DX推進','情報支援']` のみ。
4. **comments は親docの visibility を `targetVisibility` に非正規化保持**（Rules の `get()` コスト回避）。
5. **`design-reference/` と `src/globals.css` は編集禁止**。CSS追加は `src/extra.css` に集約。
6. **本番 Blaze の課金事故対策**: 予算アラート3段（$1/$5/$20）+ 自動停止 Function + Storage Rules + maxInstances + App Check。

詳細は [docs/decisions/](docs/decisions/) と [docs/security.md](docs/security.md) を参照。

## コマンド

```bash
pnpm dev          # Vite dev (Docker 内)
pnpm build        # 本番ビルド
pnpm lint         # tsc --noEmit
pnpm test         # Vitest unit
pnpm test:rules   # Firestore Rules テスト
pnpm seed         # サンプルデータ投入（Emulator向け、env-guard 通過必須）
```

## 関連ドキュメント

- [HANDOVER.md](HANDOVER.md) — 直近セッションの実装履歴と決定事項
- [docs/architecture.md](docs/architecture.md) — レイヤ構成・データフロー
- [docs/data-model.md](docs/data-model.md) — Firestore コレクション設計
- [docs/decisions/](docs/decisions/) — ADR 一覧
- [docs/runbooks/dev-setup.md](docs/runbooks/dev-setup.md) — 開発環境セットアップ
- [docs/runbooks/deploy.md](docs/runbooks/deploy.md) — 本番 Blaze 移行手順
