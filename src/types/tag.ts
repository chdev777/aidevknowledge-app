export type TagType = '技術' | 'ツール' | '開発' | '用途' | 'セキュリティ' | '状態';

export const TAG_TYPES: readonly TagType[] = [
  '技術',
  'ツール',
  '開発',
  '用途',
  'セキュリティ',
  '状態',
] as const;

export interface Tag {
  id: string;
  name: string;
  type: TagType;
}
