import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { User, UserRole } from '../../types/user.js';
import { toUser } from './converters.js';

const COL = 'users';

export async function findById(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, `${COL}/${uid}`));
  if (!snap.exists()) return null;
  return toUser(snap as never);
}

export async function findAll(opts?: { role?: UserRole }): Promise<User[]> {
  const q = opts?.role
    ? query(collection(db, COL), where('role', '==', opts.role))
    : query(collection(db, COL));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toUser(d as never));
}

export async function setRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, `${COL}/${uid}`), {
    role,
    updatedAt: serverTimestamp(),
  });
}

/** 管理者降格 UX チェック用（Rules では検証しない） */
export async function countByRole(role: UserRole): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db, COL), where('role', '==', role)),
  );
  return snap.data().count;
}

/**
 * 管理者による他ユーザの Firestore 側削除（2 段階）。
 *
 * Auth アカウントは Firebase Console で別途手動削除が必要（Spark プランでは Admin SDK 不可）。
 * 投稿コンテンツ（links / notes / apps / questions / comments）は残置され createdBy は orphan 参照になる。
 *
 * 段階分けの理由: handles の delete Rule が「対応する users/{uid} が存在しないこと」を要求するため、
 * users/{uid} を先に消してから handles/{handle} を消す必要がある。同一 writeBatch 内では中間状態を
 * Rules が見るため通らない。
 *
 * 段階 1: users/{uid} + users/{uid}/private/profile を atomic 削除
 * 段階 2: handles/{handle} を解放
 *
 * 段階 1 成功 → 段階 2 失敗の場合 handle は orphan で残るが、handle.uid に対応する user が消えているため
 * 他者が同 uid を作成できず、奪取は不可能。後追いで管理 UI または手動で再削除可能。
 */
export async function deleteAsAdmin(uid: string, handle: string): Promise<void> {
  // 段階 1: users + private を atomic 削除
  const batch = writeBatch(db);
  batch.delete(doc(db, `${COL}/${uid}`));
  batch.delete(doc(db, `${COL}/${uid}/private/profile`));
  await batch.commit();

  // 段階 2: user 削除後に handle 解放（Rules が user 不在を確認してから許可する）
  await deleteDoc(doc(db, `handles/${handle}`));
}
