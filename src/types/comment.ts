import type { Visibility } from './visibility.js';

export type CommentTargetType = 'link' | 'question' | 'note' | 'app';

export const COMMENT_TARGET_TYPES: readonly CommentTargetType[] = [
  'link',
  'question',
  'note',
  'app',
] as const;

export type CommentType =
  | '感想'
  | '改善提案'
  | '不具合報告'
  | '活用アイデア'
  | '技術メモ'
  | 'セキュリティ指摘';

export const COMMENT_TYPES: readonly CommentType[] = [
  '感想',
  '改善提案',
  '不具合報告',
  '活用アイデア',
  '技術メモ',
  'セキュリティ指摘',
] as const;

export interface Comment {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  type: CommentType;
  body: string;
  createdBy: string;
  /** 親docのvisibilityを非正規化保持（Rules で get() コスト回避） */
  targetVisibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
}
