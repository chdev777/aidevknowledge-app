import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appsDb } from '../../lib/db/index.js';
import { StatusBadge } from '../../components/shared/StatusBadge.js';
import { TagList } from '../../components/shared/Tag.js';
import { VisibilityBadge } from '../../components/shared/VisibilityBadge.js';
import { Markdown } from '../../components/shared/Markdown.js';
import { CommentList } from '../../components/comments/CommentList.js';
import { CommentComposer } from '../../components/comments/CommentComposer.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { ForbiddenPage } from '../ForbiddenPage.js';
import { isSafeHref } from '../../lib/utils/url.js';

export function AppDetailPage() {
  const { id = '' } = useParams();
  const q = useQuery({
    queryKey: ['app', id],
    queryFn: () => appsDb.findById(id),
    enabled: !!id,
  });

  if (q.isPending) {
    return (
      <div className="page">
        <div className="section-loading"><Spinner /></div>
      </div>
    );
  }
  if (q.error || !q.data) return <ForbiddenPage />;
  const a = q.data;

  return (
    <div className="page">
      <header className="page-head">
        <div className="row-meta">
          <StatusBadge value={a.status} />
          <span className="mono">{a.usageScope}</span>
          <VisibilityBadge value={a.visibility} />
        </div>
        <h1 className="page-title">{a.name}</h1>
        {isSafeHref(a.url) && (
          <a className="page-link mono" href={a.url} target="_blank" rel="noopener noreferrer">
            {a.url} →
          </a>
        )}
      </header>

      <section className="page-section">
        <div className="prose"><Markdown>{a.summary}</Markdown></div>
      </section>

      <section className="app-spec-grid">
        <SpecCell label="開発目的" value={a.purpose || '（未記入）'} />
        <SpecCell label="利用AI" value={a.aiModel || '（未記入）'} />
        <SpecCell
          label="使用技術"
          value={a.technologies.length > 0 ? a.technologies.join(' / ') : '（未記入）'}
        />
        <SpecCell label="利用範囲" value={a.usageScope} />
      </section>

      {a.caution && (
        <section className="page-section app-caution">
          <h3 className="section-title">注意事項</h3>
          <div className="prose"><Markdown>{a.caution}</Markdown></div>
        </section>
      )}

      <section className="page-section">
        <TagList names={a.tags} />
      </section>

      <section className="page-section">
        <h2 className="section-title">レビュー / コメント</h2>
        <CommentComposer
          targetType="app"
          targetId={a.id}
          targetVisibility={a.visibility}
        />
        <CommentList targetType="app" targetId={a.id} />
      </section>

      <div className="page-foot">
        <Link to="/apps" className="btn">← 一覧に戻る</Link>
      </div>
    </div>
  );
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="spec-cell">
      <div className="mono spec-label">{label}</div>
      <div className="spec-value">{value}</div>
    </div>
  );
}
