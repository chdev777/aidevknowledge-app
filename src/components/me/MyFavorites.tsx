import { useQuery } from '@tanstack/react-query';
import {
  appsDb,
  favoritesDb,
  linksDb,
  notesDb,
  questionsDb,
} from '../../lib/db/index.js';
import { Spinner } from '../shared/Spinner.js';
import { EmptyState } from '../shared/EmptyState.js';
import { LinkRow } from '../rows/LinkRow.js';
import { QARow } from '../rows/QARow.js';
import { NoteRow } from '../rows/NoteRow.js';
import { AppRow } from '../rows/AppRow.js';
import type { Favorite } from '../../lib/db/favorites.js';

type ResolvedFavorite =
  | { kind: 'link'; fav: Favorite; item: import('../../types/link.js').Link }
  | { kind: 'question'; fav: Favorite; item: import('../../types/question.js').Question }
  | { kind: 'note'; fav: Favorite; item: import('../../types/note.js').Note }
  | { kind: 'app'; fav: Favorite; item: import('../../types/app.js').AiApp };

export function MyFavorites({ uid }: { uid: string }) {
  const favsQ = useQuery({
    queryKey: ['favorites', uid],
    queryFn: () => favoritesDb.listByOwner(uid),
    enabled: !!uid,
  });

  const hasFavorites = (favsQ.data?.length ?? 0) > 0;

  const itemsQ = useQuery({
    queryKey: ['favorites', uid, 'items', favsQ.data?.map((f) => f.id).join(',')],
    queryFn: async () => {
      const favs = favsQ.data ?? [];
      const result = await Promise.all(
        favs.map(async (f): Promise<ResolvedFavorite | null> => {
          if (f.targetType === 'link') {
            const x = await linksDb.findById(f.targetId);
            return x ? { kind: 'link', fav: f, item: x } : null;
          }
          if (f.targetType === 'question') {
            const x = await questionsDb.findById(f.targetId);
            return x ? { kind: 'question', fav: f, item: x } : null;
          }
          if (f.targetType === 'note') {
            const x = await notesDb.findById(f.targetId);
            return x ? { kind: 'note', fav: f, item: x } : null;
          }
          if (f.targetType === 'app') {
            const x = await appsDb.findById(f.targetId);
            return x ? { kind: 'app', fav: f, item: x } : null;
          }
          return null;
        }),
      );
      return result.filter((x): x is ResolvedFavorite => !!x);
    },
    enabled: hasFavorites,
  });

  // TanStack Query v5: enabled:false で isPending:true のままなので isFetching を見る
  const loading = favsQ.isFetching || (hasFavorites && itemsQ.isFetching);

  if (loading) return <Spinner />;
  if (!hasFavorites) {
    return (
      <EmptyState
        title="お気に入りはまだありません"
        description="各詳細ページのサイドバーから「☆ お気に入り」を押して追加できます。"
      />
    );
  }

  const items = itemsQ.data ?? [];
  if (items.length === 0) {
    return <EmptyState title="該当する対象が見つかりませんでした" description="削除されている可能性があります。" />;
  }

  return (
    <div style={{ borderTop: '1px solid var(--line)' }}>
      {items.map((it) => {
        if (it.kind === 'link') return <LinkRow key={`l-${it.item.id}`} link={it.item} />;
        if (it.kind === 'question') return <QARow key={`q-${it.item.id}`} q={it.item} />;
        if (it.kind === 'note') return <NoteRow key={`n-${it.item.id}`} note={it.item} />;
        return <AppRow key={`a-${it.item.id}`} app={it.item} />;
      })}
    </div>
  );
}
