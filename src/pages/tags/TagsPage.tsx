import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appsDb, linksDb, notesDb, questionsDb, tagsDb } from '../../lib/db/index.js';
import { PageHeader } from '../../components/shared/PageHeader.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import type { Tag, TagType } from '../../types/tag.js';

const TYPE_ORDER: TagType[] = ['技術', 'ツール', '開発', '用途', 'セキュリティ', '状態'];

async function loadTagCounts(): Promise<Map<string, number>> {
  const [links, questions, notes, apps] = await Promise.all([
    linksDb.findShared({ count: 500 }),
    questionsDb.findShared({ count: 500 }),
    notesDb.findShared({ count: 500 }),
    appsDb.findShared({ count: 500 }),
  ]);
  const counts = new Map<string, number>();
  const tally = (tags: string[] | undefined) => {
    (tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  };
  links.forEach((x) => tally(x.tags));
  questions.forEach((x) => tally(x.tags));
  notes.forEach((x) => tally(x.tags));
  apps.forEach((x) => tally(x.tags));
  return counts;
}

export function TagsPage() {
  const tagsQ = useQuery({
    queryKey: ['tags', 'all'],
    queryFn: () => tagsDb.findAll(),
    staleTime: 5 * 60_000,
  });
  const countsQ = useQuery({
    queryKey: ['tags', 'counts'],
    queryFn: loadTagCounts,
    staleTime: 5 * 60_000,
  });

  const grouped = useMemo(() => {
    const m = new Map<TagType, Tag[]>();
    (tagsQ.data ?? []).forEach((t) => {
      const list = m.get(t.type) ?? [];
      list.push(t);
      m.set(t.type, list);
    });
    return m;
  }, [tagsQ.data]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="06 · TAGS"
        title="タグ"
        subtitle="技術・ツール・用途・セキュリティなど、情報を分類する軸。"
      />

      {tagsQ.isPending && <Spinner />}
      {tagsQ.data && tagsQ.data.length === 0 && (
        <EmptyState title="タグはまだ登録されていません" />
      )}

      {TYPE_ORDER.map((type) => {
        const tags = grouped.get(type);
        if (!tags || tags.length === 0) return null;
        return (
          <div key={type} style={{ marginBottom: 30 }}>
            <div className="section-title">
              {type} <span className="section-count">({tags.length})</span>
            </div>
            <div className="tag-grid">
              {tags.map((t) => (
                <div key={t.id} className="tag-cell">
                  <span className="tag-name">
                    <span className="tag" data-type={type}>
                      <span className="tag-dot" />
                    </span>
                    {t.name}
                  </span>
                  <span className="tag-count">{countsQ.data?.get(t.name) ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
