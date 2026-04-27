import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notesDb } from '../../lib/db/index.js';
import { TagList } from '../../components/shared/Tag.js';
import { VisibilityBadge } from '../../components/shared/VisibilityBadge.js';
import { Markdown } from '../../components/shared/Markdown.js';
import { CommentList } from '../../components/comments/CommentList.js';
import { CommentComposer } from '../../components/comments/CommentComposer.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { ForbiddenPage } from '../ForbiddenPage.js';

export function NoteDetailPage() {
  const { id = '' } = useParams();
  const q = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesDb.findById(id),
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

  const n = q.data;

  return (
    <div className="page">
      <header className="page-head">
        <div className="row-meta">
          <VisibilityBadge value={n.visibility} />
        </div>
        <h1 className="page-title">{n.title}</h1>
      </header>

      <section className="page-section note-section">
        <div className="note-block">
          <h3 className="note-label mono">目的</h3>
          <div className="prose"><Markdown>{n.purpose || '（未記入）'}</Markdown></div>
        </div>
        <div className="note-block">
          <h3 className="note-label mono">試したこと</h3>
          <div className="prose"><Markdown>{n.tried || '（未記入）'}</Markdown></div>
        </div>
        <div className="note-block">
          <h3 className="note-label mono">結果</h3>
          <div className="prose"><Markdown>{n.result || '（未記入）'}</Markdown></div>
        </div>
        <div className="note-block">
          <h3 className="note-label mono">結論</h3>
          <div className="prose"><Markdown>{n.conclusion || '（未記入）'}</Markdown></div>
        </div>
      </section>

      <section className="page-section">
        <TagList names={n.tags} />
      </section>

      <section className="page-section">
        <h2 className="section-title">コメント</h2>
        <CommentComposer
          targetType="note"
          targetId={n.id}
          targetVisibility={n.visibility}
        />
        <CommentList targetType="note" targetId={n.id} />
      </section>

      <div className="page-foot">
        <Link to="/notes" className="btn">← 一覧に戻る</Link>
      </div>
    </div>
  );
}
