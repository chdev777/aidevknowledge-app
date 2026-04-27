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
  | 'eye';

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
};

export function Icon({ name, size = 14, stroke = 1.5, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}
