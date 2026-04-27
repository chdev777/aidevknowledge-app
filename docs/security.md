# セキュリティ

「クライアントSDK完結 + Firestore Rules 頼り」設計のため、Rulesに穴があれば即破綻する。
本書は防衛戦略の集約と OWASP Top 10 対応の確認用。

## 多層防御の構造

```
ユーザー入力
  │
  ├─ 1. zod スキーマ（クライアント側、エラーUI）
  ├─ 2. Firestore Rules（型・サイズ・列挙値・所有権・visibility）  ← 最後の砦
  ├─ 3. Storage Rules（ファイルサイズ・MIME・拡張子、本番のみ）
  ├─ 4. App Check（reCAPTCHA Enterprise、本番Blaze）
  └─ 5. Cloud Functions blocking trigger（学内ドメイン制限、本番Phase 2）
```

PoC 時点では 1, 2 のみ。本番Blaze 移行で 3〜5 を追加。

## 主要な防御策

### A01 Broken Access Control

- `firestore.rules` は visibility-aware：
  - `read`: 自分のpost OR `visibility=='shared'`
  - `update/delete`: 所有者のみ
- 不変フィールド：`createdBy`, `createdAt`
- `users.role` 自己昇格禁止（create時に `['DX推進','情報支援']` のみ、update時に role 不変）
- `users.handle` も update 不可（ユニーク制約維持）
- `handles/{handle}` ロックドキュメントで重複防止
- `comments` は親docのvisibilityを `targetVisibility` に非正規化
- `favorites/{uid}/items/{id}` は本人のみ
- `tags` / `projects` への write は全拒否（admin SDK 専用）

### A02 Cryptographic Failures

- パスワードは Firebase Auth に委譲（PBKDF2/scrypt 相当）
- 通信は Firebase / MinIO とも HTTPS（本番MinIOではTLS必須）
- 個人情報は `users/{uid}/private/profile` に分離（PII最小化）

### A03 Injection (XSS / NoSQL injection)

- React 標準のエスケープ + `dangerouslySetInnerHTML` 不使用
- markdown は `react-markdown` + `rehype-sanitize`
- URL 検証：zod の `safeUrlSchema` が `http(s):` のみ許可（`javascript:`/`data:`/`file:` 拒否）
- `<a href>` 描画前に `isSafeHref()` で再チェック
- SVG アップロード禁止（XSSペイロード混入防止）
- Firestore Rules で `tags` 配列のサイズ・要素長を制限

### A04 Insecure Design

- 集計フィールド（`answerCount`, `stats`）は Phase 2 で Cloud Functions 化予定
  - MVP は社内利用前提でクライアント信頼
- 二重投票防止は Phase 2 で `votes/{uid}` サブコレクション化予定
  - MVP はローカルstateで暫定防止

### A05 Security Misconfiguration

- **MinIOシークレットを SPA に渡さない**：og-proxy のサーバ環境変数のみ
- `.env` は `.gitignore`、`.env.example` のデフォルト値は dev 用のみ
- `firebase.json` の本番hosting に CSP / X-Frame-Options / X-Content-Type-Options /
  Referrer-Policy / Permissions-Policy / HSTS を設定済
- 本番Blaze では API key restrictions（HTTP referrers / API restrictions）必須
- App Check の debug token は `import.meta.env.DEV` でガード

### A06 Vulnerable Components

- Dependabot / `npm audit` を CI に組み込む（本番Blaze移行時）
- React Router v6 で固定（v7 にしない）
- Firebase SDK v10、TanStack Query v5、zod v3 で固定

### A07 Identification & Authentication Failures

- PoC: メール/パスワード（Firebase Auth Emulator）
- 本番Blaze で **Identity Platform** に移行：
  - Email Enumeration Protection（auth/user-not-found vs wrong-password の差分隠蔽）
  - reCAPTCHA Enterprise（ブルートフォース対策）
  - メール検証必須化（Rules で `email_verified` チェック予定）
  - blocking trigger で学内ドメイン（`@example.ac.jp`）のみ許可

### A08 Software & Data Integrity Failures

- App Check を Auth/Firestore/Storage の全てに enforce（本番Blaze）
- Google Fonts は `<link>` 経由（外部CDN）。SubResource Integrity は Phase 2 で検討

### A09 Logging & Monitoring Failures

- `lib/utils/log.ts` の logger が PII（メール・パスワード・トークン）をマスク
- 本番Blaze で Cloud Logging 連携 + Cloud Audit Logs
- 不審ログイン検知は Identity Platform の標準機能を利用

### A10 SSRF

- `og-proxy` の `og-fetcher.ts` で：
  - DNS解決後にプライベートIPレンジ拒否（10/8, 127/8, 169.254/16, 172.16/12, 192.168/16）
  - `169.254.169.254`（クラウドメタデータ）拒否
  - リダイレクトは最大3回まで
  - 5秒タイムアウト
- 本番Cloud Functions に移植時も同ロジックを継承

## 本番Blaze の追加防衛

| リスク | 対策 |
|---|---|
| 課金事故 | 予算アラート3段（$1/$5/$20）+ Pub/Sub経由の自動停止Function |
| Storage abuse | Storage Rules でサイズ/MIME制限 + App Check |
| Functions 暴走 | `maxInstances` を全Functionに設定 |
| SMS課金事故 | SMS MFA有効化時は地域制限（日本のみ） |
| 共有PCのIndexedDB残留 | `enableIndexedDbPersistence` 無効化、ログアウト時 `clearIndexedDbPersistence()` |

## レビューによる確認

設計時に3エージェントで多角的レビュー：
[review-findings.md](./review-findings.md)
で CRITICAL / HIGH / MEDIUM 全指摘の対応を追跡。
