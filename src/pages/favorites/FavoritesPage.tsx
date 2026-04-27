import { useQuery } from '@tanstack/react-query';
import {
  appsDb,
  favoritesDb,
  linksDb,
  notesDb,
  questionsDb,
} from '../../lib/db/index.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { PageHeader } from '../../components/shared/PageHeader.js';
import { Spinner } from '../../components/shared/Spinner.js';
import { EmptyState } from '../../components/shared/EmptyState.js';
import { LinkRow } from '../../components/rows/LinkRow.js';
import { QARow } from '../../components/rows/QARow.js';
import { NoteRow } from '../../components/rows/NoteRow.js';
import { AppRow } from '../../components/rows/AppRow.js';
import type { Favorite } from '../../lib/db/favorites.js';

export function FavoritesPage() {
  const { fbUser } = useAuth();
  const uid = fbUser?.uid;

  const favsQ = useQuery({
    queryKey: ['favorites', uid],
    queryFn: () => (uid ? favoritesDb.listByOwner(uid) : Promise.resolve([])),
    enabled: !!uid,
  });

  const itemsQ = useQuery({
    queryKey: ['favorites', uid, 'items'],
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
    enabled: !!favsQ.data && (favsQ.data?.length ?? 0) > 0,
  });

  const items = itemsQ.data ?? [];

  return (
    <div className="page">
      <PageHeader
        eyebrow="07 · FAVORITES"
        title="お気に入り"
        subtitle="あなたがピン留めしたURL・メモ・質問・アプリ。"
      />

      {(favsQ.isPending || itemsQ.isPending) && <Spinner />}

      {favsQ.data && favsQ.data.length === 0 && (
        <EmptyState
          title="お気に入りはまだありません"
          description="各詳細ページのサイドバーから「☆ お気に入り」を押して追加できます。"
        />
      )}

      {items.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 14 }}>
          {items.map((it) => {
            if (it.kind === 'link') return <LinkRow key={`l-${it.item.id}`} link={it.item} />;
            if (it.kind === 'question') return <QARow key={`q-${it.item.id}`} q={it.item} />;
            if (it.kind === 'note') return <NoteRow key={`n-${it.item.id}`} note={it.item} />;
            return <AppRow key={`a-${it.item.id}`} app={it.item} />;
          })}
        </div>
      )}
    </div>
  );
}

type ResolvedFavorite =
  | { kind: 'link'; fav: Favorite; item: import('../../types/link.js').Link }
  | { kind: 'question'; fav: Favorite; item: import('../../types/question.js').Question }
  | { kind: 'note'; fav: Favorite; item: import('../../types/note.js').Note }
  | { kind: 'app'; fav: Favorite; item: import('../../types/app.js').AiApp };
