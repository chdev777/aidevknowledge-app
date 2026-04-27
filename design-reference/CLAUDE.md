# design-reference/

Claude Design からダウンロードした hi-fi プロトタイプ（HTML/CSS/JS）と要件定義書の保管場所。

## 重要：編集禁止

このディレクトリの中身は **実装の一次資料** として参照する。**追記・修正は一切しない**。

理由：
- 要件・デザイン仕様の正本がここ。書き換えると「設計と実装のどちらが正か」が分からなくなる
- 元データは Claude Design の handoff URL から再取得可能（`source-bundle.tar.gz` を含む）が、編集後の差分は失われる

## 何を見るか

- `README.md` — このバンドルの読み方
- 要件定義書（PDF / Markdown） — スコープと機能要件の正
- マイページ仕様 — マイページ7タブ構成の元仕様
- HTML プロトタイプ（React + Babel standalone） — UI挙動とCSSの正
- chat ログ — 設計議論の経緯

## 実装側で扱うもの

- プロトタイプの `styles.css` は `src/globals.css` に **そのまま移植済み**（編集禁止）
- 追加で必要になったCSSは `src/extra.css` に集約する
- プロトタイプに無い画面（auth / topbar / empty state など）の追加は extra.css のみで実装

## 参照ルール

ピクセルパーフェクト確認時は、プロトタイプ HTML を別ウィンドウで開いて 1280px viewport で実装と並列表示する。
