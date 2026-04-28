import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminLogsDb, usersDb } from '../../../lib/db/index.js';
import { useAuth } from '../../../lib/firebase/auth-context.js';
import { Avatar } from '../../../components/shell/Avatar.js';
import { FilterBar } from '../../../components/shared/FilterBar.js';
import { Spinner } from '../../../components/shared/Spinner.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { USER_ROLES, type User, type UserRole } from '../../../types/user.js';
import { logger } from '../../../lib/utils/log.js';

type RoleFilter = 'all' | UserRole;

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'DX推進', label: 'DX推進' },
  { key: '情報支援', label: '情報支援' },
  { key: '管理者', label: '管理者' },
];

export function UsersTab() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const usersQ = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => usersDb.findAll(),
    staleTime: 60_000,
  });

  const setRole = useMutation({
    mutationFn: async (args: { user: User; nextRole: UserRole }) => {
      const { user, nextRole } = args;
      // 「最後の管理者」防衛: 管理者→非管理者の遷移時にチェック
      if (user.role === '管理者' && nextRole !== '管理者') {
        const adminCount = await usersDb.countByRole('管理者');
        if (adminCount <= 1) {
          throw new Error('LAST_ADMIN');
        }
      }
      await usersDb.setRole(user.id, nextRole);
      if (profile) {
        await adminLogsDb.record(
          { uid: profile.id, handle: profile.handle },
          {
            action: 'set_role',
            targetType: 'user',
            targetId: user.id,
            targetSnapshot: { previousRole: user.role, nextRole, handle: user.handle },
          },
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'logs'] });
    },
    onError: (err) => {
      if ((err as Error).message === 'LAST_ADMIN') {
        alert('最後の管理者は降格できません。先に他のユーザーを管理者に昇格させてください。');
      } else {
        logger.error('failed to set role', { err: String(err) });
        alert('ロール変更に失敗しました。');
      }
    },
  });

  const filtered = useMemo(() => {
    const all = usersQ.data ?? [];
    const s = search.trim().toLowerCase();
    return all.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!s) return true;
      return (
        u.name.toLowerCase().includes(s) ||
        u.handle.toLowerCase().includes(s)
      );
    });
  }, [usersQ.data, search, roleFilter]);

  if (usersQ.isPending) return <Spinner />;

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-search"
          placeholder="名前・ハンドルで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterBar
          filters={ROLE_FILTERS}
          value={roleFilter}
          onChange={setRoleFilter}
          groupLabel="ロール"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="該当するユーザーはいません" />
      ) : (
        <div className="admin-rows">
          {filtered.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isSelf={u.id === profile?.id}
              onChangeRole={(nextRole) => setRole.mutate({ user: u, nextRole })}
              pending={setRole.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onChangeRole,
  pending,
}: {
  user: User;
  isSelf: boolean;
  onChangeRole: (next: UserRole) => void;
  pending: boolean;
}) {
  return (
    <div className="admin-row">
      <Avatar user={user} size="md" />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="admin-row-title">
          {user.name}
          {isSelf && <span className="admin-row-self">あなた</span>}
        </div>
        <div className="admin-row-meta">@{user.handle}</div>
      </div>
      <select
        className="admin-role-select"
        value={user.role}
        disabled={isSelf || pending}
        onChange={(e) => onChangeRole(e.target.value as UserRole)}
      >
        {USER_ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
