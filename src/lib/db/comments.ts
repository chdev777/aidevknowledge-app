import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { Comment, CommentTargetType, CommentType } from '../../types/comment.js';
import type { Visibility } from '../../types/visibility.js';
import { toComment } from './converters.js';

const COL = 'comments';

export interface CommentInput {
  targetType: CommentTargetType;
  targetId: string;
  /** 親docのvisibilityを引き継いで保存（Rules参照用の非正規化） */
  targetVisibility: Visibility;
  type: CommentType;
  body: string;
}

export async function findByTarget(
  targetType: CommentTargetType,
  targetId: string,
  opts?: { count?: number },
): Promise<Comment[]> {
  const q = query(
    collection(db, COL),
    where('targetType', '==', targetType),
    where('targetId', '==', targetId),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toComment(d as never));
}

export async function findByOwner(uid: string, opts?: { count?: number }): Promise<Comment[]> {
  const q = query(
    collection(db, COL),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toComment(d as never));
}

export async function create(uid: string, input: CommentInput): Promise<string> {
  const data: DocumentData = {
    ...input,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function remove(id: string): Promise<void> {
  await deleteDoc(doc(db, `${COL}/${id}`));
}
