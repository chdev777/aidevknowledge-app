import type { CSSProperties } from 'react';

export type IconName =
  | 'home'
  | 'link'
  | 'qa'
  | 'note'
  | 'app'
  | 'project'
  | 'tag'
  | 'star'
  | 'user'
  | 'admin'
  | 'search'
  | 'plus'
  | 'arrow'
  | 'refresh'
  | 'message'
  | 'eye'
  | 'play'
  // ブランドロゴ（fill 中心）
  | 'youtube'
  | 'github'
  | 'x'
  | 'qiita'
  | 'zenn'
  // 汎用アイコン
  | 'doc'
  | 'book'
  | 'globe';

interface Props {
  name: IconName;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
}

const PATHS: Record<IconName, JSX.Element> = {
  home: <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-8.5z" />,
  link: (
    <>
      <path d="M10 13.5a4.5 4.5 0 0 0 6.36 0l3-3a4.5 4.5 0 0 0-6.36-6.36l-1.5 1.5" />
      <path d="M14 10.5a4.5 4.5 0 0 0-6.36 0l-3 3a4.5 4.5 0 0 0 6.36 6.36l1.5-1.5" />
    </>
  ),
  qa: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" />
    </>
  ),
  note: (
    <>
      <path d="M5 3h11l4 4v14H5z" />
      <path d="M16 3v4h4" />
      <path d="M8 12h8M8 16h5" />
    </>
  ),
  app: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  project: <path d="M3 7l3-3h5l2 2h8v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />,
  tag: (
    <>
      <path d="M20 12L12 20l-9-9V3h8z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.2 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.2 5.9-.8z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  admin: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  refresh: <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5" />,
  message: (
    <path d="M21 12c0 4.4-4 8-9 8-1.5 0-3-.3-4.2-.8L3 21l1.3-4.5C3.5 15 3 13.5 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  play: <path d="M7 4l13 8-13 8z" fill="currentColor" />,
  // YouTube: 角丸長方形 + 三角形
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" fill="currentColor" stroke="none" />
      <path d="M10 9.5l5 2.5-5 2.5z" fill="#fff" stroke="none" />
    </>
  ),
  // GitHub: シンプル化した猫マーク
  github: (
    <path
      d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.55 9.55 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"
      fill="currentColor"
      stroke="none"
    />
  ),
  // X (旧 Twitter): バツ印（公式 X ロゴ簡略版）
  x: (
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.16 17.52h1.833L7.084 4.126H5.117z"
      fill="currentColor"
      stroke="none"
    />
  ),
  // Qiita: 三角形 + 円弧（簡略化）
  qiita: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
      <path
        d="M12 5a7 7 0 0 1 4.95 11.95l-2.12-2.12a4 4 0 1 0-5.66 0L7.05 16.95A7 7 0 0 1 12 5z"
        fill="#fff"
        stroke="none"
      />
    </>
  ),
  // Zenn: 山型 Z
  zenn: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" stroke="none" />
      <path d="M7 17L13 6h2l-6 11zm5-1l4-7h2l-4 7z" fill="#fff" stroke="none" />
    </>
  ),
  // 汎用 doc（記事）
  doc: (
    <>
      <path d="M14 3H6v18h12V7z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6M9 8h2" />
    </>
  ),
  // 汎用 book（公式Docs）
  book: (
    <>
      <path d="M4 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H4z" />
      <path d="M20 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </>
  ),
  // 汎用 globe（Web）
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
};

// ブランドロゴは fill 中心なので Icon コンポーネントに stroke を強制させない
const FILL_ICONS = new Set<IconName>(['play', 'youtube', 'github', 'x', 'qiita', 'zenn']);

export function Icon({ name, size = 14, stroke = 1.5, style }: Props) {
  const isFill = FILL_ICONS.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFill ? 'currentColor' : 'none'}
      stroke={isFill ? 'none' : 'currentColor'}
      strokeWidth={isFill ? 0 : stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}
