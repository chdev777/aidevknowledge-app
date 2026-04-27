import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { Tag, TagType } from '../../types/tag.js';

const COL = 'tags';

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
