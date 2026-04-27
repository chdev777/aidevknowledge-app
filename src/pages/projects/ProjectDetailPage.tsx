import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appsDb, linksDb, notesDb, projectsDb, questionsDb } from '../../lib/db/index.js';
import { LinkRow } from '../../components/rows/LinkRow.js';
import { QARow } from '../../components/rows/QARow.js';
import { NoteRow } from '../../components/rows/NoteRow.js';
import { AppRow } from '../../components/rows/AppRow.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { ForbiddenPage } from '../ForbiddenPage.js';

export function ProjectDetailPage() {
  const { id = '' } = useParams();

  const projectQ = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsDb.findById(id),
    enabled: !!id,
  });
  const linksQ = useQuery({
    queryKey: ['project', id, 'links'],
    queryFn: () => linksDb.findShared({ count: 200 }),
    enabled: !!id,
  });
  const questionsQ = useQuery({
    queryKey: ['project', id, 'questions'],
    queryFn: () => questionsDb.findShared({ count: 200 }),
    enabled: !!id,
  });
  const notesQ = useQuery({
    queryKey: ['project', id, 'notes'],
    queryFn: () => notesDb.findShared({ count: 200 }),
    enabled: !!id,
  });
  const appsQ = useQuery({
    queryKey: ['project', id, 'apps'],
    queryFn: () => appsDb.findShared({ count: 200 }),
    enabled: !!id,
  });

  if (projectQ.isPending) {
    return (
      <div className="page">
        <Spinner />
      </div>
    );
  }
  if (projectQ.error || !projectQ.data) return <ForbiddenPage />;
  const p = projectQ.data;

  const projectLinks = (linksQ.data ?? []).filter((x) => x.projectId === id);
  const projectQs = (questionsQ.data ?? []).filter((x) => x.projectId === id);
  const projectNotes = (notesQ.data ?? []).filter((x) => x.projectId === id);
  const projectApps = (appsQ.data ?? []).filter((x) => x.projectId === id);

  return (
    <div className="page">
      <RouterLink to="/projects" className="btn ghost sm" style={{ marginBottom: 16 }}>
        ← プロジェクト一覧
      </RouterLink>

      <div className="page-header">
        <div>
          <div className="page-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: p.color, borderRadius: 2 }} />
            PROJECT
          </div>
          <h1 className="page-title">{p.name}</h1>
          <div className="page-sub">{p.description}</div>
        </div>
        <div className="page-header-actions">
          <span className="badge" data-status={p.status}>
            <span className="badge-dot" />
            {p.status}
          </span>
        </div>
      </div>

      {projectApps.length > 0 && (
        <>
          <div className="section-title">
            このプロジェクトのアプリ <span className="section-count">({projectApps.length})</span>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginBottom: 30 }}>
            {projectApps.map((a) => <AppRow key={a.id} app={a} />)}
          </div>
        </>
      )}

      {projectLinks.length > 0 && (
        <>
          <div className="section-title">
            関連URL <span className="section-count">({projectLinks.length})</span>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginBottom: 30 }}>
            {projectLinks.map((l) => <LinkRow key={l.id} link={l} />)}
          </div>
        </>
      )}

      {projectNotes.length > 0 && (
        <>
          <div className="section-title">
            検証メモ <span className="section-count">({projectNotes.length})</span>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginBottom: 30 }}>
            {projectNotes.map((n) => <NoteRow key={n.id} note={n} />)}
          </div>
        </>
      )}

      {projectQs.length > 0 && (
        <>
          <div className="section-title">
            関連する質問 <span className="section-count">({projectQs.length})</span>
          </div>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {projectQs.map((q) => <QARow key={q.id} q={q} />)}
          </div>
        </>
      )}

      {projectApps.length === 0 &&
        projectLinks.length === 0 &&
        projectNotes.length === 0 &&
        projectQs.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--ink-3)',
              border: '1px dashed var(--line)',
              borderRadius: 6,
              marginTop: 14,
            }}
          >
            このプロジェクトに紐づく投稿はまだありません。
          </div>
        )}
    </div>
  );
}
