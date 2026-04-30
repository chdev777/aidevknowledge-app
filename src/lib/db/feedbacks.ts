import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type {
  Feedback,
  FeedbackCategory,
  FeedbackStatus,
} from '../../types/feedback.js';
import { reachableStatuses } from '../../types/feedback.js';

const COL = 'feedbacks';

export interface FeedbackInput {
  category: FeedbackCategory;
  message: string;
  currentView: string;
}

export interface FeedbackActor {
  uid: string;
  userHandleSnap: string;
  userNameSnap: string;
}

function ts(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const v = value as { toDate?: () => Date };
  return v.toDate ? v.toDate() : new Date();
}

function toFeedback(snap: QueryDocumentSnapshot<DocumentData>): Feedback {
  const d = snap.data();
  return {
    id: snap.id,
    createdBy: String(d['createdBy'] ?? ''),
    userHandleSnap: String(d['userHandleSnap'] ?? ''),
    userNameSnap: String(d['userNameSnap'] ?? ''),
    category: (d['category'] ?? 'other') as FeedbackCategory,
    message: String(d['message'] ?? ''),
    currentView: String(d['currentView'] ?? ''),
    status: (d['status'] ?? 'new') as FeedbackStatus,
    createdAt: ts(d['createdAt']),
    updatedAt: ts(d['updatedAt']),
  };
}

/** ユーザー投稿（Rules で createdBy/status/category/message を検証） */
export async function create(
  actor: FeedbackActor,
  input: FeedbackInput,
): Promise<string> {
  const data: DocumentData = {
    createdBy: actor.uid,
    userHandleSnap: actor.userHandleSnap,
    userNameSnap: actor.userNameSnap,
    category: input.category,
    message: input.message,
    currentView: input.currentView,
    status: 'new' satisfies FeedbackStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

/** 管理者用：直近 N 件を createdAt 降順で取得 */
export async function findRecent(count = 200): Promise<Feedback[]> {
  const q = query(
    collection(db, COL),
    orderBy('createdAt', 'desc'),
    limit(count),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toFeedback(d));
}

/**
 * ステータス更新。同状態は no-op（NO_CHANGE）として早期 return。
 * 双方向遷移を許容（逆遷移含む）。状態変更は admin_logs に記録される。
 *
 * INVALID_TRANSITION ブランチは型システムが弾く想定だが、文字列キャスト等の
 * 異常系混入に対する防御として残す（reachableStatuses は将来の制限拡張用フック）。
 */
export async function setStatus(
  id: string,
  current: FeedbackStatus,
  next: FeedbackStatus,
): Promise<void> {
  if (current === next) {
    throw new Error('NO_CHANGE');
  }
  if (!reachableStatuses(current).includes(next)) {
    throw new Error('INVALID_TRANSITION');
  }
  await updateDoc(doc(db, `${COL}/${id}`), {
    status: next,
    updatedAt: serverTimestamp(),
  });
}
