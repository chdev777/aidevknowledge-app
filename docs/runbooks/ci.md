# CI / CD 運用手順

GitHub Actions による自動チェックと Firebase Rules / indexes デプロイの運用ガイド。

## 概要

```
┌─────────────────────┐         ┌──────────────────────────────┐
│ PR open / push to * │ ──────► │ ci.yml                       │
│                     │         │  - lint (tsc)                │
│                     │         │  - unit-test (vitest)        │
│                     │         │  - rules-test (Emulator)     │
└─────────────────────┘         └──────────────────────────────┘

┌─────────────────────┐         ┌──────────────────────────────┐
│ push to main        │ ──────► │ deploy-rules.yml             │
│ + rules/indexes 変更│         │  - rules-test 再実行         │
│                     │         │  - firebase deploy           │
└─────────────────────┘         └──────────────────────────────┘
```

## ワークフロー一覧

### `.github/workflows/ci.yml`

| ジョブ | 内容 | 失敗時の影響 |
|---|---|---|
| `lint` | `pnpm lint`（tsc --noEmit） | PR がマージブロック対象（branch protection 設定後） |
| `unit-test` | `pnpm test`（vitest unit） | 同上 |
| `rules-test` | `firebase emulators:exec` で Firestore Emulator を起動し `pnpm test:rules` | 同上 |

3 ジョブは並列実行。各ジョブで `pnpm install --frozen-lockfile` + pnpm cache を使う。

### `.github/workflows/deploy-rules.yml`

`main` への push かつ以下のいずれかが変更された時のみ起動:

- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`
- `.github/workflows/deploy-rules.yml` 自体

`workflow_dispatch` で緊急時の手動実行も可能。

実行内容:
1. `pnpm install`
2. Emulator 経由で `pnpm test:rules` を再実行（最終防壁）
3. `firebase deploy --only firestore:rules,firestore:indexes --project aidevknowledge-app`

## GitHub Secrets 設定

リポジトリの **Settings → Secrets and variables → Actions → New repository secret** に以下を登録:

| Secret 名 | 値 | 用途 |
|---|---|---|
| `FIREBASE_TOKEN` | `secrets/firebase-ci-token.txt` の中身 | `firebase deploy` 認証 |

### 初回登録手順

```bash
# ローカルでトークン取得（Docker 内、--no-localhost で OAuth コードを表示）
docker compose exec app pnpm dlx firebase-tools@latest login:ci --no-localhost

# 表示されたトークンをコピーし、ファイルに保存（git には含めない）
# secrets/firebase-ci-token.txt に貼り付け（既存の場合は上書き）

# GitHub に登録（gh CLI 経由 or Web UI）
gh secret set FIREBASE_TOKEN --body "$(cat secrets/firebase-ci-token.txt)"
```

GitHub Web UI で登録する場合は、`secrets/firebase-ci-token.txt` の中身をそのまま貼り付ける。改行を含めない。

## ローテーション手順

`FIREBASE_TOKEN` は本番 Firestore に対する書き込み権限を持つため、以下の場合に必ずローテーションする:

- リポジトリ Collaborator が抜けた / 解雇された
- Token が user-visible なログ・チャット・PR コメント等に流出した可能性がある
- 半年以上経過した（定期ローテーション）

### 手順

```bash
# 1. 既存トークンを失効
docker compose exec app pnpm dlx firebase-tools@latest logout --token "$(cat secrets/firebase-ci-token.txt)"

# 2. 新トークン取得
docker compose exec app pnpm dlx firebase-tools@latest login:ci --no-localhost

# 3. ローカルファイル更新
# secrets/firebase-ci-token.txt を上書き

# 4. GitHub Secret 更新
gh secret set FIREBASE_TOKEN --body "$(cat secrets/firebase-ci-token.txt)"

# 5. workflow を手動実行して確認
gh workflow run deploy-rules.yml
gh run watch
```

## Branch Protection 推奨設定

`main` ブランチに以下を適用（**Settings → Branches → Add branch protection rule**）:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - `lint`
  - `unit-test`
  - `rules-test`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

## トラブルシューティング

### CI で `rules-test` が timeout

Emulator の起動に Java が必要。`actions/setup-java@v4` が呼ばれているか確認。
`firebase emulators:exec` のデフォルトタイムアウトは 60 秒だが、`--export-on-exit` 等を使うと延びる。`vitest.config.ts` の `testTimeout: 15_000` も影響する。

### `deploy-rules.yml` が `FIREBASE_TOKEN secret is not set` で失敗

GitHub Secrets に `FIREBASE_TOKEN` が登録されていない。「初回登録手順」を実施。

### `auth/invalid-credential` で deploy 失敗

トークンが失効している可能性。「ローテーション手順」を実施。

### CI ローカル再現

CI と同じ流れを Docker 内で再現:

```bash
docker compose exec app sh -c "pnpm install --frozen-lockfile"
docker compose exec app pnpm lint
docker compose exec app pnpm test
# rules-test は Emulator が必要（docker compose up -d で起動済を前提）
docker compose exec app pnpm test:rules
```

## 関連ドキュメント

- [docs/runbooks/prod-deploy.md](prod-deploy.md) — Cloudflare Pages / Workers のデプロイ
- [docs/runbooks/dev-setup.md](dev-setup.md) — ローカル開発環境
- [HANDOVER.md](../../HANDOVER.md) — セッション履歴と決定事項
