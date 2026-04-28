import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { Tag, TagType } from '../../types/tag.js';

const COL = 'tags';

export interface TagInput {
  name: string;
  type: TagType;
}

export async function findAll(): Promise<Tag[]> {
  const snap = await getDocs(query(collection(db, COL)));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: String(data['name'] ?? ''),
      type: (data['type'] ?? '技術') as TagType,
    };
  });
}

export async function create(input: TagInput): Promise<string> {
  const ref = await addDoc(collection(db, COL), input);
  return ref.id;
}

export async function update(id: string, input: TagInput): Promise<void> {
  await updateDoc(doc(db, `${COL}/${id}`), { ...input });
}

export async function remove(id: string): Promise<void> {
  await deleteDoc(doc(db, `${COL}/${id}`));
}
