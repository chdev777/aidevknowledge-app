import type { Visibility } from './visibility.js';

export type AppStatus = '試作' | '検証中' | '利用中' | '改善中' | '停止中';

export const APP_STATUS_VALUES: readonly AppStatus[] = [
  '試作',
  '検証中',
  '利用中',
  '改善中',
  '停止中',
] as const;

export type UsageScope = '個人検証' | 'グループ内' | '関係者限定' | '学内公開';

export const USAGE_SCOPE_VALUES: readonly UsageScope[] = [
  '個人検証',
  'グループ内',
  '関係者限定',
  '学内公開',
] as const;

export interface AppStats {
  views: number;
  comments: number;
  likes: number;
}

export interface AiApp {
  id: string;
  name: string;
  url: string;
  summary: string;
  /** どの課題を解決するために作ったか */
  purpose: string;
  technologies: string[];
  aiModel: string;
  usageScope: UsageScope;
  status: AppStatus;
  /** 入力禁止情報・既知の不具合など */
  caution: string;
  tags: string[];
  projectId?: string | undefined;
  createdBy: string;
  visibility: Visibility;
  thumbnailPath?: string | undefined;
  stats: AppStats;
  createdAt: Date;
  updatedAt: Date;
}
