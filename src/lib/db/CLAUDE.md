# src/lib/db

Firestore のコレクション別アクセス層。**コンポーネントから `getFirestore()` を直接触らない**ためのレイヤ。

## ファイル構成

- `converters.ts` — `withConverter` で型付き serialize/deserialize（Timestamp ↔ Date）
- `links.ts` / `questions.ts` / `notes.ts` / `apps.ts` — エンティティ別 CRUD + クエリ
- `users.ts` / `comments.ts` / `answers.ts` — 関連エンティティ
- `index.ts` — re-export

## 規約

- **クエリは TanStack Query から呼ぶ**。直接呼ばない（キャッシュ統一のため）。
- **集計フィールド（`answerCount` / `stats.likes` 等）は MVP 段階ではクライアント `increment()` で更新**。本番 Blaze 移行時に Cloud Functions トリガに置換する（[docs/runbooks/deploy.md](../../../docs/runbooks/deploy.md)）。
- **comments 作成時は親doc の visibility を `targetVisibility` に書き込む**。Rules が `get()` を使わずに親可視性を判断できるようにするため。
- **`createdAt` は `serverTimestamp()`、`updatedAt` も同様**。クライアント Date を絶対に使わない（時刻ずれ・改ざんリスク）。
- **`createdBy` / `role` / `handle` は create 後 update 不可**。Rules で強制しているのでクライアント側でも触らないこと。

## クエリパターン

- 一覧 + フィルタ → `query()` + `where()` + `orderBy()` + `limit()` + `getDocs()` を `useQuery` でラップ
- カウントバッジ → `getCountFromServer()` を staleTime 5分でキャッシュ
- 詳細・コメント・採用状態の即時反映 → MVP は invalidate、Phase 2 で `onSnapshot` 移行

## 注意点

- インデックスが必要な複合クエリは `firestore.indexes.json` に追加してから書く。Emulator では動いても本番で `failed-precondition` になる。
- `withConverter` を通さない `getDoc` は型補完が効かないので避ける。
