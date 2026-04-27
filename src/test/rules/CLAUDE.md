# src/test/rules

Firestore Rules のユニットテスト。`@firebase/rules-unit-testing` を使い、Emulator に対して読み書きを試行して許可/拒否を検証する。

## ファイル構成

- `helpers.ts` — テスト環境 setup / teardown、`getAuthedFirestore(uid)` ヘルパ
- `users.spec.ts` — `users/{uid}` と private profile の改ざん防止
- `links.spec.ts` / `comments.spec.ts` / `answers.spec.ts` / `favorites-tags.spec.ts`

## 実行

```bash
pnpm test:rules     # vitest run --dir src/test/rules
```

Emulator が起動している必要がある（`docker compose up -d`）。

## 規約

- **1 spec = 1 リソース**。`describe` ブロックで `read` / `create` / `update` / `delete` を分ける。
- **Rules を変更したら必ず該当 spec を追加 or 更新**。既存 30+ ケースは安全網。減らさない。
- **テストデータは `helpers.ts` の `seedDoc()` 経由で投入**（admin SDK 経由でルールバイパス）。Rules の検証は authed クライアント側で行う。
- **`assertSucceeds` / `assertFails` を必ず使う**。`expect().toThrow()` だと Rules 拒否以外の例外も拾ってしまう。

## 注意点

- `RULES_TEST_PROJECT_ID` を本物と被らせない（`demo-aidev-rules-test` 固定）。
- テスト終了時に `cleanup()` を必ず呼ぶ。Emulator の状態が残るとフレーキーになる。
- `request.auth.token.role` は Emulator ではカスタムクレームを `signInWithCustomToken` 経由で偽装する必要がある。`helpers.ts` の `getAuthedFirestoreWithRole()` を使う。
