import { FirebaseError } from 'firebase/app';

/** ユーザー向け表示メッセージを持つアプリケーションエラー */
export class AppError extends Error {
  public readonly userMessage: string;
  public readonly code: string;
  public readonly cause?: unknown;

  constructor(opts: { code: string; userMessage: string; cause?: unknown }) {
    super(opts.userMessage);
    this.name = 'AppError';
    this.code = opts.code;
    this.userMessage = opts.userMessage;
    this.cause = opts.cause;
  }
}

const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'メールアドレスの形式が正しくありません。',
  'auth/user-not-found': 'メールまたはパスワードが正しくありません。',
  'auth/wrong-password': 'メールまたはパスワードが正しくありません。',
  'auth/invalid-credential': 'メールまたはパスワードが正しくありません。',
  'auth/email-already-in-use': 'このメールアドレスは既に登録されています。',
  'auth/weak-password': 'パスワードが弱すぎます。8文字以上で英数字を含めてください。',
  'auth/too-many-requests':
    '試行回数が多すぎます。しばらく時間をおいてから再度お試しください。',
  'auth/network-request-failed': 'ネットワークに接続できませんでした。',
  'auth/operation-not-allowed': 'この操作は管理者により無効化されています。',
  'auth/requires-recent-login': '本人確認のため再ログインしてください。',
  'auth/id-token-expired': 'セッションが切れました。再ログインしてください。',
};

const FIRESTORE_MESSAGES: Record<string, string> = {
  'permission-denied': 'この操作は許可されていません。',
  unauthenticated: 'ログインしてください。',
  'not-found': '対象が見つかりませんでした。',
  'already-exists': '同じデータが既に存在します。',
  'failed-precondition': '前提条件が満たされていません。',
  'resource-exhausted': '一時的に上限に達しました。少し待ってから再度お試しください。',
  unavailable: 'サーバに接続できませんでした。',
};

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof FirebaseError) {
    const code = error.code;
    if (code in FIREBASE_AUTH_MESSAGES) {
      return new AppError({
        code,
        userMessage: FIREBASE_AUTH_MESSAGES[code]!,
        cause: error,
      });
    }
    // firestore: code は "permission-denied" のような短い形式
    const fsCode = code.replace(/^firestore\//, '');
    if (fsCode in FIRESTORE_MESSAGES) {
      return new AppError({
        code,
        userMessage: FIRESTORE_MESSAGES[fsCode]!,
        cause: error,
      });
    }
    return new AppError({
      code,
      userMessage: '操作に失敗しました。しばらくしてから再度お試しください。',
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new AppError({
      code: 'unknown',
      userMessage: '予期しないエラーが発生しました。',
      cause: error,
    });
  }

  return new AppError({
    code: 'unknown',
    userMessage: '予期しないエラーが発生しました。',
    cause: error,
  });
}
