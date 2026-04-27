import { Link } from 'react-router-dom';

const ACTIONS = [
  { to: '/links?compose=link', label: 'URLを共有', icon: '+' },
  { to: '/qa?compose=question', label: '質問する', icon: '?' },
  { to: '/notes?compose=note', label: '検証メモを書く', icon: '✎' },
  { to: '/apps?compose=app', label: '作成アプリを登録', icon: '◊' },
];

export function QuickActions() {
  return (
    <section className="quick-actions">
      {ACTIONS.map((a) => (
        <Link key={a.to} to={a.to} className="quick-action">
          <span className="quick-action-icon mono">{a.icon}</span>
          <span className="quick-action-label">{a.label}</span>
        </Link>
      ))}
    </section>
  );
}
