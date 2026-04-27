import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../shared/Icon.js';

interface Action {
  icon: IconName;
  label: string;
  sub: string;
  to: string;
}

const ACTIONS: Action[] = [
  { icon: 'link', label: 'URLを共有', sub: 'X · YouTube · 記事 · GitHub', to: '/links?compose=link' },
  { icon: 'qa', label: '質問する', sub: '疑問をチームに投げる', to: '/qa?compose=question' },
  { icon: 'note', label: '検証メモを書く', sub: '試した結果を残す', to: '/notes?compose=note' },
  { icon: 'app', label: '作成アプリを登録', sub: 'URLとレビューを集める', to: '/apps?compose=app' },
];

export function HeroActions() {
  const nav = useNavigate();
  return (
    <div className="hero-actions">
      {ACTIONS.map((a) => (
        <button
          key={a.icon}
          type="button"
          className="hero-action"
          onClick={() => nav(a.to)}
        >
          <div className="ha-ico">
            <Icon name={a.icon} size={14} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="ha-label">{a.label}</div>
            <div className="ha-sub">{a.sub}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
