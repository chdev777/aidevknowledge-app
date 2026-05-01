import { Fragment } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { Icon } from '../shared/Icon.js';

const ROUTE_LABELS: Record<string, string> = {
  '': 'ホーム',
  links: 'URL共有',
  qa: 'Q&A',
  notes: '検証メモ',
  apps: '作成アプリ',
  me: 'マイページ',
  forbidden: 'アクセス制限',
};

function buildCrumbs(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return ['ホーム'];
  return segments.map((seg, i) => {
    const label = ROUTE_LABELS[seg];
    if (label) return label;
    if (i > 0) return '詳細';
    return seg;
  });
}

export function Topbar() {
  const { profile, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();

  const crumbs = buildCrumbs(loc.pathname);

  const compose = (kind: 'link' | 'note') => {
    const next = new URLSearchParams(params);
    next.set('compose', kind);
    setParams(next);
  };

  if (!profile) return null;

  return (
    <header className="topbar">
      <div className="breadcrumbs">
        {crumbs.map((c, i) => (
          <Fragment key={`${i}-${c}`}>
            {i > 0 && <span className="crumb-sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'crumb-current' : ''}>{c}</span>
          </Fragment>
        ))}
      </div>
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => nav(0)}
          title="再読み込み"
        >
          <Icon name="refresh" size={13} />
        </button>
        <button type="button" className="btn sm" onClick={() => compose('note')}>
          <Icon name="plus" size={13} />
          検証メモ
        </button>
        <button type="button" className="btn primary sm" onClick={() => compose('link')}>
          <Icon name="plus" size={13} />
          URLを共有
        </button>
        <button
          type="button"
          className="btn ghost xs"
          onClick={() => signOut()}
          style={{ marginLeft: 4 }}
          title="サインアウト"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
