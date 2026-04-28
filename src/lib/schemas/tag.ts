import { z } from 'zod';
import { TAG_TYPES } from '../../types/tag.js';

export const tagInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'タグ名を入力してください')
    .max(32, 'タグ名は32文字以内'),
  type: z.enum(TAG_TYPES as readonly [string, ...string[]]),
});

export type TagInputSchema = z.infer<typeof tagInputSchema>;
