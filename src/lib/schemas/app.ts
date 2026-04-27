import { z } from 'zod';
import {
  longTextSchema,
  safeUrlSchema,
  tagsSchema,
  visibilitySchema,
} from './common.js';
import { APP_STATUS_VALUES, USAGE_SCOPE_VALUES } from '../../types/app.js';

export const appInputSchema = z.object({
  name: z.string().trim().min(1, 'アプリ名を入力してください').max(200),
  url: safeUrlSchema,
  summary: longTextSchema(4000, '概要'),
  purpose: longTextSchema(4000, '開発目的'),
  technologies: z.array(z.string().trim().min(1).max(48)).max(20).default([]),
  aiModel: z.string().max(100).default(''),
  usageScope: z.enum(USAGE_SCOPE_VALUES as readonly [string, ...string[]]),
  status: z.enum(APP_STATUS_VALUES as readonly [string, ...string[]]),
  caution: longTextSchema(2000, '注意事項'),
  tags: tagsSchema,
  visibility: visibilitySchema,
});

export type AppInputSchema = z.infer<typeof appInputSchema>;
