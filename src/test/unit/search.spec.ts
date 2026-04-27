import { describe, expect, it } from 'vitest';
import { matches, searchByFields } from '../../lib/utils/search.js';

describe('matches', () => {
  it('空クエリは true', () => {
    expect(matches('something', '')).toBe(true);
    expect(matches('something', '   ')).toBe(true);
  });

  it('部分一致（大小無視）', () => {
    expect(matches('Hello World', 'world')).toBe(true);
    expect(matches('Hello World', 'WORLD')).toBe(true);
    expect(matches('Hello World', 'foobar')).toBe(false);
  });

  it('カタカナ↔ひらがな同一視', () => {
    expect(matches('らぐ検索', 'ラグ')).toBe(true);
    expect(matches('RAGは便利', 'rag')).toBe(true);
  });

  it('スペース区切り = AND', () => {
    expect(matches('Dify でFAQ検索', 'Dify FAQ')).toBe(true);
    expect(matches('Dify でFAQ検索', 'Dify Foo')).toBe(false);
  });

  it('NFKC 正規化（全角英数→半角）', () => {
    expect(matches('ＡＰＩキー', 'API')).toBe(true);
  });
});

describe('searchByFields', () => {
  const items = [
    { title: 'RAG設計の失敗', summary: 'チャンク戦略' },
    { title: 'Dify でFAQ検索', summary: 'KnowledgeBase' },
    { title: 'OpenAI API 料金', summary: 'コスト試算' },
  ];

  it('複数フィールドのうちどれかにヒットすれば残る', () => {
    expect(searchByFields(items, 'rag', ['title', 'summary'])).toHaveLength(1);
    expect(searchByFields(items, 'チャンク', ['summary'])).toHaveLength(1);
  });

  it('空クエリは全件返す', () => {
    expect(searchByFields(items, '', ['title'])).toHaveLength(items.length);
  });

  it('AND検索が効く', () => {
    expect(searchByFields(items, 'OpenAI API', ['title'])).toHaveLength(1);
  });
});
