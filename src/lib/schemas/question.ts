import { z } from 'zod';
import { longTextSchema, tagsSchema, titleSchema, visibilitySchema } from './common.js';
import { QUESTION_STATUS_VALUES } from '../../types/question.js';

export const questionInputSchema = z.object({
  title: titleSchema,
  body: longTextSchema(8000, '本文').refine((v) => v.length > 0, '本文を入力してください'),
  status: z.enum(QUESTION_STATUS_VALUES as readonly [string, ...string[]]),
  tags: tagsSchema,
  visibility: visibilitySchema,
});

export type QuestionInputSchema = z.infer<typeof questionInputSchema>;

export const answerInputSchema = z.object({
  body: longTextSchema(8000, '回答').refine((v) => v.length > 0, '回答を入力してください'),
});

export type AnswerInputSchema = z.infer<typeof answerInputSchema>;
