import type { AdminLogAction } from '../lib/schemas/admin-log.js';

export type { AdminLogAction };

export interface AdminLog {
  id: string;
  actorId: string;
  actorHandle: string;
  action: AdminLogAction;
  targetType: string;
  targetId: string;
  targetSnapshot?: Record<string, unknown> | undefined;
  reason?: string | undefined;
  createdAt: Date;
}
