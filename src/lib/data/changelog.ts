// お知らせ・改善履歴の静的データ（バンドル同梱・バックエンド通信ゼロ）。
//
// 編集ルール（参照: docs/specs を移植した `tender-jumping-swing.md`）：
// - 配列の先頭が最新リリース。新規リリースは先頭に追加する
// - version は一意の文字列（semver 推奨）、date は YYYY-MM-DD
// - entries.audience を省略すると 'all' 扱い
// - entry.fromFeedback: true は「ご要望にお応えしました」バナー用フラグ

export type EntryType = 'feature' | 'improvement' | 'fix' | 'security';

export interface Entry {
  type: EntryType;
  title: string;
  description?: string;
  fromFeedback?: boolean;
  /** 'all'（既定） or 'admin'（管理者のみ可視） */
  audience?: 'all' | 'admin';
}

export interface Release {
  version: string;
  date: string;
  title: string;
  entries: Entry[];
}

export const CHANGELOG: Release[] = [
  {
    version: '0.5.0',
    date: '2026-05-01',
    title: '安全性と運用基盤の強化',
    entries: [
      {
        type: 'security',
        title: 'パスワード入力ミス防止を追加しました',
        description:
          'アカウント作成画面に「パスワード（確認）」欄と表示トグル（👁）を追加しました。両欄が一致するまで送信ボタンが無効化され、入力ミスでログイン不能になる事故を防げます。',
      },
      {
        type: 'improvement',
        title: 'タグマスタを本番環境に投入しました',
        description:
          '記事・質問・検証メモなどに付けられる初期タグ（RAG / Dify / Claude / FAQ検索 など 23 種）を本番に投入しました。投稿時にタグ選択がしやすくなります。',
      },
      {
        type: 'improvement',
        title: 'リリース前の自動チェックを強化',
        description:
          'GitHub Actions で型検査・ユニットテスト・Firestore セキュリティルールテストを Pull Request 単位に必須化。Branch protection と組み合わせ、main ブランチへの直接 push を不可にしました。',
        audience: 'admin',
      },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-04-28',
    title: 'お知らせ機能とフィードバック機能を追加',
    entries: [
      {
        type: 'feature',
        title: 'お知らせ機能を追加しました',
        description:
          'アプリの改善履歴・新機能告知を Topbar 直下のバナーと「お知らせ」ページで確認できるようになりました。',
      },
      {
        type: 'feature',
        title: 'フィードバック機能を追加しました',
        description:
          '右下の💬ボタンから、バグ報告・機能要望・その他の意見を直接運営に送れます。',
      },
    ],
  },
];
