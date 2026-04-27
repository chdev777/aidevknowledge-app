# UIデザイン規約

Claude Design の hi-fi プロトタイプの「硬派で静謐なナレッジベース」コンセプトを
ピクセルパーフェクトに再現する。

## デザイントークン（`globals.css` から）

### カラー

すべて **oklch** で定義。アンバーアクセントは重要度・採用回答・hover強調にのみ使う
（色を節約することで情報密度に耐えるレイアウトになる）。

```css
--bg:        oklch(0.985 0.003 85);   /* 暖色オフホワイト */
--bg-2:      oklch(0.975 0.004 85);   /* 控えめなレイヤー */
--bg-raised: oklch(0.995 0.002 85);   /* カード */

--ink:   oklch(0.22 0.01 60);         /* 深インク前景 */
--ink-2: oklch(0.38 0.008 60);
--ink-3: oklch(0.55 0.006 60);
--ink-4: oklch(0.72 0.005 60);

--line:   oklch(0.90 0.006 70);       /* hairline border */
--line-2: oklch(0.93 0.005 70);
--line-3: oklch(0.96 0.004 70);

--accent:      oklch(0.62 0.14 55);   /* 深アンバー */
--accent-soft: oklch(0.92 0.04 65);
--accent-ink:  oklch(0.35 0.09 55);
```

ステータスバッジは **無彩色 + 6px ドット** で色を節約：

| ステータス | ドット |
|---|---|
| 未確認 | `--dot-new` (青系) |
| 検証中 / 確認中 | `--dot-verifying` (薄黄) |
| 検証済み | `--dot-verified` (緑系) |
| 採用候補 | `--dot-candidate` (アンバー) |
| 保留 | `--dot-hold` (グレー) |

### タイポグラフィ

```css
--font-sans:    "Inter", "Inter Tight", "Noto Sans JP", system-ui;
--font-mono:    "JetBrains Mono", ui-monospace;
--font-display: "Inter Tight", "Inter", "Noto Sans JP";
```

- 見出しは `--font-display`（Inter Tight）
- 本文は `--font-sans`（Inter + Noto Sans JP）
- メタ情報・コードは `--font-mono`（JetBrains Mono）
- 日本語文字には Noto Sans JP がフォールバック

### レイアウト

| 項目 | 値 |
|---|---|
| ベースフォントサイズ | 14px |
| line-height | 1.55 |
| サイドバー幅 | 236px |
| 角丸 | `--radius: 4px`、`--radius-lg: 6px` |
| 区切り線 | hairline 1px |
| シャドウ | 極小（モーダル・トーストのみ） |
| ベースビューポート | 1280px |

## CSS 構成

```
src/
├─ globals.css   ← プロトタイプ styles.css を一切手を入れずに移植（1431行）
└─ extra.css     ← プロトタイプに無い要素のための追加CSS（auth/topbar/empty-state/
                   modal/buttons/tag-input/row-list/comments/me-* 等）
```

**プロトタイプ CSS は編集禁止**。修正・追加は `extra.css` に集約する。

## 命名規則

CSS クラス名はプロトタイプを踏襲しつつ、プロトタイプに無い領域は以下の prefix を使う：

| Prefix | 用途 |
|---|---|
| `auth-*` | ログイン/サインアップ画面 |
| `topbar-*` | アプリヘッダ |
| `me-*` | マイページ |
| `kflow-*` | ホームのナレッジフロー図 |
| `home-*` | ホーム特有のリスト/2カラム |
| `compose-*` | 登録モーダル |
| `tag-chip / tag-pill` | タグの編集用 / 表示用の使い分け |
| `comment-*` | コメントフィード |
| `row-*` | 一覧の行 |

## アクセシビリティ最低限

- フォーカスリング：`outline` + `border-color` で表現（アンバー）
- ConfirmDialog は Esc で閉じる、confirm に初期フォーカス
- ボタンは `<button type="button">` 明示、ナビゲーションは `<NavLink>`
- `aria-label` は disabled / 装飾アイコンのみ付与
- カラーコントラスト：本文 21:1、サブ 7:1 以上

## レスポンシブ方針（MVP）

- **1280px viewport 専用**（プロトタイプ準拠）
- 1024px 以下・モバイル幅は Phase 2 で対応
- viewport meta は `width=1280` 固定

## ダークテーマ / 情報密度切替

CSS変数だけ用意してあるが、UI（Tweaks Panel）は MVP では出さない。
Phase 2 でトグルを実装する。
