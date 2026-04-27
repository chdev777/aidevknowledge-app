# design-reference/ — デザイン参照資産

このディレクトリは **Claude Design (claude.ai/design) からダウンロードした hi-fi プロトタイプ** の保管場所です。**実装の正・複製禁止**。

## 位置づけ

- **これは設計の正（the source of truth）**：UI仕様・データ構造・要件はこのディレクトリの内容を一次資料として参照する
- **本番コードではない**：プロトタイプは React + Babel standalone（CDN実行）で書かれており、production build には不向き
- **複製禁止**：`src/` 配下のコードは、このプロトタイプのコードをコピーするのではなく、視覚的出力（ピクセルパーフェクト）と仕様（フィールド・状態遷移）だけを再現する

## 内容

```
design-reference/
├─ README.md                           # このファイル
├─ source-bundle.tar.gz                # Claude Design からダウンロードした元アーカイブ（再現性のため保持）
└─ original-bundle/
    └─ ai-web/
        ├─ README.md                   # オリジナルの handoff 指示書
        ├─ chats/
        │   └─ chat1.md                # 設計時の対話ログ（要件確定の経緯）
        └─ project/
            ├─ AIアプリ開発ナレッジ共有ハブ.html  # エントリ HTML
            ├─ styles.css              # CSS（oklch / hairline / 硬派デザイン）
            ├─ data.js                 # MOCK データ（型・サンプル値の参照元）
            ├─ icons.jsx               # アイコン群
            ├─ shared.jsx              # サイドバー・タグ・バッジ等共通
            ├─ pages.jsx               # 一覧/詳細
            ├─ pages-home.jsx          # ホーム
            ├─ pages-mypage.jsx        # マイページ
            ├─ compose.jsx             # 登録モーダル
            ├─ tweaks-panel.jsx        # テーマ切替（MVP対象外）
            ├─ app.jsx                 # ルートコンポーネント
            ├─ screenshots/            # マイページ表示確認スクリーンショット
            └─ uploads/
                ├─ AIアプリ開発ナレッジ共有Webアプリ.txt          # 機能要件
                └─ AIアプリ開発ナレッジ共有Webアプリ_マイページ.txt # マイページ仕様
```

## 実装時の参照ガイド

| 知りたいこと | 参照先 |
|---|---|
| カラー / hairline / radius / oklch値 | `original-bundle/ai-web/project/styles.css` |
| サンプルデータ構造（フィールド名・型） | `original-bundle/ai-web/project/data.js` |
| ナビゲーション構成 | `shared.jsx` の `NAV_ITEMS` 系 |
| アイコン定義 | `icons.jsx` |
| 各画面のレイアウト・要素 | `pages*.jsx` |
| 機能要件 | `uploads/AIアプリ開発ナレッジ共有Webアプリ.txt` |
| マイページ仕様（公開状態管理） | `uploads/AIアプリ開発ナレッジ共有Webアプリ_マイページ.txt` |
| 設計時の意思決定経緯 | `chats/chat1.md` |

## 編集禁止

このディレクトリ配下のファイルは **編集しない**。アップデートが必要な場合は Claude Design 側で再生成し、`source-bundle.tar.gz` から再展開する。
