# テストアカウント

`pnpm seed` でシード投入されるテストユーザー。すべてメール検証済み状態。

## ログイン情報

| メールアドレス | パスワード | uid | 名前 | ハンドル | ロール |
|---|---|---|---|---|---|
| `sato.k@example.ac.jp` | `testtest` | `u1` | 佐藤 健一 | `sato.k` | **管理者** |
| `matsuoka.m@example.ac.jp` | `testtest` | `u2` | 松岡 真理 | `matsuoka.m` | 情報支援 |
| `kimura.r@example.ac.jp` | `testtest` | `u3` | 木村 亮介 | `kimura.r` | DX推進 |

## 各ユーザーの保有データ（seed 時点）

### 佐藤 健一（u1, 管理者）
- **URL**: 2 件（うち private 1 件 = `l4` プロンプトインジェクション対策）
- **質問**: `q1` PDF内の表データをRAGで扱う方法は？（未回答）
- **回答**: `a3-2`（q3 への補足回答）
- **検証メモ**: `n3` Claude Sonnet vs GPT-4o（**private**）
- **作成アプリ**: `app3` 問い合わせ分類AI
- **コメント**: 2 件

### 松岡 真理（u2, 情報支援）
- **URL**: 2 件（すべて shared）
- **質問**: `q2` DifyとLangChainの使い分け（回答中）
- **回答**: `a3-1`（q3 の **採用済み** 回答）
- **検証メモ**: `n2` 議事録要約のプロンプト比較
- **作成アプリ**: `app1` 議事録要約アプリ
- **コメント**: 2 件

### 木村 亮介（u3, DX推進）
- **URL**: 1 件（shared）
- **質問**: `q3` YouTube動画を要約してナレッジ化したい（解決済み）
- **回答**: `a2-1`（q2 への回答）
- **検証メモ**: `n1` Difyで FAQ 検索アプリを試作
- **作成アプリ**: `app2` FAQ検索アプリ
- **コメント**: 2 件

## 動作確認の観点

| 検証したい挙動 | 推奨アカウント | 確認手順 |
|---|---|---|
| visibility = private が本人のみ可視 | 佐藤でログイン | `/links/l4`、`/notes/n3` が見える |
| 別ユーザーから private が見えない | 松岡 or 木村でログイン | 上記2件にアクセスすると `/forbidden` |
| 採用済み回答の表示 | 誰でも | `/qa/q3` で `a3-1` に「採用」マーク |
| Q&A 投票 / 採用ボタン | 木村でログイン | `/qa/q3` で質問者本人 → 採用ボタンが表示される |
| マイページ自分の投稿表示 | 各ユーザー | `/me` で 5 タブが正しい件数を表示 |
| 公開状態切替（共有 ↔ 非公開） | 各ユーザー | マイページの行から「非公開にする」ボタン |
| 管理画面アクセス | 佐藤でログイン | Sidebar に「管理」が出る → `/admin` でユーザー / タグ / モデレーション |
| 管理画面ガード | 松岡 or 木村でログイン | Sidebar に「管理」が出ない / `/admin` 直叩きで警告表示 |

## 再シード

データを初期状態に戻したい場合：

```bash
docker compose exec app pnpm seed
```

`tools/scripts/env-guard.ts` が `FIRESTORE_EMULATOR_HOST` 未設定 / project ID に "prod" を含む場合は abort するので、本番に誤接続することはない。

完全リセットは：

```bash
docker compose down -v
rm -rf ./.emulator-data
docker compose up -d
docker compose exec app pnpm install   # 初回のみ
docker compose exec app pnpm seed
```

## 関連ドキュメント

- [dev-setup.md](./dev-setup.md) — 開発環境全体のセットアップ
- [../data-model.md](../data-model.md) — Firestore コレクション設計
- `tools/scripts/seed.ts` — シードスクリプト本体（ID とデータの正本）
