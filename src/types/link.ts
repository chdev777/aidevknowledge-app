import type { Visibility } from './visibility.js';

export type SourceType = 'YouTube' | 'X' | 'GitHub' | '記事' | '公式Docs' | 'Web';

export const SOURCE_TYPES: readonly SourceType[] = [
  'YouTube',
  'X',
  'GitHub',
  '記事',
  '公式Docs',
  'Web',
] as const;

export type Importance = '高' | '中' | '低';

export const IMPORTANCE_VALUES: readonly Importance[] = ['高', '中', '低'] as const;

export type LinkStatus = '未確認' | '確認中' | '検証済み' | '採用候補' | '保留';

export const LINK_STATUS_VALUES: readonly LinkStatus[] = [
  '未確認',
  '確認中',
  '検証済み',
  '採用候補',
  '保留',
] as const;

export interface Link {
  id: string;
  title: string;
  url: string;
  sourceType: SourceType;
  domain: string;
  summary: string;
  userComment: string;
  importance: Importance;
  status: LinkStatus;
  tags: string[];
  projectId?: string | undefined;
  createdBy: string;
  visibility: Visibility;
  /** 外部URL（YouTube ytimg 等） */
  thumbnailUrl?: string | undefined;
  /** Storage 内部キー */
  thumbnailPath?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}
