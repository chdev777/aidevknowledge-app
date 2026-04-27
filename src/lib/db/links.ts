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
import type { Link } from '../../types/link.js';
import type { Visibility } from '../../types/visibility.js';
import { toLink } from './converters.js';

const COL = 'links';

export interface LinkInput {
  title: string;
  url: string;
  sourceType: Link['sourceType'];
  domain: string;
  summary: string;
  userComment: string;
  importance: Link['importance'];
  status: Link['status'];
  tags: string[];
  projectId?: string | undefined;
  visibility: Visibility;
  thumbnailUrl?: string | undefined;
  thumbnailPath?: string | undefined;
}

export async function findShared(opts?: { count?: number }): Promise<Link[]> {
  const q = query(
    collection(db, COL),
    where('visibility', '==', 'shared'),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toLink(d as never));
}

export async function findByOwner(uid: string, opts?: { count?: number }): Promise<Link[]> {
  const q = query(
    collection(db, COL),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(opts?.count ?? 100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toLink(d as never));
}

export async function findById(id: string): Promise<Link | null> {
  const snap = await getDoc(doc(db, `${COL}/${id}`));
  if (!snap.exists()) return null;
  return toLink(snap as never);
}

export async function create(uid: string, input: LinkInput): Promise<string> {
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

export async function update(id: string, patch: Partial<LinkInput>): Promise<void> {
  await updateDoc(doc(db, `${COL}/${id}`), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function remove(id: string): Promise<void> {
  await deleteDoc(doc(db, `${COL}/${id}`));
}
