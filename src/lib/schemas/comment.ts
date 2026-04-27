import { z } from 'zod';
import { COMMENT_TARGET_TYPES, COMMENT_TYPES } from '../../types/comment.js';

export const commentInputSchema = z.object({
  targetType: z.enum(COMMENT_TARGET_TYPES as readonly [string, ...string[]]),
  targetId: z.string().min(1),
  type: z.enum(COMMENT_TYPES as readonly [string, ...string[]]),
  body: z.string().trim().min(1, 'コメントを入力してください').max(2000),
});

export type CommentInputSchema = z.infer<typeof commentInputSchema>;
