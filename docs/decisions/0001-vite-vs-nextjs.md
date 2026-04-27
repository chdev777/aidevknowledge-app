# ADR 0001: Vite + React SPA を採用、Next.js は採用しない

- 日付: 2026-04-27
- ステータス: 採用

## 背景

要件定義書「8. 技術構成案」では **Next.js + PostgreSQL + Prisma + NextAuth** が推奨されていた。
一方、本プロジェクトの技術前提は：

- 本番は **Firebase Blaze**
- PoC は **ローカルDocker**
- プロトタイプは React + Babel standalone（CDN、SSRなし）

## 検討した選択肢

### A. Next.js 14 (App Router) + Firebase

- Pros: 公式推奨、SSR、middleware、Server Actions
- Cons:
  - **Firebase Hosting (静的) では SSR を活かせない**（App Hosting は Blaze 必須・新しい）
  - middleware の Edge Runtime に firebase-admin が乗らない
  - サーバ用と SPA 用で2つの実行コンテキストを管理する複雑さ
  - Spark プラン制約下では多くの機能を諦めることになる

### B. Vite + React + TypeScript SPA（採用）

- Pros:
  - プロトタイプの React 実装から自然な移行
  - 内部ツールで SEO 不要、SSR 不要
  - ビルド成果物は単一の静的ファイル → Firebase Hosting で素直
  - ビルド速度が速く、HMR が快適
  - Firebase SDK + Firestore + Storage が全てクライアントSDKだけで完結
- Cons:
  - 認証ガードがクライアント側のみ（Firestore Rules で防衛）
  - SSR 不要なので、初回ロードで認証 → 描画の順序になる

### C. Remix SPA Mode

- Pros: シンプル、Data Router の良さを継承
- Cons: チームの Remix 経験がない、学習コスト

## 決定

**B. Vite + React + TypeScript SPA を採用。**

主な根拠：

1. SEO 不要な内部ツールであり、SSR の利点が薄い
2. Firebase Hosting (静的) で十分、移行時にホスティング選定で詰まらない
3. プロトタイプ（React + Babel standalone）からの移行が最も自然
4. 認証はクライアントSDK + Firestore Rules で防衛できる
5. ビルド速度・HMR の快適さが開発効率に直結

## 影響

- 全文検索は client-side filter で MVP 対応（要件「ナレッジ一覧・検索：高」）
  - Phase 3 で Algolia / Typesense / Vertex AI Vector Search を検討
- LDAP/SAML は Identity Platform 経由で対応（Phase 2 以降）
- middleware 不在のため、認証ガードは `<RequireAuth>` コンポーネントが担う
