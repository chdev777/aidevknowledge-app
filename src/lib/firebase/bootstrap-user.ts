import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from './client.js';
import type { UserRole } from '../../types/user.js';
import { AppError } from '../utils/error.js';

export interface BootstrapInput {
  email: string;
  password: string;
  name: string;
  handle: string;
  role: UserRole;
  color: string;
}

const HANDLE_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

function pickColor(handle: string): string {
  const palette = ['#b08968', '#7a8b6f', '#6b7a99', '#a07a7a', '#8a7ab0', '#b0a078'];
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = (hash * 31 + handle.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length] ?? '#6b7a99';
}

/**
 * サインアップ時の users / handles / private の作成を順序保証する
 *
 * 1. handle 形式チェック
 * 2. createUserWithEmailAndPassword
 * 3. transaction で users/{uid} + handles/{handle} を同時 set（重複は tx.get で検知）
 * 4. private/profile を set（個人情報）
 * 5. メール検証メール送信
 *
 * 失敗時は出来る限りロールバック（Auth account 削除など）
 *
 * 注意: 事前の handle 重複チェックは行わない。Rules の `handles/{handle}` は read=signedIn()
 * のため signUp 前（未認証）に getDoc を呼ぶと permission-denied になる。重複検知は signUp 後の
 * transaction 内 tx.get に集約している。
 */
export async function bootstrapUser(input: BootstrapInput): Promise<{ uid: string }> {
  if (!HANDLE_PATTERN.test(input.handle)) {
    throw new AppError({
      code: 'app/handle-invalid',
      userMessage: 'ハンドル名は半角英数字 _ . - のみ、3〜32文字で指定してください。',
    });
  }
  if (input.role === '管理者') {
    throw new AppError({
      code: 'app/role-not-allowed',
      userMessage: '管理者ロールでの自己登録はできません。',
    });
  }

  const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
  const uid = cred.user.uid;

  try {
    await updateProfile(cred.user, { displayName: input.name });

    const color = input.color || pickColor(input.handle);

    await runTransaction(db, async (tx) => {
      const handleRef = doc(db, `handles/${input.handle}`);
      const fresh = await tx.get(handleRef);
      if (fresh.exists()) {
        throw new AppError({
          code: 'app/handle-taken',
          userMessage: 'このハンドル名は既に使われています。',
        });
      }
      tx.set(handleRef, { uid, createdAt: serverTimestamp() });
      tx.set(doc(db, `users/${uid}`), {
        name: input.name,
        handle: input.handle,
        role: input.role,
        color,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // private profile は users 作成後に別書込（Rules で本人のみ書込可）
    await setDoc(doc(db, `users/${uid}/private/profile`), {
      email: input.email,
      createdAt: serverTimestamp(),
    });

    await sendEmailVerification(cred.user).catch(() => {
      // メール送信失敗は致命的ではない（後で再送可能）
    });

    return { uid };
  } catch (err) {
    // ロールバック：Authアカウントを削除
    await cred.user.delete().catch(() => {});
    throw err;
  }
}
