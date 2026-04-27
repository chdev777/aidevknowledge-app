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
import type { AiApp } from '../../types/app.js';
import type { Visibility } from '../../types/visibility.js';
import { toApp } from './converters.js';

const COL = 'apps';

export interface AppInput {
  name: string;
  url: string;
  summary: string;
  purpose: string;
  technologies: string[];
  aiModel: string;
  usageScope: AiApp['usageScope'];
  status: AiApp['status'];
  caution: string;
  tags: string[];
  projectId?: string | undefined;
  visibility: Visibility;
  thumbnailPath?: string | undefined;
}

export async function findShared(opts?: { count?: number }): Promise<AiApp[]> {
  const q = query(
    collection(db, COL),
    where('visibility', '==', 'shared'),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toApp(d as never));
}

export async function findByOwner(uid: string, opts?: { count?: number }): Promise<AiApp[]> {
  const q = query(
    collection(db, COL),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toApp(d as never));
}

export async function findById(id: string): Promise<AiApp | null> {
  const snap = await getDoc(doc(db, `${COL}/${id}`));
  if (!snap.exists()) return null;
  return toApp(snap as never);
}

export async function create(uid: string, input: AppInput): Promise<string> {
  const data: DocumentData = {
    ...input,
    createdBy: uid,
    stats: { views: 0, comments: 0, likes: 0 },
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
