import { useAuth } from '../../lib/firebase/auth-context.js';
import { Avatar } from './Avatar.js';

export function Topbar() {
  const { profile, fbUser, signOut, sendVerification } = useAuth();
  if (!profile) return null;

  return (
    <header className="topbar">
      <div className="topbar-spacer" />
      {fbUser && !fbUser.emailVerified && (
        <div className="topbar-warn mono">
          メール未検証
          <button
            type="button"
            className="btn btn-ghost mono"
            onClick={() => sendVerification()}
          >
            再送
          </button>
        </div>
      )}
      <div className="topbar-user">
        <Avatar user={profile} size="sm" />
        <div className="topbar-user-meta">
          <div className="topbar-user-name">{profile.name}</div>
          <div className="mono topbar-user-handle">@{profile.handle}</div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
          サインアウト
        </button>
      </div>
    </header>
  );
}
