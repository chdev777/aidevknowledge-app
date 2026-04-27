import { describe, expect, it } from 'vitest';
import { linkInputSchema } from '../../lib/schemas/link.js';
import { commentInputSchema } from '../../lib/schemas/comment.js';
import { tagsSchema, csvToTags } from '../../lib/schemas/common.js';

const baseLink = {
  title: 'タイトル',
  url: 'https://example.com',
  sourceType: 'Web',
  domain: 'example.com',
  summary: '概要',
  userComment: 'コメント',
  importance: '中',
  status: '未確認',
  tags: ['rag'],
  visibility: 'private',
};

describe('linkInputSchema', () => {
  it('正常入力は通る', () => {
    expect(() => linkInputSchema.parse(baseLink)).not.toThrow();
  });

  it('javascript: URL は拒否', () => {
    expect(() => linkInputSchema.parse({ ...baseLink, url: 'javascript:alert(1)' })).toThrow();
  });

  it('file: URL は拒否', () => {
    expect(() => linkInputSchema.parse({ ...baseLink, url: 'file:///etc/passwd' })).toThrow();
  });

  it('タイトル200字超は拒否', () => {
    expect(() => linkInputSchema.parse({ ...baseLink, title: 'x'.repeat(201) })).toThrow();
  });

  it('タイトル空は拒否', () => {
    expect(() => linkInputSchema.parse({ ...baseLink, title: '   ' })).toThrow();
  });

  it('未知の sourceType は拒否', () => {
    expect(() => linkInputSchema.parse({ ...baseLink, sourceType: 'Slack' })).toThrow();
  });

  it('visibility が enum 外なら拒否', () => {
    expect(() => linkInputSchema.parse({ ...baseLink, visibility: 'public' })).toThrow();
  });
});

describe('commentInputSchema', () => {
  it('未知の type は拒否', () => {
    expect(() =>
      commentInputSchema.parse({
        targetType: 'link',
        targetId: 'l1',
        type: 'スパム',
        body: 'x',
      }),
    ).toThrow();
  });
  it('body 2000字超は拒否', () => {
    expect(() =>
      commentInputSchema.parse({
        targetType: 'link',
        targetId: 'l1',
        type: '感想',
        body: 'x'.repeat(2001),
      }),
    ).toThrow();
  });
  it('body 空は拒否', () => {
    expect(() =>
      commentInputSchema.parse({
        targetType: 'link',
        targetId: 'l1',
        type: '感想',
        body: '   ',
      }),
    ).toThrow();
  });
});

describe('tagsSchema', () => {
  it('trim + 重複除去 + 空除去', () => {
    const out = tagsSchema.parse(['  rag', 'rag', 'dify ', '']);
    expect(out).toEqual(['rag', 'dify']);
  });
  it('11個以上は拒否', () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    expect(() => tagsSchema.parse(eleven)).toThrow();
  });
  it('33文字超のタグは拒否', () => {
    expect(() => tagsSchema.parse(['x'.repeat(33)])).toThrow();
  });
});

describe('csvToTags', () => {
  it('カンマ区切り（半角・全角）でパース', () => {
    expect(csvToTags('rag, dify、claude')).toEqual(['rag', 'dify', 'claude']);
  });
  it('11個目以降は切り捨て', () => {
    const csv = Array.from({ length: 12 }, (_, i) => `t${i}`).join(',');
    expect(csvToTags(csv)).toHaveLength(10);
  });
});
