import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesDb } from '../../lib/db/index.js';
import { useAuth } from '../../lib/firebase/auth-context.js';
import type { CommentTargetType } from '../../types/comment.js';

interface Props {
  targetType: CommentTargetType;
  targetId: string;
  fullWidth?: boolean;
}

export function FavoriteButton({ targetType, targetId, fullWidth = false }: Props) {
  const { fbUser } = useAuth();
  const uid = fbUser?.uid;
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['favorite', uid, targetType, targetId],
    queryFn: () => (uid ? favoritesDb.isFavorite(uid, targetType, targetId) : Promise.resolve(false)),
    enabled: !!uid,
  });

  const m = useMutation({
    mutationFn: async () => {
      if (!uid) throw new Error('not signed in');
      if (q.data) await favoritesDb.remove(uid, targetType, targetId);
      else await favoritesDb.add(uid, targetType, targetId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorite', uid, targetType, targetId] });
      qc.invalidateQueries({ queryKey: ['favorites', uid] });
    },
  });

  if (!uid) return null;

  const isFav = q.data ?? false;
  return (
    <button
      type="button"
      className={`btn sm ${isFav ? '' : ''}`}
      onClick={() => m.mutate()}
      disabled={m.isPending}
      style={fullWidth ? { width: '100%', justifyContent: 'center' } : undefined}
      aria-pressed={isFav}
    >
      {isFav ? '★ お気に入り済' : '☆ お気に入り'}
    </button>
  );
}
