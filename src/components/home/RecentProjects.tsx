import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../lib/firebase/client.js';
import type { Project } from '../../types/project.js';

async function findProjects(count: number): Promise<Project[]> {
  const snap = await getDocs(query(collection(db, 'projects'), limit(count)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Project, 'id'>) }));
}

export function RecentProjects() {
  const q = useQuery({
    queryKey: ['home', 'projects'],
    queryFn: () => findProjects(4),
    staleTime: 5 * 60_000,
  });
  const items = q.data ?? [];

  if (items.length === 0) return null;

  return (
    <>
      <div className="section-title" style={{ marginTop: 32 }}>プロジェクト</div>
      <div style={{ borderTop: '1px solid var(--line-2)' }}>
        {items.map((p) => (
          <div
            key={p.id}
            className="row"
            style={{ gridTemplateColumns: '10px 1fr auto', padding: '10px 4px' }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                {p.description}
              </div>
            </div>
            <span className="badge" data-status={p.status}>
              <span className="badge-dot" />
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
