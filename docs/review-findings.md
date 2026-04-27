# 設計レビュー結果

実装計画書を 3 つの専門エージェントで多角的にレビューした結果。実装中に立ち返って参照するためのアーカイブ。

- **architect** — システム設計・スケーラビリティ・技術判断
- **security-reviewer** — セキュリティ脆弱性・OWASP対応
- **planner** — 要件カバレッジ・代替案・抜け漏れ

レビュー実施日：2026-04-27

---

## 重要度別サマリー（全レビュー横断）

### CRITICAL（要件・セキュリティ違反、計画書に反映済）
1. **Firestore Rules の comments が他人のprivate投稿のコメントを丸見えにする** — 親docのvisibility継承ロジック必須 → `targetVisibility` 非正規化フィールドで対応
2. **MinIOシークレットを `VITE_*` で SPA に渡す設計は鍵漏洩** → og-proxy で署名URL発行に変更
3. **`createdBy` / `role` / `createdAt` 改ざん防止のRules欠落** → `immutableOnUpdate()` ヘルパで対応

### HIGH（要件未充足・運用に支障、計画書に反映済）
4. **検索機能が計画にない**（要件書「優先度：高」） → タイトル部分一致で MVP 追加
5. **タグ付け機能が曖昧** → 自由入力 `tags: string[]` 埋込で確定
6. **マイページ7タブ中3タブが未定義** → コメント履歴追加、お気に入り/下書きはプレースホルダ
7. **`answers` / `favorites` / `tags` / `projects` のRules未定義** → 全コレクションのRules明記
8. **学内ドメイン制限・メール検証フローなし** → 本番Blaze で blocking trigger 追加（Phase 2）
9. **CSP / XSSサニタイズ / SVGアップロード禁止 / `javascript:` URL検証** → react-markdown + rehype-sanitize、zod URL検証、Storage Rules
10. **エラー境界・logger・予算自動停止Function** → ErrorBoundary + logger + AppError + 予算3段アラート
11. **プロトタイプ機能の MVP 対象未定義** → 採用回答・投票・下書き自動保存・OG取得を MVP に追加、いいね/アクティビティは Phase 2
12. **`handle` 重複防止の仕組みなし** → `handles/{handle}` ロックドキュメント

### MEDIUM（計画書に反映済）
13. **PII分離** — `users/{uid}/private/profile` サブドキュメント
14. **API Key の HTTP referrer 制限手順** → blaze-migration.md に明記
15. **TanStack Query と Firestore `onSnapshot` の混在ポリシー** → 状態管理ポリシー表で明記
16. **ComposeModal を URL クエリ駆動** → `?compose=link`
17. **`thumbnailPath` vs `thumbnailUrl` の使い分け** → 外部URL/Storage格納で命名分離
18. **Step 0 のドキュメント7本作成は過剰** → 3本先行＋以降インクリメンタル
19. **Step 8/9 の分割と工数再見積もり** → 16〜18 日に再見積
20. **Rules ユニットテストを Step 4.5 として独立**

### LOW（既存対応で問題なし or 軽微）
21. Vite × Firebase SDK のESM互換、firebase-tools Dockerイメージサイズ等

---

## 1. Architect エージェントによるレビュー（システム設計）

### 1.1 PoC ↔ 本番の差分の妥当性

**問題:** 「環境変数 + Storage Provider 切替のみ」は楽観的すぎる。

- Auth Emulator のID Token は本物ではない（demoトークン、署名検証スキップ）
- Firestore Emulator は Security Rules を完全には再現しない（時間ベース、`get()`/`exists()` 性能特性、トランザクション競合）
- App Check 不在 — 本番有効化時に `initializeAppCheck()` 呼び出し漏れで全リクエスト失敗
- `authDomain` の差 — メール検証リンク遷移先に影響
- CORS — MinIO/Firebase Storage で挙動差

**改善案:**
- 移行前チェックリストに「App Check付き smoke test」「Rules Unit Testing をCIに組み込む」追加
- staging環境（別Firebaseプロジェクト）でドライラン必須化
- ENV切替を `getEnvConfig()` 関数に集約し `emulator | staging | production` の3モードを明示型で表現

### 1.2 データアクセス層

**問題:** Firestore client SDKを直接使う設計だがリポジトリ抽象境界が曖昧。

- `links.ts` 等にCRUD関数を並べるだけでは `onSnapshot`/`getDocs` が混在しコンポーネントが直接 `QuerySnapshot` を触る設計になりがち
- テスタビリティ低下：FirestoreのMockは Emulator 起動が必須

**改善案:**
- 薄いリポジトリ層導入：戻り値を **ドメインモデル（plain object）** に正規化する `converters.ts` を必ず通す
- 各リポジトリは `findShared()`, `findByOwner(uid)`, `subscribeShared(cb)` のように **意図ベースの関数名** を提供
- テストは2層構成：(a) コンバータ純関数のVitest単体、(b) リポジトリは Emulator 統合テスト

### 1.3 認証フロー

**問題:**

- Emulator のID Tokenは署名検証されない → 本番でCloud Functions時に `verifyIdToken` 差で詰まる
- `users/{uid}` ドキュメント作成のレース — Auth state変更 → 即 `getDoc` で空ヒット
- Rules の `isOwner(resource.data)` は create時に `resource` がない → `request.resource.data` を使う
- メール検証フローの欠落

**改善案:**
- サインアップを `bootstrapUser()` 関数で順序保証（handles ロック → users → private profile → メール検証送信）
- `RequireAuth` は `loading | authed | unauthed | profileMissing` の4状態
- メール検証必須化（Rules で `request.auth.token.email_verified == true` チェック）

### 1.4 Storage 抽象化

**問題（重要）:** MinIO ↔ Firebase Storage は1インターフェースに完全には収まらない。

- 署名付きURL：MinIO は SigV4・有効期限7日上限、Firebase は token ベース・実質無期限
- アップロード認可：MinIO は IAM、Firebase は Storage Rules 条件式
- メタデータ：MinIO は `x-amz-meta-*`、Firebase は Firestore側分離が定石
- CORS：MinIO バケットレベル、Firebase は `gsutil` でデプロイ
- **`VITE_MINIO_ACCESS_KEY` を SPA に渡す設計は CRITICAL** — Vite の VITE_* はビルド成果物に埋め込まれる

**改善案:**
- インターフェースを `getUploadUrl(key, opts) → { url, headers, fields }` に分離
- PoCでも MinIO署名発行用の **og-proxy 内 Express サービス**を立てる（鍵がブラウザに漏れない）
- メタデータは常にFirestoreドキュメント側に保持
- 進捗UIは `onProgress` コールバックを共通インターフェースに含める

### 1.5 状態管理

**問題:** TanStack Query と `onSnapshot` の混在ポリシーがない。

**改善案:** 設計ルールを文書化（計画書「状態管理ポリシー」表に反映済）。

### 1.6 ルーティング構造

**問題:**
- ComposeModalの状態管理がルーティングに紐づいていない → F5 でモーダル消失
- マイページの公開状態切替の楽観的更新ポリシー未定義
- 詳細画面のディープリンクで private 投稿 → 403 フォールバック未定義

**改善案:**
- ComposeModal は URLクエリパラメータ駆動（`?compose=link`）、下書きは `localStorage`
- 公開切替は楽観的更新 + ロールバック（TanStack Query `onMutate`）
- `<NotFoundOrForbidden>` 共通コンポーネント、Firestore `permission-denied` で遷移

### 1.7 欠けているレイヤ

- ErrorBoundary
- logger.ts ラッパー（Sentry/Cloud Logging 連携を見据える）
- 構造化エラー（AppError + Firebase errorCode 翻訳）
- 機能フラグ（Remote Config or env）
- アクセシビリティ
- i18n基盤
- CSP / セキュリティヘッダー
- バンドル分析・コード分割
- Rate limiting（Cloud Functions経由の書込パスを Phase 2 で）
- 監査ログ（`audit_logs` コレクション）

### 1.8 拡張性

- `projectId?` を全コレクションに入れている点は◎
- ただし **タグ正規化**：`tags[]` 埋め込みだとタグ名変更時に全ドキュメント更新が必要 → MVPは自由入力で割り切り、Phase 2でマスタ化検討
- AI機能（Phase 3）：埋め込みベクトルは pgvector / Vertex AI Vector Search 等の外部ストアを前提
- お気に入り：サブコレクション設計OK

### 1.9 実装順序

- Step 0 のドキュメント7本作成は重すぎる → README + local-dev だけ先、残りインクリメンタル
- Firestore Rules ユニットテストを Step 4.5 として独立化
- シードスクリプトをStep 4直後に軽く作る
- Storage（MinIO）統合のタイミングを明示

### 総評

骨格は健全で、PoCから本番への移行戦略・データモデル・Rulesも妥当。ただし Storage 抽象化（特にMinIOシークレットのブラウザ露出）、エラー境界・ロガー・機能フラグ等の運用レイヤ、`onSnapshot`とTanStack Queryの混在ポリシーが未定義。Step 0の文書量を削り、Rulesテストを早期化すべき。

---

## 2. Security エージェントによるレビュー

### 2.1 Firestore Rules — 深刻度: HIGH

#### 発見された穴

- **`comments` のアクセス制御が壊れている（CRITICAL寄り）** — `allow read, create: if isSignedIn();` で誰でもログインさえすれば private 投稿のコメントを読める
- `answers` サブコレクションのルールが計画書に存在しない（デフォルト拒否だが明示必要）
- `tags`, `projects`, `favorites` のルール未定義
- `update` 時の `createdBy` / `visibility` 改ざん検証が無い
- `users/{uid}` の `role` 自己昇格

#### 改善策（計画書 Firestore Rules 強化版で対応済）

- `targetVisibility` 非正規化フィールドで親doc参照
- `immutableOnUpdate()` ヘルパで `createdBy`, `createdAt` 改ざん防止
- `users` の role/handle 改ざん防止
- `answers` の採用フラグは質問者のみ、投票は ±1 のみ
- `comments` の `targetType`, `body` サイズ検証
- `favorites` は本人のみ
- `tags`/`projects` 書込禁止

Rules Unit Testing を **3件→最低15件** に増やす。

### 2.2 クライアントSDKだけで全処理する設計のリスク — HIGH

- 攻撃者は Firebase SDK を直接呼び出せる（DevToolsから任意 setDoc）
- `answerCount` のような集計フィールドはクライアントから書き換え可能
- `createdAt` を `serverTimestamp()` 以外で送られるとソート順操作される

**改善策:**
1. Firestore Rules で型・サイズ・列挙値を全て検証
2. 集計フィールド (`answerCount`, `acceptedAnswerId`) は Phase 2 で Cloud Functions のトリガーから書く（MVPはクライアント信頼で「社内利用前提」明記）
3. 不変フィールドの保護: `createdBy`, `createdAt` は update で必須一致

### 2.3 MinIO（PoC）デフォルト認証情報 — MEDIUM

- `minioadmin/minioadmin` を `.env.example` に書くとコピペ運用される
- **`VITE_*` の環境変数は ビルド成果物のJSにそのまま埋め込まれる** — 本番でも危険な癖が付く

**改善策:**
1. MinIO のシークレットを SPA に渡さない（og-proxy 経由に固定）
2. `.env.example` のデフォルトを `openssl rand -hex 16` で生成させる手順
3. バケットポリシー：認証済みかつ `users/{uid}/` プレフィックスのみ書込可
4. `docker-compose.yml` で MinIO 9000 をホストに公開しない、Console 9001 のみ

### 2.4 Firebase Storage（本番）— MEDIUM

具体ルール案を計画書 storage.rules セクションに反映済。

- avatar: 2MB、image/jpeg|png|webp のみ、SVG拒否
- links/thumb: 5MB、image/* （gif含む）
- notes/attachments: 10MB、exe/sh/bat/ps1/js/html/svg 拒否
- apps/thumb: 5MB、image/jpeg|png|webp

App Check は **Auth + Firestore + Storage の3つすべてに enforce**。debug token は `if (import.meta.env.DEV)` でガード。

### 2.5 認証 — HIGH

- ブルートフォース対策ゼロ
- アカウント列挙攻撃可能（`auth/user-not-found` vs `auth/wrong-password`）
- パスワードリセットフロー言及なし
- メール検証なし
- 学内ドメイン制限なし

**改善策（本番Blaze で実装、blaze-migration.md に明記）:**
1. Identity Platform へ移行 → Email Enumeration Protection、SMS/Email MFA、reCAPTCHA Enterprise
2. Cloud Function blocking trigger でメールドメイン検証
3. メール検証必須化、Rules で `email_verified == true` チェック

### 2.6 環境変数・APIキー管理 — MEDIUM

- API key restrictions（Google Cloud Console）必須化を blaze-migration.md に追記
- HTTP referrers / API restrictions の手順
- App Check が referrer制限の弱さを補う
- `.env.example` の冒頭に「`VITE_*` は全てクライアントに露出する。秘密値は絶対に入れない」と明記

### 2.7 XSS / CSRF — HIGH

- markdown / HTML レンダリングのサニタイズ方針が無い
- URL共有のリンク：`<a href={link.url}>` で `javascript:` スキーム
- YouTube サムネ自動取得のパストラバーサル
- CSP ヘッダ無し

**改善策:**
1. markdownライブラリは `react-markdown` + `rehype-sanitize` 固定
2. URLバリデーション：zod で `http`/`https` のみ
3. YouTube ID 抽出は `^[a-zA-Z0-9_-]{11}$` で検証
4. CSP ヘッダを `firebase.json` に追加
5. SVG アップロード禁止
6. `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`

### 2.8 個人情報 — MEDIUM

- `users/{uid}` に email 平文格納で全認証ユーザーが互いのメール取得可能
- ログ・テレメトリでのPII露出
- Firestoreオフラインキャッシュの IndexedDB 残留

**改善策:**
1. `users/{uid}` を public profile / `users/{uid}/private/profile` に分離
2. PIIマスキング関数 `lib/utils/log.ts`
3. `enableIndexedDbPersistence` 無効化、ログアウト時 `clearIndexedDbPersistence()`

### 2.9 予算事故対策 — HIGH

- 計画書の予算アラート3段（$1/$5/$20）は通知のみ、自動停止しない
- Cloud Billing → Pub/Sub → Cloud Function で **予算超過時に Firebase プロジェクトを自動停止する Function** を仕込む（Google公式サンプル）

### 2.10 OWASP Top 10（2021）対応マップ

| # | カテゴリ | 深刻度 | 対策 |
|---|---|---|---|
| A01 | Broken Access Control | CRITICAL | Firestore Rules 全面見直し |
| A02 | Cryptographic Failures | LOW | Firebase Auth に委譲 |
| A03 | Injection | HIGH | クライアント zod + Rules 型検証、`react-markdown` + sanitize |
| A04 | Insecure Design | HIGH | Cloud Functions による集計・検証ロジックを Phase 2 |
| A05 | Security Misconfiguration | HIGH | MinIOデフォルト鍵 / CSP / debug token / API key制限 |
| A06 | Vulnerable Components | MEDIUM | `npm audit` CI、Dependabot |
| A07 | Identification & Auth Failures | HIGH | Identity Platform + reCAPTCHA Enterprise + メール検証 |
| A08 | Software & Data Integrity Failures | MEDIUM | App Check 早期導入、Google Fonts integrity |
| A09 | Logging & Monitoring Failures | HIGH | Cloud Audit Logs、不審ログイン検知 |
| A10 | SSRF | MEDIUM | OG fetcher で URL allowlist + 内部IP拒否 |

### 追加発見事項

- `acceptedAnswerId` を質問者以外が書き換えられる → Rules で対応
- `tags[]` の正規化なし → `lib/utils/tag.ts` で trim/長さ制限
- シードスクリプトで本番Firestore誤接続 → `tools/scripts/env-guard.ts` で abort

### 総評

「クライアントSDK完結 + Firestore Rules頼り」設計のため、Rulesに穴があれば即破綻する。特にcommentsの可視性継承、createdBy/role改ざん防止、SPAにMinIO鍵を渡す致命的設計、CSP/XSS対策の欠落が要修正。Identity Platform+App Check+予算自動停止Functionの3点は本番必須。

---

## 3. Planner エージェントによるレビュー

### 3.1 要件カバレッジ

要件定義書「7. MVPとして最初に作る範囲」優先度高との照合：

| 要件MVP（高） | 計画書 |
|---|---|
| ログイン | OK |
| 外部URL共有 | OK |
| **タグ付け** | 自由入力で MVP 対応に修正 |
| ナレッジ一覧・**検索** | client-side filter で MVP 対応に修正 |
| Q&A投稿 / 回答・コメント | OK |
| 検証メモ | OK |
| 作成アプリURL共有 | OK |
| 作成アプリへのコメント・レビュー | OK |
| ステータス管理 | OK |

### 3.2 マイページ要件（4段階 → 2段階）

要件書 §2 で「最初はシンプルに、非公開/共有 の2段階で始めてもよい」と明記 → **要件書自身が認めている**。

ただしマイページ7タブのうち計画書がカバーするのは4種のみだった → **コメント履歴を MVP に追加**、お気に入り/下書きはプレースホルダで対応。

### 3.3 データモデルの妥当性

- `links.thumbnailPath` → 外部URLは `thumbnailUrl`、Storage格納は `thumbnailPath` で命名分離
- `tags` 二重設計 → MVPは自由入力一本化
- `projects` MVP は seed のみ
- `users.handle` ユニーク制約 → `handles/{handle}` ロックで対応
- `users.role` 自己申告 → サインアップで「管理者」UI から削除、Rules でも `['DX推進','情報支援']` のみ許可
- `comments.targetVisibility` 非正規化 → 親doc visibility 連動を実現
- `notes.attachments[]` → MVPで実装

### 3.4 プロトタイプ再現度（漏れ）

| プロトタイプ機能 | MVP対応 |
|---|---|
| ホーム「アクティビティ」フィード | Phase 2（非表示） |
| ホーム「プロジェクト」サマリ | Phase 2（非表示） |
| Q&A投票ボタン | MVP実装（クライアントincrement） |
| 採用回答マーク | MVP実装（質問者のみ） |
| アプリ詳細 stats（views/comments/likes） | Phase 2（Cloud Functions集計） |
| 「いいね」ボタン | MVP非表示 |
| 下書き自動保存 | MVP実装（localStorage） |
| 「メタ取得」ボタン | MVP実装（og-proxy 経由） |
| タグ自由入力 | MVP実装 |
| アバター画像アップロード | MVP実装（MinIO 経由） |

### 3.5 実装ステップの粒度

- 1〜2週間想定は過小、**16〜18 日が現実的** → 計画書で再見積済
- Step 8 を 8a/8b/8c/8d に分割
- Step 9 を 9a/9b に分割
- Step 4.5 として Firestore Rules + テストを独立
- カバレッジ目標を「lib/ 60%」に下げて scope.md で合理化

### 3.6 検証セクション追加項目

- マイページタブ全種の挙動
- comments 親 non-shared 時の閲覧制御
- Firestore Quota シミュレーション（1日50K read 内に収まるか）
- handle 重複・予約語
- role 改ざん試行
- MinIO 経由認可確認
- ピクセルパーフェクト回帰（1024px / 1440px の方針）
- 公開→非公開→再公開のコメント再表示（要件書 §8）

### 3.7 代替案の妥当性

要件書「8. 技術構成案」推奨は Next.js + PostgreSQL。Vite + Firestore 採用の根拠を ADR に明記：

- 全文検索：MVPは部分一致 client-side、将来 Algolia/Typesense 連携 or PostgreSQL 再選定
- LDAP/SAML：MVPは非対応、Google Workspace SSO で代替可能
- pgvector：Phase 3 で外部ベクトルストア前提

### 3.8 依存関係の見落とし

| ライブラリ | 注意点 |
|---|---|
| Firebase SDK v10+ × Vite 5+ | `optimizeDeps.exclude: ['firebase']` |
| TanStack Query v5 | breaking changes：`cacheTime`→`gcTime`、`isLoading`→`isPending` |
| React Router | v6 で pin（v7 にしない） |
| zod v3 vs v4 | error message API 変更注意 |
| `@aws-sdk/client-s3` | バンドルサイズ1MB超、`presigner` のみ動的import |
| firebase-tools / Java | node:20-bullseye-slim + default-jre-headless |
| Firestore Emulator on Windows | ボリュームマウントの権限 |
| Vite HMR + Docker | `usePolling: true` は CPU 100% リスク |

### 3.9 追加の重要な指摘

- Out of Scope の不整合：`favorites` コレクション定義あるが Phase 2 → Rules先行定義で整理
- comments の `targetType, targetId` バリデーション不足 → Rules で対応
- `firebase emulators:start --export-on-exit` は SIGTERM タイムアウトでデータロスする可能性 → `stop_grace_period: 30s` + 手動 export 手順を local-dev.md に明記

### 総評

骨格は妥当だが要件カバレッジに穴がある。タグ・検索・コメント可視性連動・マイページ3タブが未定義。技術選定はトレードオフ未明文化、`role`自己申告や`handle`重複等のセキュリティ穴あり。Step 8/9 を分割し、工数を 16〜18日に再見積もり、Rules テストを Step 4.5 として独立させるべき。

---

## このドキュメントの位置づけ

- 実装中に「なぜこの設計？」と迷ったときに立ち返る
- 同じ議論を繰り返さないためのアーカイブ
- Phase 2 / 3 の機能追加時、ここに書かれた「後回し項目」を再評価する起点

レビュー指摘の **CRITICAL + HIGH + MEDIUM はすべて計画書に反映済**。LOW は実装中に都度判断。
