# MVPスコープと将来計画

## MVP（このリポジトリの実装範囲）

### 実装済み

- 認証：Firebase Auth メール/パスワード（サインアップ・ログイン・サインアウト・パスワードリセット）
- 公開状態管理：private / shared の2段階
- ホーム：クイックアクション、ナレッジフロー、最近のURL/未回答質問/メモ/アプリ、メトリクス
- URL共有：一覧（フィルタ：ステータス/種別、検索：タイトル+概要+コメント）、詳細、コメント
- Q&A：一覧、詳細、回答投稿、採用回答（質問者のみ）、投票±1（クライアント増分）
- 検証メモ：一覧、4フィールド構造（目的/試したこと/結果/結論）、コメント
- 作成アプリ：一覧、詳細（仕様グリッド + 注意事項 + 6種コメントバッジ）、コメント
- マイページ：プロフィール、5列メトリクス、5タブ実装（URL/質問/メモ/アプリ/コメント履歴）+
  公開状態切替（確認ダイアログ）+ 公開状態フィルタ
- 検索：タイトル部分一致、client-side filter（NFKC + ひらがな↔カタカナ正規化、AND）
- タグ：自由入力（最大10個、各32文字、trim + 重複除去）
- 下書き：localStorage 自動保存（500ms debounce、kind単位）
- OG/サムネ自動取得：dev用 Express プロキシ経由（YouTube は URL pattern 先行）
- ストレージ：MinIO（PoC）/ Firebase Storage（本番、設定済み）の Provider 抽象化
- セキュリティ：Firestore Rules 強化版（30+ ケーステスト済）、CSP/security headers、URL検証、markdown sanitize
- 運用レイヤ：ErrorBoundary、logger（PIIマスク）、AppError、ConfirmDialog

### 後回し（Phase 2）

| 機能 | 理由 |
|---|---|
| お気に入り（タブのプレースホルダのみ実装） | MVP優先度「中」、Rules は先行定義済み |
| 下書きタブ（プレースホルダのみ） | localStorage で自動保存は実装済み、リスト表示は後回し |
| プロジェクト機能 UI | データモデルは `projectId?` で先行確保、画面は後回し |
| タグマスタ管理画面 | 自由入力で代替中 |
| 管理画面 | 投稿管理・ユーザー管理・タグ正規化 |
| 集計フィールドの Cloud Functions 化 | `answerCount`, `stats` をクライアント信頼で運用中 |
| 投票の二重投票防止サーバ側 | MVP はローカルstateで暫定 |
| comments の親 visibility 同期 | `onUpdate` Function で一括更新（要件書 §8 と整合） |
| ホームのアクティビティフィード | プロトタイプにあり、MVP では非表示 |
| ホームのプロジェクトサマリ枠 | 同上 |
| Tweaks Panel UI | CSS変数だけ用意済み、UI は出さない |
| アプリ詳細の「いいね」ボタン | 整合性リスクのため非表示 |
| Identity Platform / 学内ドメイン制限 / blocking trigger | 本番Blaze移行で実装 |
| App Check 有効化 | 本番Blaze必須、PoCでは無効 |
| 予算超過自動停止 Function | 本番Blaze必須 |
| 監査ログ UI | コレクションは予約、Phase 2 で表示 |

### 将来検討（Phase 3）

| 機能 | 検討事項 |
|---|---|
| AI要約 | 検証メモ・URL の本文要約 |
| AI検索 | 全文検索 + 意味検索（Algolia / Typesense / Vertex AI Vector Search） |
| pgvector | Firestore はベクトル不向き、別ストア前提 |
| Google Workspace SSO | Identity Platform で SAML 対応 |
| LDAP | 本格的な学内認証連携 |
| E2E (Playwright) | 重要フローの自動化 |

## テストカバレッジ目標

MVP は **`lib/` 60% 程度**を目標。理由：

- Firestore Rules は別途 `@firebase/rules-unit-testing` で 30+ ケーステスト済み
- UI コンポーネントは設計回帰（プロトタイプ並列確認）で代替
- E2E は Phase 2 で Playwright 導入予定

実装済み単体テスト：
- `url-detect.spec.ts` — sourceType推定、isSafeHref、YouTube videoId抽出
- `schemas.spec.ts` — zod 検証（javascript: URL、サイズ上限、未知enum）
- `search.spec.ts` — 部分一致、ひらがな↔カタカナ、AND検索

## 受け入れ基準（MVP）

[runbooks/dev-setup.md](./runbooks/dev-setup.md) の動作確認チェックリスト全項目通過。
特に：

- 別ユーザーで他人の private 投稿を直接URL叩く → ForbiddenPage
- マイページ「非公開にする」→ 一覧から消える、再公開で復活
- Q&A：質問者だけが採用ボタンを押せる
- URL登録時にYouTubeなら ytimg URL 自動セット、その他は og-proxy 経由
- アバター画像アップロード時、SPAコードに MinIO シークレットが見えない
- ピクセルパーフェクト（1280px viewport）：サイドバー236px、hairline 1px、oklch カラー
