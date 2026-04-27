import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionsDb } from '../../lib/db/index.js';
import { searchByFields } from '../../lib/utils/search.js';
import { QUESTION_STATUS_VALUES, type QuestionStatus } from '../../types/question.js';
import { StatusBadge } from '../../components/shared/StatusBadge.js';
import { TagList } from '../../components/shared/Tag.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { Spinner } from '../../components/shared/Spinner.js';

export function QAPage() {
  const [, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | QuestionStatus>('all');

  const q = useQuery({
    queryKey: ['questions', 'shared'],
    queryFn: () => questionsDb.findShared({ count: 200 }),
  });

  const filtered = useMemo(() => {
    if (!q.data) return [];
    return searchByFields(
      q.data.filter((qq) => (status === 'all' ? true : qq.status === status)),
      search,
      ['title', 'body'],
    );
  }, [q.data, search, status]);

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Q&A</h1>
            <p className="page-subtitle">疑問を投稿し、回答を蓄積する場所</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setParams({ compose: 'question' })}
          >
            ＋ 質問する
          </button>
        </div>
      </header>

      <div className="list-toolbar">
        <input
          type="search"
          placeholder="タイトル・本文で検索"
          className="list-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="list-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | QuestionStatus)}
        >
          <option value="all">すべてのステータス</option>
          {QUESTION_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {q.isPending && <div className="section-loading"><Spinner /></div>}
      {q.data && filtered.length === 0 && (
        <EmptyState title="該当する質問はありません" />
      )}

      <ul className="row-list">
        {filtered.map((qq) => (
          <li key={qq.id} className="row-item">
            <Link to={`/qa/${qq.id}`} className="row-link">
              <div className="row-meta">
                <StatusBadge value={qq.status} />
                <span className="mono row-domain">回答 {qq.answerCount}</span>
                {qq.acceptedAnswerId && (
                  <span className="mono accepted-mark">採用済</span>
                )}
              </div>
              <div className="row-title">{qq.title}</div>
              <div className="row-comment">{qq.body}</div>
              <TagList names={qq.tags} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
