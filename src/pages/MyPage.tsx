import { useAuth } from '../lib/firebase/auth-context.js';

export function MyPage() {
  const { profile } = useAuth();
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">マイページ</h1>
        {profile && (
          <p className="page-subtitle mono">
            @{profile.handle} / {profile.role}
          </p>
        )}
      </header>
      <div className="empty-state">
        <div className="empty-state-title">マイページはStep 9a/9bで実装します</div>
      </div>
    </div>
  );
}
