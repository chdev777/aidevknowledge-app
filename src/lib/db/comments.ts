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

/**
 * 親 doc の visibility に応じた絞り込みでコメントを取得する。
 *
 * Firestore Rules はクエリ時に「結果が必ず read 規則を満たす」ことを静的に
 * 保証できる WHERE 句を要求する。`allow read: if targetVisibility=='shared'
 * || ownerOf(...)` を query から確実に満たすため、以下のいずれかを必ず付ける：
 * - mode='shared': `targetVisibility='shared'` を WHERE に追加（誰でも read 可）
 * - mode='mine':   `createdBy==uid` を WHERE に追加（owner として read 可）
 *
 * 親 visibility が shared の詳細ページでは shared コメントだけを表示。
 * 親 visibility が private の場合は本人しか到達できないため、本人の
 * コメント（mode='mine'）のみ取得すれば良い。
 */
export async function findByTarget(
  targetType: CommentTargetType,
  targetId: string,
  opts: {
    count?: number;
    mode: 'shared' | 'mine';
    /** mode='mine' のとき必須 */
    uid?: string;
  },
): Promise<Comment[]> {
  const base = [
    where('targetType', '==', targetType),
    where('targetId', '==', targetId),
  ];
  const visClause =
    opts.mode === 'shared'
      ? where('targetVisibility', '==', 'shared')
      : (() => {
          if (!opts.uid) throw new Error('uid is required for mode="mine"');
          return where('createdBy', '==', opts.uid);
        })();
  const q = query(
    collection(db, COL),
    ...base,
    visClause,
    orderBy('createdAt', 'desc'),
    limit(opts.count ?? 100),
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
