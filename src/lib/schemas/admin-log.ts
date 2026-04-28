import { z } from 'zod';

export const ADMIN_LOG_ACTIONS = [
  'set_role',
  'delete_link',
  'delete_qa',
  'delete_note',
  'delete_app',
  'create_tag',
  'update_tag',
  'delete_tag',
] as const;

export type AdminLogAction = (typeof ADMIN_LOG_ACTIONS)[number];

export const adminLogInputSchema = z.object({
  action: z.enum(ADMIN_LOG_ACTIONS as readonly [AdminLogAction, ...AdminLogAction[]]),
  targetType: z.string().min(1).max(32),
  targetId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export type AdminLogInputSchema = z.infer<typeof adminLogInputSchema>;
