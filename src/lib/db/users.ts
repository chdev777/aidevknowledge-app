import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
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
