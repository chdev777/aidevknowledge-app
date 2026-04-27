import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { Question } from '../../types/question.js';
import type { Visibility } from '../../types/visibility.js';
import { toQuestion } from './converters.js';

const COL = 'questions';

export interface QuestionInput {
  title: string;
  body: string;
  status: Question['status'];
  tags: string[];
  projectId?: string | undefined;
  visibility: Visibility;
}

export async function findShared(opts?: { count?: number }): Promise<Question[]> {
  const q = query(
    collection(db, COL),
    where('visibility', '==', 'shared'),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toQuestion(d as never));
}

export async function findUnanswered(opts?: { count?: number }): Promise<Question[]> {
  const q = query(
    collection(db, COL),
    where('visibility', '==', 'shared'),
    where('answerCount', '==', 0),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 10),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toQuestion(d as never));
}

export async function findByOwner(uid: string, opts?: { count?: number }): Promise<Question[]> {
  const q = query(
    collection(db, COL),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toQuestion(d as never));
}

export async function findById(id: string): Promise<Question | null> {
  const snap = await getDoc(doc(db, `${COL}/${id}`));
  if (!snap.exists()) return null;
  return toQuestion(snap as never);
}

export async function create(uid: string, input: QuestionInput): Promise<string> {
  const data: DocumentData = {
    ...input,
    createdBy: uid,
    answerCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateVisibility(id: string, visibility: Visibility): Promise<void> {
  await updateDoc(doc(db, `${COL}/${id}`), {
    visibility,
    updatedAt: serverTimestamp(),
  });
}

export async function setAcceptedAnswer(id: string, answerId: string): Promise<void> {
  await updateDoc(doc(db, `${COL}/${id}`), {
    acceptedAnswerId: answerId,
    status: '解決済み',
    updatedAt: serverTimestamp(),
  });
}

export async function remove(id: string): Promise<void> {
  await deleteDoc(doc(db, `${COL}/${id}`));
}
