import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { CommentTargetType } from '../../types/comment.js';

export interface Favorite {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  createdAt: Date;
}

function colPath(uid: string): string {
  return `favorites/${uid}/items`;
}

function favKey(targetType: CommentTargetType, targetId: string): string {
  return `${targetType}_${targetId}`;
}

export async function listByOwner(uid: string): Promise<Favorite[]> {
  const snap = await getDocs(query(collection(db, colPath(uid))));
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data['createdAt'];
    return {
      id: d.id,
      targetType: data['targetType'] as CommentTargetType,
      targetId: String(data['targetId']),
      createdAt: ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date(),
    };
  });
}

export async function isFavorite(
  uid: string,
  targetType: CommentTargetType,
  targetId: string,
): Promise<boolean> {
  const ref = doc(db, `${colPath(uid)}/${favKey(targetType, targetId)}`);
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function add(
  uid: string,
  targetType: CommentTargetType,
  targetId: string,
): Promise<void> {
  const ref = doc(db, `${colPath(uid)}/${favKey(targetType, targetId)}`);
  await setDoc(ref, {
    targetType,
    targetId,
    createdAt: serverTimestamp(),
  });
}

export async function remove(
  uid: string,
  targetType: CommentTargetType,
  targetId: string,
): Promise<void> {
  const ref = doc(db, `${colPath(uid)}/${favKey(targetType, targetId)}`);
  await deleteDoc(ref);
}
