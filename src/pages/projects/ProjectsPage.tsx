import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appsDb, linksDb, notesDb, projectsDb, questionsDb } from '../../lib/db/index.js';
import { useUser } from '../../lib/firebase/use-user.js';
import { PageHeader } from '../../components/shared/PageHeader.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import type { Project } from '../../types/project.js';

interface Counts {
  links: number;
  questions: number;
  notes: number;
  apps: number;
}

async function loadProjectCounts(): Promise<Map<string, Counts>> {
  const [links, questions, notes, apps] = await Promise.all([
    linksDb.findShared({ count: 500 }),
    questionsDb.findShared({ count: 500 }),
    notesDb.findShared({ count: 500 }),
    appsDb.findShared({ count: 500 }),
  ]);
  const map = new Map<string, Counts>();
  const tally = (id: string | undefined, key: keyof Counts) => {
    if (!id) return;
    const c = map.get(id) ?? { links: 0, questions: 0, notes: 0, apps: 0 };
    c[key] += 1;
    map.set(id, c);
  };
  links.forEach((x) => tally(x.projectId, 'links'));
  questions.forEach((x) => tally(x.projectId, 'questions'));
  notes.forEach((x) => tally(x.projectId, 'notes'));
  apps.forEach((x) => tally(x.projectId, 'apps'));
  return map;
}

export function ProjectsPage() {
  const projectsQ = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsDb.findAll(),
    staleTime: 5 * 60_000,
  });
  const countsQ = useQuery({
    queryKey: ['projects', 'counts'],
    queryFn: loadProjectCounts,
    staleTime: 5 * 60_000,
  });

  const items = projectsQ.data ?? [];

  return (
    <div className="page">
      <PageHeader
        eyebrow="05 · PROJECTS"
        title="プロジェクト"
        subtitle="URL・質問・検証メモ・作成アプリをプロジェクト単位でまとめて把握する。"
      />

      {projectsQ.isPending && <Spinner />}
      {projectsQ.data && items.length === 0 && (
        <EmptyState title="プロジェクトはまだありません" />
      )}
      {items.length > 0 && (
        <div className="project-grid">
          {items.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              counts={countsQ.data?.get(p.id) ?? { links: p.links ?? 0, questions: p.questions ?? 0, notes: p.notes ?? 0, apps: p.apps ?? 0 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, counts }: { project: Project; counts: Counts }) {
  const nav = useNavigate();
  const owner = useUser(project.owner);

  return (
    <div className="project-card" onClick={() => nav(`/projects/${project.id}`)}>
      <div className="project-card-head">
        <div className="project-swatch" style={{ background: project.color }} />
        <div className="project-name">{project.name}</div>
      </div>
      <div className="project-desc">{project.description}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span className="badge" data-status={project.status}>
          <span className="badge-dot" />
          {project.status}
        </span>
        {owner.data && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
            オーナー: {owner.data.name}
          </span>
        )}
      </div>
      <div className="project-stats">
        <div className="project-stat"><div className="p-num">{counts.links}</div><div className="p-lbl">URL</div></div>
        <div className="project-stat"><div className="p-num">{counts.questions}</div><div className="p-lbl">質問</div></div>
        <div className="project-stat"><div className="p-num">{counts.notes}</div><div className="p-lbl">メモ</div></div>
        <div className="project-stat"><div className="p-num">{counts.apps}</div><div className="p-lbl">アプリ</div></div>
      </div>
    </div>
  );
}
