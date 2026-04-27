# データモデル

## コレクション一覧

すべての投稿系コレクションに以下の共通フィールド：

- `createdBy: string` — 投稿者UID（**update不可**）
- `visibility: 'private' | 'shared'`
- `createdAt: Timestamp` — `serverTimestamp()`、**update不可**
- `updatedAt: Timestamp` — `serverTimestamp()`

| コレクション | 主フィールド |
|---|---|
| `users/{uid}` | `name, handle, role, color, avatarPath?` |
| `users/{uid}/private/profile` | `email, createdAt`（PII分離、本人のみ） |
| `handles/{handle}` | `uid, createdAt`（ユニーク制約ロック） |
| `links/{id}` | `title, url, sourceType, domain, summary, userComment, importance, status, tags[], thumbnailUrl?, thumbnailPath?` |
| `questions/{id}` | `title, body, status, tags[], answerCount, acceptedAnswerId?` |
| `questions/{qid}/answers/{aid}` | `body, votes, accepted` |
| `notes/{id}` | `title, purpose, tried, result, conclusion, tags[], links[], attachments[]` |
| `apps/{id}` | `name, url, summary, purpose, technologies[], aiModel, usageScope, status, caution, tags[], stats{views,comments,likes}, thumbnailPath?` |
| `comments/{id}` | `targetType, targetId, type, body, targetVisibility` |
| `tags/{id}` | `name, type` |
| `projects/{id}` | `name, description, status, owner, color` |
| `favorites/{uid}/items/{id}` | `targetType, targetId, createdAt` |

## 列挙値

| 項目 | 値 |
|---|---|
| `users.role` | `'DX推進' \| '情報支援' \| '管理者'`（管理者は招待のみ、自己申告不可） |
| `links.sourceType` | `'YouTube' \| 'X' \| 'GitHub' \| '記事' \| '公式Docs' \| 'Web'` |
| `links.importance` | `'高' \| '中' \| '低'` |
| `links.status` | `'未確認' \| '確認中' \| '検証済み' \| '採用候補' \| '保留'` |
| `questions.status` | `'未回答' \| '回答中' \| '解決済み' \| '保留'` |
| `apps.status` | `'試作' \| '検証中' \| '利用中' \| '改善中' \| '停止中'` |
| `apps.usageScope` | `'個人検証' \| 'グループ内' \| '関係者限定' \| '学内公開'` |
| `comments.targetType` | `'link' \| 'question' \| 'note' \| 'app'` |
| `comments.type` | `'感想' \| '改善提案' \| '不具合報告' \| '活用アイデア' \| '技術メモ' \| 'セキュリティ指摘'` |
| `tags.type` | `'技術' \| 'ツール' \| '開発' \| '用途' \| 'セキュリティ' \| '状態'` |

## サイズ制限（zod + Rules で二重チェック）

| 項目 | 制限 |
|---|---|
| title / name | 1〜200文字 |
| url | 1〜2000文字、`http(s)://` のみ |
| handle | 3〜32文字、`[a-zA-Z0-9_.-]` |
| 検証メモ purpose / result | ≤ 4000文字 |
| 検証メモ tried | ≤ 8000文字 |
| 検証メモ conclusion / アプリ caution | ≤ 2000文字 |
| 質問 body / 回答 body | ≤ 8000文字 |
| コメント body | 1〜2000文字 |
| tags | 最大10個、各32文字、trim + 重複除去 |
| アバター画像 | ≤ 2MB、`image/(jpeg\|png\|webp)`、SVG禁止 |
| リンクサムネ・アプリサムネ | ≤ 5MB、`image/*` |
| 検証メモ添付 | ≤ 10MB、`exe/sh/bat/ps1/js/html/svg` 拒否 |

## targetVisibility 非正規化の運用

コメント作成時、クライアントは親doc（link/question/note/app）の `visibility` を読んで
`targetVisibility` フィールドにコピーする。

これにより Firestore Rules が `get()` を呼ばずに済み、コスト面で有利。

**親の visibility が後で変更されたとき：**
MVP ではコメント側の `targetVisibility` 同期はしない（要件書 §8 「非公開に戻すと
コメントも閲覧不可」と整合）。Phase 2 で Cloud Functions の `onUpdate` トリガで
一括同期する予定。

## 必要な複合インデックス

`firestore.indexes.json` に登録：

| コレクション | フィールド |
|---|---|
| links / notes / apps / questions | `(visibility ASC, createdAt DESC)` |
| links / notes / apps / questions | `(createdBy ASC, createdAt DESC)` |
| links | `(visibility, status, createdAt)` / `(visibility, sourceType, createdAt)` |
| questions | `(visibility, answerCount, createdAt)` ← 未回答 |
| comments | `(targetType, targetId, createdAt)` / `(createdBy, createdAt)` |

## Firestore Rules ハイライト

完全な定義は `firestore.rules` を参照。重要なヘルパ：

```js
function commonCreate(d) {
  return signedIn()
    && d.createdBy == request.auth.uid
    && d.createdAt == request.time
    && d.visibility in ['private', 'shared']
    && d.tags is list && d.tags.size() <= 10;
}
function immutableOnUpdate(prev, next) {
  return next.createdBy == prev.createdBy
    && next.createdAt == prev.createdAt;
}
```

**特に重要なRule:**

- `users` 作成時 `role in ['DX推進','情報支援']` のみ（管理者は招待のみ）
- `users` 更新時 `role`/`handle` 不変
- `comments` 読取は `targetVisibility=='shared'` または所有者
- `answers` 更新は3パターン：
  - 投稿者本文編集 (votes/accepted不変)
  - 質問者の `accepted` 切替のみ
  - 第三者の votes ±1 のみ
- `tags` / `projects` への書込は全ユーザー拒否（admin SDK専用）
- `favorites/{uid}/items/{id}` は本人のみ

## Rules テスト

`@firebase/rules-unit-testing` で30+ケース：
- private/shared の read/write 切り分け
- createdBy / role / handle 改ざん拒否
- comments の親 visibility 連動
- answers の3パターン update 検証
- tags/projects 書込全拒否
- favorites 他人パス拒否
