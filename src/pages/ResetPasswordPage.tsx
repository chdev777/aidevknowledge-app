import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase/client.js';
import { toAppError } from '../lib/utils/error.js';
import { Spinner } from '../components/shared/Spinner.js';

export function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setDone(true);
    } catch (err) {
      setError(toAppError(err).userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">パスワード再設定</h1>
        {done ? (
          <p className="auth-done">
            パスワード再設定メールを送信しました。メール内のリンクから手続きしてください。
          </p>
        ) : (
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
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Spinner /> : '再設定メールを送る'}
            </button>
          </form>
        )}
        <div className="auth-foot">
          <Link to="/login">ログインへ戻る</Link>
        </div>
      </div>
    </div>
  );
}
