import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { linksDb } from '../../lib/db/index.js';
import { ImportanceBadge, SourceTypeBadge, StatusBadge } from '../../components/shared/StatusBadge.js';
import { TagList } from '../../components/shared/Tag.js';
import { VisibilityBadge } from '../../components/shared/VisibilityBadge.js';
import { CommentList } from '../../components/comments/CommentList.js';
import { CommentComposer } from '../../components/comments/CommentComposer.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { ForbiddenPage } from '../ForbiddenPage.js';
import { isSafeHref } from '../../lib/utils/url.js';

export function LinkDetailPage() {
  const { id = '' } = useParams();
  const q = useQuery({
    queryKey: ['link', id],
    queryFn: () => linksDb.findById(id),
    enabled: !!id,
  });

  if (q.isPending) {
    return (
      <div className="page">
        <div className="section-loading"><Spinner /></div>
      </div>
    );
  }

  if (q.error || !q.data) {
    return <ForbiddenPage />;
  }

  const l = q.data;

  return (
    <div className="page">
      <header className="page-head">
        <div className="row-meta">
          <SourceTypeBadge value={l.sourceType} />
          <span className="mono">{l.domain}</span>
          <ImportanceBadge value={l.importance} />
          <StatusBadge value={l.status} />
          <VisibilityBadge value={l.visibility} />
        </div>
        <h1 className="page-title">{l.title}</h1>
        {isSafeHref(l.url) && (
          <a className="page-link mono" href={l.url} target="_blank" rel="noopener noreferrer">
            {l.url} →
          </a>
        )}
      </header>

      {l.thumbnailUrl && (
        <div className="link-thumb">
          <img src={l.thumbnailUrl} alt="" loading="lazy" />
        </div>
      )}

      <section className="page-section">
        <h2 className="section-title">共有コメント</h2>
        <p className="prose">{l.userComment}</p>
      </section>

      {l.summary && (
        <section className="page-section">
          <h2 className="section-title">概要</h2>
          <p className="prose">{l.summary}</p>
        </section>
      )}

      <section className="page-section">
        <TagList names={l.tags} />
      </section>

      <section className="page-section">
        <h2 className="section-title">コメント</h2>
        <CommentComposer
          targetType="link"
          targetId={l.id}
          targetVisibility={l.visibility}
        />
        <CommentList targetType="link" targetId={l.id} />
      </section>

      <div className="page-foot">
        <Link to="/links" className="btn">← 一覧に戻る</Link>
      </div>
    </div>
  );
}
