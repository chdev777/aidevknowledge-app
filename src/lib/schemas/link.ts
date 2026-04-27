import { z } from 'zod';
import {
  longTextSchema,
  safeUrlSchema,
  tagsSchema,
  titleSchema,
  visibilitySchema,
} from './common.js';
import { IMPORTANCE_VALUES, LINK_STATUS_VALUES, SOURCE_TYPES } from '../../types/link.js';

export const linkInputSchema = z.object({
  title: titleSchema,
  url: safeUrlSchema,
  sourceType: z.enum(SOURCE_TYPES as readonly [string, ...string[]]),
  domain: z.string().max(253),
  summary: longTextSchema(2000, '概要'),
  userComment: longTextSchema(2000, '共有コメント'),
  importance: z.enum(IMPORTANCE_VALUES as readonly [string, ...string[]]),
  status: z.enum(LINK_STATUS_VALUES as readonly [string, ...string[]]),
  tags: tagsSchema,
  visibility: visibilitySchema,
  thumbnailUrl: z.string().url().optional(),
});

export type LinkInputSchema = z.infer<typeof linkInputSchema>;
