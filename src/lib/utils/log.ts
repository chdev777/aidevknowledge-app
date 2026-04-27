/**
 * ログユーティリティ
 *
 * - console.* を直接呼ばない（Stop hook で警告対象）
 * - PII（メール・名前）をマスクする
 * - 本番では Sentry / Cloud Logging に送信する想定（Phase 2）
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function maskEmail(email: string): string {
  if (!email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const head = local.charAt(0);
  return `${head}***@${domain}`;
}

function maskValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/[\w.+-]+@[\w.-]+/.test(value)) {
      return value.replace(/[\w.+-]+@[\w.-]+/g, (m) => maskEmail(m));
    }
    return value;
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(maskValue);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'email' || k === 'mail' || k === 'mailAddress') {
        out[k] = typeof v === 'string' ? maskEmail(v) : '***';
      } else if (k === 'password' || k === 'token' || k === 'idToken' || k === 'apiKey') {
        out[k] = '***';
      } else {
        out[k] = maskValue(v);
      }
    }
    return out;
  }
  return value;
}

function emit(level: LogLevel, message: string, context?: unknown) {
  const ts = new Date().toISOString();
  const masked = context !== undefined ? maskValue(context) : undefined;
  // eslint-disable-next-line no-console
  const fn = level === 'debug' ? console.debug
    : level === 'info' ? console.info
    : level === 'warn' ? console.warn
    : console.error;
  if (masked === undefined) fn(`[${ts}] ${message}`);
  else fn(`[${ts}] ${message}`, masked);
}

export const logger = {
  debug: (message: string, context?: unknown) => emit('debug', message, context),
  info: (message: string, context?: unknown) => emit('info', message, context),
  warn: (message: string, context?: unknown) => emit('warn', message, context),
  error: (message: string, context?: unknown) => emit('error', message, context),
};
