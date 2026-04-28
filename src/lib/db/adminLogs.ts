import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/client.js';
import type { AdminLog, AdminLogAction } from '../../types/admin-log.js';

const COL = 'admin_logs';

export interface AdminLogInput {
  action: AdminLogAction;
  targetType: string;
  targetId: string;
  targetSnapshot?: Record<string, unknown> | undefined;
  reason?: string | undefined;
}

function toAdminLog(snap: QueryDocumentSnapshot<DocumentData>): AdminLog {
  const d = snap.data();
  const ts = d['createdAt'] as { toDate?: () => Date } | undefined;
  return {
    id: snap.id,
    actorId: String(d['actorId'] ?? ''),
    actorHandle: String(d['actorHandle'] ?? ''),
    action: (d['action'] ?? 'set_role') as AdminLogAction,
    targetType: String(d['targetType'] ?? ''),
    targetId: String(d['targetId'] ?? ''),
    targetSnapshot: d['targetSnapshot'] as Record<string, unknown> | undefined,
    reason: d['reason'] as string | undefined,
    createdAt: ts?.toDate ? ts.toDate() : new Date(),
  };
}

export async function record(
  actor: { uid: string; handle: string },
  input: AdminLogInput,
): Promise<string> {
  const data = {
    actorId: actor.uid,
    actorHandle: actor.handle,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    ...(input.targetSnapshot !== undefined && { targetSnapshot: input.targetSnapshot }),
    ...(input.reason !== undefined && { reason: input.reason }),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function findRecent(count = 20): Promise<AdminLog[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toAdminLog(d));
}
