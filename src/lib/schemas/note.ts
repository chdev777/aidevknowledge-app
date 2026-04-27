import { z } from 'zod';
import { longTextSchema, tagsSchema, titleSchema, visibilitySchema } from './common.js';

export const noteInputSchema = z.object({
  title: titleSchema,
  purpose: longTextSchema(4000, '目的'),
  tried: longTextSchema(8000, '試したこと'),
  result: longTextSchema(4000, '結果'),
  conclusion: longTextSchema(2000, '結論'),
  tags: tagsSchema,
  links: z.array(z.string()).max(20).default([]),
  visibility: visibilitySchema,
});

export type NoteInputSchema = z.infer<typeof noteInputSchema>;
