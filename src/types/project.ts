export type ProjectStatus = '試作' | '検証中' | '利用中' | '改善中' | '停止中';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  owner: string;
  color: string;
  links?: number;
  questions?: number;
  notes?: number;
  apps?: number;
}
