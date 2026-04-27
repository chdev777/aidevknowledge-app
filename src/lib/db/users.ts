import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { User } from '../../types/user.js';
import { toUser } from './converters.js';

export async function findById(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, `users/${uid}`));
  if (!snap.exists()) return null;
  return toUser(snap as never);
}
