import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminLogsDb, tagsDb } from '../../../lib/db/index.js';
import { useAuth } from '../../../lib/firebase/auth-context.js';
import { FilterBar } from '../../../components/shared/FilterBar.js';
import { Spinner } from '../../../components/shared/Spinner.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog.js';
import { Icon } from '../../../components/shared/Icon.js';
import { tagInputSchema } from '../../../lib/schemas/tag.js';
import type { Tag, TagType } from '../../../types/tag.js';
import { TAG_TYPES } from '../../../types/tag.js';
import { logger } from '../../../lib/utils/log.js';

type TypeFilter = 'all' | TagType;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  ...TAG_TYPES.map((t) => ({ key: t as TypeFilter, label: t })),
];

interface TagFormValue {
  name: string;
  type: TagType;
}

export function TagsTab() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);

  const tagsQ = useQuery({
    queryKey: ['admin', 'tags'],
    queryFn: () => tagsDb.findAll(),
    staleTime: 60_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'tags'] });
    qc.invalidateQueries({ queryKey: ['tags'] });
    qc.invalidateQueries({ queryKey: ['admin', 'logs'] });
  };

  const createMut = useMutation({
    mutationFn: async (input: TagFormValue) => {
      const validated = tagInputSchema.parse(input);
      const id = await tagsDb.create(validated as { name: string; type: TagType });
      if (profile) {
        await adminLogsDb.record(
          { uid: profile.id, handle: profile.handle },
          {
            action: 'create_tag',
            targetType: 'tag',
            targetId: id,
            targetSnapshot: { name: validated.name, type: validated.type },
          },
        );
      }
    },
    onSuccess: () => {
      setCreating(false);
      invalidate();
    },
    onError: (err) => {
      logger.error('failed to create tag', { err: String(err) });
      alert('タグ作成に失敗しました。');
    },
  });

  const updateMut = useMutation({
    mutationFn: async (args: { tag: Tag; input: TagFormValue }) => {
      const validated = tagInputSchema.parse(args.input);
      await tagsDb.update(args.tag.id, validated as { name: string; type: TagType });
      if (profile) {
        await adminLogsDb.record(
          { uid: profile.id, handle: profile.handle },
          {
            action: 'update_tag',
            targetType: 'tag',
            targetId: args.tag.id,
            targetSnapshot: {
              previous: { name: args.tag.name, type: args.tag.type },
              next: { name: validated.name, type: validated.type },
            },
          },
        );
      }
    },
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: (err) => {
      logger.error('failed to update tag', { err: String(err) });
      alert('タグ更新に失敗しました。');
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (tag: Tag) => {
      await tagsDb.remove(tag.id);
      if (profile) {
        await adminLogsDb.record(
          { uid: profile.id, handle: profile.handle },
          {
            action: 'delete_tag',
            targetType: 'tag',
            targetId: tag.id,
            targetSnapshot: { name: tag.name, type: tag.type },
          },
        );
      }
    },
    onSuccess: () => {
      setPendingDelete(null);
      invalidate();
    },
    onError: (err) => {
      logger.error('failed to delete tag', { err: String(err) });
      alert('タグ削除に失敗しました。');
    },
  });

  const filtered = useMemo(() => {
    const all = tagsQ.data ?? [];
    if (typeFilter === 'all') return all;
    return all.filter((t) => t.type === typeFilter);
  }, [tagsQ.data, typeFilter]);

  if (tagsQ.isPending) return <Spinner />;

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <FilterBar
          filters={TYPE_FILTERS}
          value={typeFilter}
          onChange={setTypeFilter}
          groupLabel="種別"
        />
        <button
          type="button"
          className={creating ? 'btn sm' : 'btn sm btn-primary'}
          onClick={() => setCreating((v) => !v)}
          aria-label={creating ? 'タグ追加をキャンセル' : 'タグを追加'}
        >
          <Icon name="plus" size={12} />
          {creating ? 'キャンセル' : 'タグを追加'}
        </button>
      </div>

      {creating && (
        <TagForm
          initial={{ name: '', type: '技術' }}
          onCancel={() => setCreating(false)}
          onSubmit={(v) => createMut.mutate(v)}
          submitting={createMut.isPending}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState title="該当するタグはありません" />
      ) : (
        <div className="admin-rows">
          {filtered.map((t) =>
            editingId === t.id ? (
              <TagForm
                key={t.id}
                initial={{ name: t.name, type: t.type }}
                onCancel={() => setEditingId(null)}
                onSubmit={(v) => updateMut.mutate({ tag: t, input: v })}
                submitting={updateMut.isPending}
              />
            ) : (
              <div className="admin-row" key={t.id}>
                <span className="tag" style={{ flexShrink: 0 }}>
                  <span className="tag-dot" />
                  {t.name}
                </span>
                <span className="admin-row-meta" style={{ flex: 1 }}>{t.type}</span>
                <button
                  type="button"
                  className="btn xs"
                  onClick={() => setEditingId(t.id)}
                >
                  編集
                </button>
                <button
                  type="button"
                  className="btn xs btn-destructive"
                  onClick={() => setPendingDelete(t)}
                >
                  削除
                </button>
              </div>
            ),
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`タグ「${pendingDelete?.name ?? ''}」を削除しますか？`}
        description="既存の投稿に付いているタグ文字列はそのまま残ります。マスタからのみ削除されます。"
        destructive
        confirmLabel="削除する"
        onConfirm={() => pendingDelete && deleteMut.mutate(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function TagForm({
  initial,
  onCancel,
  onSubmit,
  submitting,
}: {
  initial: TagFormValue;
  onCancel: () => void;
  onSubmit: (v: TagFormValue) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [type, setType] = useState<TagType>(initial.type);

  return (
    <form
      className="admin-row admin-row-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), type });
      }}
    >
      <input
        type="text"
        className="admin-input"
        placeholder="タグ名（最大32文字）"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={32}
        required
        autoFocus
      />
      <select
        className="admin-role-select"
        value={type}
        onChange={(e) => setType(e.target.value as TagType)}
      >
        {TAG_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button type="submit" className="btn xs btn-primary" disabled={submitting}>
        保存
      </button>
      <button type="button" className="btn xs" onClick={onCancel}>
        キャンセル
      </button>
    </form>
  );
}
