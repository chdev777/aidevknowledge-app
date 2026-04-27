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
import type { Note, NoteAttachment } from '../../types/note.js';
import type { Visibility } from '../../types/visibility.js';
import { toNote } from './converters.js';

const COL = 'notes';

export interface NoteInput {
  title: string;
  purpose: string;
  tried: string;
  result: string;
  conclusion: string;
  tags: string[];
  links: string[];
  projectId?: string | undefined;
  visibility: Visibility;
  attachments: NoteAttachment[];
}

export async function findShared(opts?: { count?: number }): Promise<Note[]> {
  const q = query(
    collection(db, COL),
    where('visibility', '==', 'shared'),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toNote(d as never));
}

export async function findByOwner(uid: string, opts?: { count?: number }): Promise<Note[]> {
  const q = query(
    collection(db, COL),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toNote(d as never));
}

export async function findById(id: string): Promise<Note | null> {
  const snap = await getDoc(doc(db, `${COL}/${id}`));
  if (!snap.exists()) return null;
  return toNote(snap as never);
}

export async function create(uid: string, input: NoteInput): Promise<string> {
  const data: DocumentData = {
    ...input,
    createdBy: uid,
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

export async function remove(id: string): Promise<void> {
  await deleteDoc(doc(db, `${COL}/${id}`));
}
