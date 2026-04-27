# src/lib/firebase

Firebase クライアント初期化・認証コンテキスト・ユーザー bootstrap を担う層。

## ファイル構成

- `client.ts` — Firebase アプリ初期化、Emulator 接続切替（`VITE_USE_EMULATOR`）
- `auth-context.tsx` — `AuthProvider` / `useAuth()`、`onAuthStateChanged` 購読
- `bootstrap-user.ts` — サインアップ直後の users + handles + private profile 順序保証作成

## 規約

- **Emulator 接続は client.ts で一元管理**。コンポーネントから直接 `connectFirestoreEmulator` を呼ばない。
- **`bootstrapUser()` は順序保証必須**: `handles/{handle}` を先に作成 → 失敗時にユニーク違反として検知 → その後 `users/{uid}` と `users/{uid}/private/profile`。途中失敗時のリカバリは UI 側で再試行を促す。
- **role の自己申告は `['DX推進','情報支援']` のみ**。それ以外（管理者など）は招待フロー（未実装）または管理者の Firestore 直接更新で付与する。
- **auth-context は React state + Firebase の二重管理を避ける**。`onAuthStateChanged` の結果のみを真実とする。

## 注意点

- Auth Emulator の ID Token は本物と署名検証が異なる。本番 Cloud Functions（blocking trigger 等）と接続するときは staging Firebase プロジェクトでドライラン必須。
- `client.ts` の Emulator 接続は HMR 時に重複呼び出しでエラーになるため `if (!globalThis.__FB_EMU_CONNECTED__)` のようなガードを置いている。触るときは要注意。
