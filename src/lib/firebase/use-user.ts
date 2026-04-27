import { useQuery } from '@tanstack/react-query';
import { usersDb } from '../db/index.js';

export function useUser(uid: string | null | undefined) {
  return useQuery({
    queryKey: ['user', uid],
    queryFn: () => (uid ? usersDb.findById(uid) : Promise.resolve(null)),
    enabled: !!uid,
    staleTime: 5 * 60_000,
  });
}
