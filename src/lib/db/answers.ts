import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { Answer } from '../../types/question.js';
import { toAnswer } from './converters.js';

const sub = (qid: string) => collection(db, `questions/${qid}/answers`);

export async function listByQuestion(qid: string): Promise<Answer[]> {
  const q = query(sub(qid), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toAnswer(qid, d as never));
}

export async function create(qid: string, uid: string, body: string): Promise<string> {
  const data: DocumentData = {
    body,
    createdBy: uid,
    votes: 0,
    accepted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(sub(qid), data);
  return ref.id;
}

export async function vote(qid: string, aid: string, delta: 1 | -1): Promise<void> {
  await updateDoc(doc(db, `questions/${qid}/answers/${aid}`), {
    votes: increment(delta),
    updatedAt: serverTimestamp(),
  });
}

export async function setAccepted(qid: string, aid: string, accepted: boolean): Promise<void> {
  await updateDoc(doc(db, `questions/${qid}/answers/${aid}`), {
    accepted,
    updatedAt: serverTimestamp(),
  });
}

export async function remove(qid: string, aid: string): Promise<void> {
  await deleteDoc(doc(db, `questions/${qid}/answers/${aid}`));
}
