import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notesDb } from '../../lib/db/index.js';
import { useUser } from '../../lib/firebase/use-user.js';
import { Avatar } from '../../components/shell/Avatar.js';
import { Markdown } from '../../components/shared/Markdown.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { CommentList } from '../../components/comments/CommentList.js';
import { CommentComposer } from '../../components/comments/CommentComposer.js';
import { ForbiddenPage } from '../ForbiddenPage.js';
import { timeAgo } from '../../lib/utils/time.js';

export function NoteDetailPage() {
  const { id = '' } = useParams();
  const q = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesDb.findById(id),
    enabled: !!id,
  });
  const author = useUser(q.data?.createdBy);

  if (q.isPending) {
    return (
      <div className="page">
        <Spinner />
      </div>
    );
  }
  if (q.error || !q.data) return <ForbiddenPage />;

  const n = q.data;

  return (
    <div className="page">
      <RouterLink to="/notes" className="btn ghost sm" style={{ marginBottom: 16 }}>
        ← 検証メモに戻る
      </RouterLink>

      <div className="detail-layout">
        <div>
          <div className="detail-eyebrow">VERIFICATION NOTE · #{id.toUpperCase()}</div>
          <h1 className="detail-title">{n.title}</h1>
          <div className="detail-meta">
            {author.data && <Avatar user={author.data} size="sm" />}
            {author.data && <span>{author.data.name}</span>}
            <span className="dot-sep">·</span>
            <span>{timeAgo(n.createdAt)}</span>
          </div>

          <div className="note-fields">
            <div className="note-field">
              <div className="note-field-label">目的</div>
              <div className="note-field-value">
                <Markdown>{n.purpose || '（未記入）'}</Markdown>
              </div>
            </div>
            <div className="note-field">
              <div className="note-field-label">試したこと</div>
              <div className="note-field-value">
                <Markdown>{n.tried || '（未記入）'}</Markdown>
              </div>
            </div>
            <div className="note-field">
              <div className="note-field-label">結果</div>
              <div className="note-field-value">
                <Markdown>{n.result || '（未記入）'}</Markdown>
              </div>
            </div>
            <div className="note-field">
              <div className="note-field-label">結論</div>
              <div className="note-field-value" style={{ color: 'var(--ink)' }}>
                <Markdown>{n.conclusion || '（未記入）'}</Markdown>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <div className="section-title">コメント</div>
            <CommentComposer
              targetType="note"
              targetId={n.id}
              targetVisibility={n.visibility}
            />
            <CommentList targetType="note" targetId={n.id} />
          </div>
        </div>

        <aside className="detail-aside">
          <div className="aside-section">
            <div className="aside-label">作成者</div>
            <div className="aside-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {author.data && <Avatar user={author.data} size="sm" />}
              {author.data?.name ?? '—'}
            </div>
          </div>
          <div className="aside-section">
            <div className="aside-label">タグ</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {n.tags.map((t) => (
                <span key={t} className="tag"><span className="tag-dot" />{t}</span>
              ))}
            </div>
          </div>
          <div className="aside-section">
            <div className="aside-label">関連URL</div>
            <div className="aside-value mono">{n.links?.length ?? 0}</div>
          </div>
          <div className="aside-section">
            <div className="aside-label">作成日時</div>
            <div className="aside-value mono" style={{ fontSize: 12 }}>
              {n.createdAt.toLocaleString('ja-JP')}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
