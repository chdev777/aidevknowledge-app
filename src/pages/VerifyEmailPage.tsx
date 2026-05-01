import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/firebase/auth-context.js';
import { toAppError } from '../lib/utils/error.js';
import { Spinner } from '../components/shared/Spinner.js';

/**
 * 確認メール待機画面。
 * SignupPage / LoginPage から status='unverified' で遷移してくる。
 * - 「確認した（再読込）」: auth.currentUser.reload() で emailVerified を再評価
 * - 「再送」: sendEmailVerification を再送
 * - 「サインアウト」: 別のメールでやり直したい場合
 */
export function VerifyEmailPage() {
  const { status, fbUser, sendVerification, recheckVerification, signOut } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [resentAt, setResentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 検証完了 → home へ
  useEffect(() => {
    if (status === 'authed') navigate('/', { replace: true });
    if (status === 'unauthed') navigate('/login', { replace: true });
  }, [status, navigate]);

  const onRecheck = async () => {
    setError(null);
    setRechecking(true);
    try {
      await recheckVerification();
    } catch (err) {
      setError(toAppError(err).userMessage);
    } finally {
      setRechecking(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setResending(true);
    try {
      await sendVerification();
      setResentAt(Date.now());
    } catch (err) {
      setError(toAppError(err).userMessage);
    } finally {
      setResending(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <div className="brand-logo" />
            <div>
              <div className="brand-name">メール認証が必要です</div>
              <div className="brand-tag mono">verify your email to continue</div>
            </div>
          </div>
        </div>

        <p className="auth-done">
          {fbUser?.email ? (
            <>
              <strong>{fbUser.email}</strong> 宛に確認メールを送信しました。
            </>
          ) : (
            '確認メールを送信しました。'
          )}
          <br />
          メール内のリンクをクリックして認証を完了させてから、下の「確認した」ボタンを押してください。
        </p>

        {error && <div className="auth-error">{error}</div>}
        {resentAt && !error && (
          <div className="auth-field-hint is-ok" role="status">
            ✅ 確認メールを再送しました
          </div>
        )}

        <div className="auth-form">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRecheck}
            disabled={rechecking || resending}
          >
            {rechecking ? <Spinner /> : '確認した（再読込）'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onResend}
            disabled={resending || rechecking}
          >
            {resending ? <Spinner /> : '確認メールを再送'}
          </button>
        </div>

        <div className="auth-foot">
          <button type="button" className="link-like" onClick={onSignOut}>
            別のメールでやり直す（サインアウト）
          </button>
        </div>
      </div>
    </div>
  );
}
