import type { Visibility } from './visibility.js';

export type QuestionStatus = '未回答' | '回答中' | '解決済み' | '保留';

export const QUESTION_STATUS_VALUES: readonly QuestionStatus[] = [
  '未回答',
  '回答中',
  '解決済み',
  '保留',
] as const;

export interface Question {
  id: string;
  title: string;
  body: string;
  status: QuestionStatus;
  tags: string[];
  projectId?: string | undefined;
  createdBy: string;
  visibility: Visibility;
  answerCount: number;
  acceptedAnswerId?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  body: string;
  createdBy: string;
  votes: number;
  accepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
