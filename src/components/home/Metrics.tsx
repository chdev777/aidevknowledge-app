import { useQuery } from '@tanstack/react-query';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase/client.js';

async function countShared(col: string): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db, col), where('visibility', '==', 'shared')),
  );
  return snap.data().count;
}

export function Metrics() {
  const q = useQuery({
    queryKey: ['home', 'metrics'],
    queryFn: async () => ({
      links: await countShared('links'),
      questions: await countShared('questions'),
      notes: await countShared('notes'),
      apps: await countShared('apps'),
    }),
    staleTime: 5 * 60_000,
  });

  return (
    <section className="metrics-grid">
      <Cell label="共有URL" value={q.data?.links} />
      <Cell label="質問" value={q.data?.questions} />
      <Cell label="検証メモ" value={q.data?.notes} />
      <Cell label="作成アプリ" value={q.data?.apps} />
    </section>
  );
}

function Cell({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="metric-cell">
      <div className="metric-label mono">{label}</div>
      <div className="metric-value">{value ?? '–'}</div>
    </div>
  );
}
