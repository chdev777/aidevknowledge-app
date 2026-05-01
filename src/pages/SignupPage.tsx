import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bootstrapUser } from '../lib/firebase/bootstrap-user.js';
import { useAuth } from '../lib/firebase/auth-context.js';
import { toAppError } from '../lib/utils/error.js';
import { SELF_SIGNUP_ROLES, type UserRole } from '../types/user.js';
import { Spinner } from '../components/shared/Spinner.js';

export function SignupPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState<UserRole>('DX推進');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMatch =
    password.length >= 8 && passwordConfirm.length >= 8 && password === passwordConfirm;
  const passwordMismatch =
    password.length >= 8 && passwordConfirm.length > 0 && password !== passwordConfirm;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordMatch) {
      setError('パスワードが一致しません');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await bootstrapUser({
        email: email.trim(),
        password,
        name: name.trim(),
        handle: handle.trim(),
        role,
        color: '',
      });
      await refreshProfile();
      navigate('/', { replace: true });
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
              <div className="brand-name">アカウント作成</div>
              <div className="brand-tag mono">学内DX推進 / 情報支援グループ向け</div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-field">
            <span>氏名</span>
            <input value={name} required onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="auth-field">
            <span>ハンドル名 <em className="mono">3〜32文字 / 半角英数 _ . -</em></span>
            <input
              value={handle}
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_.-]+"
              onChange={(e) => setHandle(e.target.value)}
            />
          </label>
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
            <span>パスワード <em className="mono">8文字以上</em></span>
            <div className="auth-password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </label>
          <label className="auth-field">
            <span>パスワード（確認）</span>
            <div className="auth-password-row">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                aria-invalid={passwordMismatch}
                aria-describedby="password-confirm-hint"
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            <div
              id="password-confirm-hint"
              className={
                'auth-field-hint' +
                (passwordMatch ? ' is-ok' : '') +
                (passwordMismatch ? ' is-ng' : '')
              }
              aria-live="polite"
            >
              {passwordMatch
                ? '✅ 一致しています'
                : passwordMismatch
                  ? '❌ パスワードが一致しません'
                  : ' ' /* レイアウト保持の non-breaking space */}
            </div>
          </label>
          <fieldset className="auth-field auth-radio-row">
            <legend>所属</legend>
            {SELF_SIGNUP_ROLES.map((r) => (
              <label key={r} className="radio">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </fieldset>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !passwordMatch}
          >
            {submitting ? <Spinner /> : 'アカウント作成'}
          </button>
        </form>

        <div className="auth-foot">
          <Link to="/login">ログインへ</Link>
        </div>
      </div>
    </div>
  );
}
