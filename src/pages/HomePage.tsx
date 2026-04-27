import { useAuth } from '../lib/firebase/auth-context.js';

export function HomePage() {
  const { profile } = useAuth();
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">ホーム</h1>
        <p className="page-subtitle">
          {profile?.name} さん、ようこそ。
        </p>
      </header>
      <section className="page-section">
        <div className="empty-state">
          <div className="empty-state-title">ダッシュボードはStep 7で実装します</div>
          <div className="empty-state-desc">
            最近のURL / 未回答質問 / 検証メモ / 作成アプリ / メトリクスを表示予定。
          </div>
        </div>
      </section>
    </div>
  );
}
