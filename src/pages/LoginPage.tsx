import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom';
import { useAuth } from '../lib/firebase/auth-context.js';
import { toAppError } from '../lib/utils/error.js';
import { Spinner } from '../components/shared/Spinner.js';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { signIn, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: LocationState };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authed') {
    navigate('/', { replace: true });
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      const dest = location.state?.from ?? '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(toAppError(err).userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <div className="brand-logo" />
            <div>
              <div className="brand-name">AIアプリ開発ナレッジ共有ハブ</div>
              <div className="brand-tag mono">knowledge / shared / private</div>
            </div>
          </div>
        </div>
        <h1 className="auth-title">ログイン</h1>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-field">
            <span>メールアドレス</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>パスワード</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Spinner /> : 'ログイン'}
          </button>
        </form>

        <div className="auth-foot">
          <Link to="/reset-password">パスワードを忘れた</Link>
          <span className="dot">・</span>
          <Link to="/signup">アカウント作成</Link>
        </div>
      </div>
    </div>
  );
}
