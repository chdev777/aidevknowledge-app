import { useQuery } from '@tanstack/react-query';
import { Timestamp, collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase/client.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function countShared(col: string): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db, col), where('visibility', '==', 'shared')),
  );
  return snap.data().count;
}

async function countSharedThisWeek(col: string): Promise<number> {
  const since = Timestamp.fromDate(new Date(Date.now() - WEEK_MS));
  const snap = await getCountFromServer(
    query(
      collection(db, col),
      where('visibility', '==', 'shared'),
      where('createdAt', '>=', since),
    ),
  );
  return snap.data().count;
}

async function countUnanswered(): Promise<number> {
  const snap = await getCountFromServer(
    query(
      collection(db, 'questions'),
      where('visibility', '==', 'shared'),
      where('answerCount', '==', 0),
    ),
  );
  return snap.data().count;
}

async function countAppsByStatus(status: string): Promise<number> {
  const snap = await getCountFromServer(
    query(
      collection(db, 'apps'),
      where('visibility', '==', 'shared'),
      where('status', '==', status),
    ),
  );
  return snap.data().count;
}

export function Metrics() {
  const q = useQuery({
    queryKey: ['home', 'metrics'],
    queryFn: async () => ({
      links: await countShared('links'),
      linksThisWeek: await countSharedThisWeek('links'),
      unanswered: await countUnanswered(),
      notes: await countShared('notes'),
      notesThisWeek: await countSharedThisWeek('notes'),
      apps: await countShared('apps'),
      appsVerifying: await countAppsByStatus('検証中'),
    }),
    staleTime: 5 * 60_000,
  });

  const v = (n: number | undefined) => (n ?? '–');

  return (
    <div className="metric-grid">
      <div className="metric">
        <div className="metric-label">共有URL</div>
        <div className="metric-value">{v(q.data?.links)}</div>
        {q.data && q.data.linksThisWeek > 0 && (
          <div className="metric-delta up">+{q.data.linksThisWeek} 今週</div>
        )}
      </div>
      <div className="metric">
        <div className="metric-label">未回答</div>
        <div className="metric-value">{v(q.data?.unanswered)}</div>
        {q.data && q.data.unanswered > 0 && <div className="metric-delta">要対応</div>}
      </div>
      <div className="metric">
        <div className="metric-label">検証メモ</div>
        <div className="metric-value">{v(q.data?.notes)}</div>
        {q.data && q.data.notesThisWeek > 0 && (
          <div className="metric-delta up">+{q.data.notesThisWeek} 今週</div>
        )}
      </div>
      <div className="metric">
        <div className="metric-label">作成アプリ</div>
        <div className="metric-value">{v(q.data?.apps)}</div>
        {q.data && q.data.appsVerifying > 0 && (
          <div className="metric-delta">{q.data.appsVerifying} 検証中</div>
        )}
      </div>
    </div>
  );
}
