# ADR 0002: Firestore を採用、PostgreSQL + Prisma は不採用

- 日付: 2026-04-27
- ステータス: 採用

## 背景

要件定義書では PostgreSQL + Prisma + NextAuth が推奨されていた。
一方、本番は Firebase Blaze 前提。

## 検討した選択肢

### A. PostgreSQL + Prisma（要件書推奨）

- Pros:
  - SQLによる柔軟なクエリ、結合、全文検索（PostgreSQL FTS）
  - スキーマ管理が明示的（Prismaマイグレーション）
  - pgvector で AI 機能（Phase 3）が自然
  - LDAP / SAML / NextAuth など認証拡張が容易
- Cons:
  - **本番でホスティングコストが高い**（Cloud SQL 月 $7 〜）
  - Firebase 統合のメリットが消える
  - PoC（Docker）→ 本番（Cloud SQL）でホスト名と接続管理だけ複雑化

### B. Firestore（採用）

- Pros:
  - クライアントSDK で完結、サーバー実装が最小
  - Auth / Storage / Hosting と統合
  - スケーリング自動、無料枠が大きい
  - Rules で型・サイズ・列挙値・所有権・visibility を強制可能
  - PoC（Emulator）→ 本番（Firestore）の移行はスキーマ移行不要
- Cons:
  - **全文検索が前方一致のみ**（client-side filter or 外部検索エンジン併用）
  - 結合がない（denormalize でカバー）
  - サーバー側で集計するには Cloud Functions（Blaze必須）

### C. Cloud SQL on Blaze

- Pros: PostgreSQL の利点を Firebase 統合下で得られる
- Cons:
  - 月$7+ の固定コスト（無料枠なし）
  - 接続プーリング・監視を別途設計

## 決定

**B. Firestore を採用。**

主な根拠：

1. Firebase Blaze 前提なら統合のメリットが大きい
2. クライアントSDK で完結する設計の方が PoC ↔ 本番の差分が小さい
3. 内部ツールの規模（10〜50人）なら Firestore 無料枠で運用可能
4. Rules による多層防御が設計的に強い

## 影響と対応

| トレードオフ | 対応 |
|---|---|
| 全文検索が弱い | MVP は client-side filter、Phase 3 で Algolia/Typesense/Vertex AI Vector Search 検討 |
| 集計が弱い | MVP はクライアント信頼、Phase 2 で Cloud Functions トリガで `answerCount`/`stats` を集計 |
| pgvector 不在 | Phase 3 で外部ベクトルストア前提 |
| ベンダーロックイン | データはエクスポート可能（gcloud firestore export）、最悪 PostgreSQL に移行可 |

## 関連設計

- データモデル：[../data-model.md](../data-model.md)
- Rules 詳細：`firestore.rules` + `src/test/rules/`
- Phase 2/3 計画：[../scope.md](../scope.md)
