import type { Visibility } from './visibility.js';

export interface NoteAttachment {
  path: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface Note {
  id: string;
  title: string;
  /** 何を確認したかったか */
  purpose: string;
  /** 設定・手順・条件 */
  tried: string;
  /** うまくいった点・課題 */
  result: string;
  /** 採用可否・今後の対応 */
  conclusion: string;
  tags: string[];
  /** 関連リンクのID */
  links: string[];
  projectId?: string | undefined;
  createdBy: string;
  visibility: Visibility;
  attachments: NoteAttachment[];
  createdAt: Date;
  updatedAt: Date;
}
