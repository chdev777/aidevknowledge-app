import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { Project } from '../../types/project.js';

const COL = 'projects';

function fromDoc(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    name: String(data['name'] ?? ''),
    description: String(data['description'] ?? ''),
    color: String(data['color'] ?? '#888'),
    status: (data['status'] ?? '試作') as Project['status'],
    owner: String(data['owner'] ?? ''),
    links: typeof data['links'] === 'number' ? (data['links'] as number) : undefined,
    questions: typeof data['questions'] === 'number' ? (data['questions'] as number) : undefined,
    notes: typeof data['notes'] === 'number' ? (data['notes'] as number) : undefined,
    apps: typeof data['apps'] === 'number' ? (data['apps'] as number) : undefined,
  };
}

export async function findAll(): Promise<Project[]> {
  const snap = await getDocs(query(collection(db, COL)));
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export async function findById(id: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, `${COL}/${id}`));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}
