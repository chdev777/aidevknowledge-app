import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div className="page">
      <div className="empty-state">
        <div className="empty-state-title">アクセスできません</div>
        <div className="empty-state-desc">
          この情報は非公開、または閲覧権限がありません。
        </div>
        <div className="empty-state-action">
          <Link to="/" className="btn">ホームへ戻る</Link>
        </div>
      </div>
    </div>
  );
}
