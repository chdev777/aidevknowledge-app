import { z } from 'zod';
import { FEEDBACK_CATEGORIES } from '../../types/feedback.js';

export const feedbackInputSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES as readonly [string, ...string[]]),
  message: z
    .string()
    .trim()
    .min(1, '本文を入力してください')
    .max(1000, '本文は1000文字以内'),
  currentView: z.string().max(64).optional().default(''),
});

export type FeedbackInputSchema = z.infer<typeof feedbackInputSchema>;
