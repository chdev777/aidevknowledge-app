# src/components/compose

URLクエリ駆動の統合 Compose モーダル。Link / Question / Note / App の4種を1つのモーダルで切替投稿する。

## ファイル構成

- `ComposeModal.tsx` — エントリ。`?compose=link|question|note|app` を監視して開閉
- `LinkForm.tsx` / `QuestionForm.tsx` / `NoteForm.tsx` / `AppForm.tsx` — 種別ごとのフォーム本体
- `useDraft.ts` — localStorage 自動保存（500ms debounce）
- `TagInput.tsx` — 自由入力タグ（最大10件 / 各32字）
- `VisibilityRadio.tsx` — private / shared の2段階ラジオ

## 規約

- **モーダル開閉は URL クエリで駆動**。`history.pushState` ではなく React Router の `setSearchParams` を使う（戻るボタンで閉じられるように）。
- **下書きは localStorage `compose-draft-{kind}` キーで保存**。500ms debounce。投稿成功時に `removeItem`、キャンセル時は残す（誤閉じ復帰のため）。
- **タグは Zod で `min(0).max(10)` + 各 `min(1).max(32)`**。スキーマは `src/lib/schemas/common.ts`。
- **Visibility は private / shared の2段階のみ**（MVP）。limited / archived は Phase 2 のプロジェクト機能と合わせて拡張する。

## 注意点

- フォーム送信時に `handleSubmit` 内で `await` する処理（OG取得など）は loading 表示を必ず出す。失敗してもモーダルは閉じない（下書き保護）。
- `useDraft` の debounce は `useEffect` のクリーンアップで `clearTimeout` 必須。コンポーネントアンマウント時の保存漏れを防ぐ。
- `TagInput` は IME 確定中の Enter で submit しないよう `compositionend` を監視している。
