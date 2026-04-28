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
