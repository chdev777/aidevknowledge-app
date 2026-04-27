import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page">
      <div className="empty-state">
        <div className="empty-state-title">ページが見つかりません</div>
        <div className="empty-state-action">
          <Link to="/" className="btn">ホームへ戻る</Link>
        </div>
      </div>
    </div>
  );
}
