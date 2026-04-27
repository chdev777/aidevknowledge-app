# 本番Firebase（Blaze）移行手順

PoC（ローカルDocker）から本番（Firebase Blaze）へ切り替えるための作業手順。

> ⚠️ **本番移行は staging 環境（別Firebaseプロジェクト）でドライラン後に実施すること**。
> Auth Emulator のID Token は本物と署名検証が異なるため、本番Cloud Functions接続時に
> 思わぬ差異が出ることがある。

## 0. 前提

- Firebase プロジェクトを2つ用意：`aidev-staging`、`aidev-prod`
- Google Cloud 請求アカウントを Blaze プランに紐付け（Spark→Blaze アップグレード）
- Firebase CLI を最新版（`npm install -g firebase-tools`）

## 1. 課金事故対策（最初に実施）

### 1-1 予算アラート（3段）

Cloud Console → 請求 → 予算とアラート で以下を設定：

| しきい値 | 通知 |
|---|---|
| $1 | メール + Slack |
| $5 | メール + Slack |
| $20 | メール + 電話（管理者） |

### 1-2 予算超過自動停止 Function

Google公式サンプルを deploy：

```bash
# functions/src/stop-billing.ts に Pub/Sub 受信ハンドラを実装
firebase deploy --only functions:stopBilling --project aidev-prod
```

Cloud Billing → 予算 → 通知の宛先 → Pub/Sub トピックを `stopBilling` Function に接続。

> **注意**：自動停止は最後の砦。発火させないこと自体が目的。

## 2. Authentication

### 2-1 Identity Platform へアップグレード

Firebase Console → Authentication → 設定 → Identity Platform にアップグレード（無料枠あり）。

### 2-2 セキュリティ機能を有効化

- Email Enumeration Protection
- reCAPTCHA Enterprise（ログイン・サインアップ・パスワードリセットすべて）
- メール検証必須化（後述の Rules 改修と合わせて）

### 2-3 学内ドメイン制限（blocking trigger）

```ts
// functions/src/before-create.ts
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { HttpsError } from 'firebase-functions/v2/identity';

const ALLOWED_DOMAINS = ['example.ac.jp'];

export const beforeCreate = beforeUserCreated(async (event) => {
  const email = event.data?.email ?? '';
  if (!ALLOWED_DOMAINS.some((d) => email.endsWith(`@${d}`))) {
    throw new HttpsError('invalid-argument', '学内メールのみ登録可能です');
  }
});
```

Deploy: `firebase deploy --only functions:beforeCreate --project aidev-prod`

### 2-4 メール検証必須化（Rules 改修）

`firestore.rules` の各 create に `request.auth.token.email_verified == true` を追加。

## 3. Firestore

```bash
firebase deploy --only firestore:rules,firestore:indexes --project aidev-prod
```

完了後 Console で：
- 認証なしで read / write を試行 → 拒否確認
- 別ユーザーで他人の private 投稿に setDoc → 拒否確認
- role 改ざん試行 → 拒否確認

## 4. Storage

### 4-1 Cloud Storage for Firebase 有効化（Blaze 必須）

Firebase Console → Storage → 開始

### 4-2 Storage Rules デプロイ

```bash
firebase deploy --only storage --project aidev-prod
```

### 4-3 CORS 設定

`gsutil` で本番ドメインを許可：

```json
// cors.json
[{
  "origin": ["https://aidev-prod.web.app", "https://kobegakuin.ac.jp"],
  "method": ["GET","PUT","POST"],
  "responseHeader": ["Content-Type","Authorization"],
  "maxAgeSeconds": 3600
}]
```

```bash
gsutil cors set cors.json gs://aidev-prod.appspot.com
```

## 5. App Check

### 5-1 reCAPTCHA Enterprise キー取得

Cloud Console → セキュリティ → reCAPTCHA Enterprise → サイトキー作成。

### 5-2 SPA に組み込み

```ts
// src/lib/firebase/client.ts に追加（本番のみ）
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

if (!useEmulator) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}
```

### 5-3 Auth / Firestore / Storage 全てに enforce

Firebase Console → App Check → 各サービスの Enforce を ON。

> **debug token を本番ビルドに残さない**。`if (import.meta.env.DEV)` でガードすること。

## 6. Cloud Functions

### 6-1 og-proxy → Cloud Functions 移植

`docker/og-proxy/src/og-fetcher.ts` のロジックをそのまま移植：

```ts
// functions/src/og.ts
import { onCall } from 'firebase-functions/v2/https';
export const ogFetch = onCall({ maxInstances: 10, timeoutSeconds: 10 }, async (req) => {
  // og-fetcher.ts と同じ実装（SSRF guard 込み）
});
```

### 6-2 集計フィールドのトリガー

```ts
// onAnswerCreate: questions.answerCount++ + commentsトリガで stats更新
export const onAnswerCreate = onDocumentCreated(
  'questions/{qid}/answers/{aid}',
  async (event) => { ... }
);
```

### 6-3 maxInstances を全Functionに設定

暴走時の課金事故防止：

```ts
{ maxInstances: 5 }  // 各 Function に必須
```

### 6-4 Deploy

```bash
firebase deploy --only functions --project aidev-prod
```

## 7. Hosting

### 7-1 ビルド & デプロイ

```bash
pnpm build
firebase deploy --only hosting --project aidev-prod
```

### 7-2 環境変数（本番）

```env
VITE_USE_EMULATOR=0
VITE_FIREBASE_API_KEY=AIzaSy...本番キー
VITE_FIREBASE_AUTH_DOMAIN=aidev-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aidev-prod
VITE_FIREBASE_STORAGE_BUCKET=aidev-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_RECAPTCHA_SITE_KEY=...
VITE_STORAGE_PROVIDER=firebase
VITE_OG_PROXY_URL=https://us-central1-aidev-prod.cloudfunctions.net
```

### 7-3 API key restrictions

Cloud Console → APIとサービス → 認証情報 → Web API キー：

- HTTP referrers：`https://aidev-prod.web.app/*`、`https://aidev-prod.firebaseapp.com/*`、独自ドメイン
- API restrictions：Identity Toolkit / Firestore / Cloud Storage / Cloud Functions のみ

## 8. 動作確認チェックリスト

- [ ] サインアップ：`@example.ac.jp` 以外は blocking trigger で拒否される
- [ ] サインアップ：メール検証メールが実際に届く
- [ ] パスワードリセットメール送信
- [ ] App Check が enforce 中、debug token なしで Auth/Firestore/Storage 通信成功
- [ ] 別ユーザーで他人の private 投稿に直接 fetch → permission-denied
- [ ] 画像アップロード：Storage Rules でサイズ・MIME 制限が効く
- [ ] og-proxy 相当の Cloud Function：YouTube/X/GitHub のメタが取れる
- [ ] og-proxy 相当：プライベートIP（169.254.169.254 等）が拒否される
- [ ] Firestore 集計トリガー：回答投稿で answerCount が +1 される
- [ ] CSP / X-Frame-Options ヘッダがレスポンスに付与されている
- [ ] 予算アラートのテスト送信が届く

## 9. ロールバック

問題が発生した場合：

1. **Hosting ロールバック**：Firebase Console → Hosting → 履歴から1つ前にロールバック
2. **Functions ロールバック**：`firebase functions:rollback FUNCTION_NAME`
3. **Rules ロールバック**：Firestore Rules / Storage Rules のバージョン履歴から復元
4. **緊急停止**：予算超過自動停止 Function を手動発火（Pub/Sub テストパブリッシュ）

## 10. 段階的ロールアウト推奨

1. staging 環境で全項目チェックリスト通過
2. 本番に **Hosting + Auth + Firestore Rules** だけデプロイ（既存データなし）
3. 招待制で 3〜5名のテスター投入
4. 1週間後問題なければ Storage / Functions / App Check 有効化
5. 学内全体に告知

## 関連

- 設計時の3エージェントレビュー：[review-findings.md](./review-findings.md)
- セキュリティ詳細：[security.md](./security.md)
- データモデル：[data-model.md](./data-model.md)
