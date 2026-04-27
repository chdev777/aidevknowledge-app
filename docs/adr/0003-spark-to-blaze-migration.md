# ADR 0003: Spark スタートでなくローカルDocker PoC → Blaze 移行

- 日付: 2026-04-27
- ステータス: 採用

## 背景

ユーザーの当初想定は Firebase Spark プランでの開発・本番運用だったが、
Spark には以下の制約があった：

- Cloud Functions が使えない（Open Graph 取得サーバ無し）
- Firebase Storage が新規プロジェクトで Blaze 必須（画像アップロード不可）
- App Hosting が Blaze 必須（Next.js SSR 不可）

## 検討した選択肢

### A. Spark で SPA + Firestore + Auth のみ運用

- Pros: 完全無料、運用負担が最小
- Cons:
  - **画像アップロード機能が作れない**（or 外部URL指定のみ）
  - OG 自動取得ができない（クライアント側 CORS で Web fetch 不可）
  - Cloud Functions が将来必要になったとき Blaze 移行で大改修

### B. ローカル Docker PoC + 本番 Blaze（採用）

- Pros:
  - PoC で機能を妥協せず、画像・OG・MinIOを揃えられる
  - 本番 Blaze 移行時は **環境変数 + Storage Provider 切替 + Cloud Functions 移植** で済む
  - Storage / Functions / App Check / Identity Platform を本番要件として最初から織り込める
  - Blaze 無料枠内で運用可能（社内10〜50人想定）
- Cons:
  - PoC 環境セットアップが少し重い（Java + MinIO + og-proxy）
  - 本番Blaze で課金事故対策の設計が必要

### C. 最初から Blaze 一本

- Pros: 開発と本番が完全同一
- Cons: PoC段階で本物の Firebase に依存、課金事故リスク

## 決定

**B. ローカル Docker PoC + 本番 Blaze に切替。**

主な根拠：

1. PoC で機能を諦めない設計にする方が、後の手戻りが少ない
2. og-proxy（Express）を Cloud Functions に移植するパスが見えている
3. MinIO ↔ Firebase Storage の Provider 抽象化で移行可能
4. Blaze の無料枠が十分に大きく、社内利用なら月$0で済む見込み
5. 課金事故対策は予算アラート3段 + 自動停止 Function で多層化

## PoC ↔ 本番の差分（最小化）

| 切替対象 | 方法 |
|---|---|
| Auth/Firestore | env var で Emulator か本物か切替 |
| Storage | `VITE_STORAGE_PROVIDER` で minio / firebase 切替（インターフェース同一） |
| OG fetch | og-proxy の Express を Cloud Functions に移植（同コード） |
| 集計 | クライアント `increment()` → Cloud Functions トリガに置換 |
| Auth 強化 | Identity Platform / blocking trigger / メール検証必須 を Blaze で追加 |
| App Check | 本番のみ初期化 |

詳細は [../blaze-migration.md](../blaze-migration.md)。

## リスク

- **Auth Emulator のID Tokenは本物と異なる**（demo署名）→ Cloud Functions接続時に挙動差
  → staging 環境（別Firebaseプロジェクト）でドライラン必須
- **MinIO ↔ Firebase Storage の進捗UI** → `onProgress` を Provider 共通インターフェースに含めて吸収
- **本番Blaze 課金事故** → 予算アラート3段 + 自動停止Function + Storage Rules + maxInstances
