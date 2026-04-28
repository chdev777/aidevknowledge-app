import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminLogsDb,
  appsDb,
  linksDb,
  notesDb,
  questionsDb,
} from '../../../lib/db/index.js';
import { useAuth } from '../../../lib/firebase/auth-context.js';
import { FilterBar } from '../../../components/shared/FilterBar.js';
import { Spinner } from '../../../components/shared/Spinner.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog.js';
import { LinkRow } from '../../../components/rows/LinkRow.js';
import { QARow } from '../../../components/rows/QARow.js';
import { NoteRow } from '../../../components/rows/NoteRow.js';
import { AppRow } from '../../../components/rows/AppRow.js';
import { timeAgo } from '../../../lib/utils/time.js';
import type { AdminLog, AdminLogAction } from '../../../types/admin-log.js';
import type { Link as LinkDoc } from '../../../types/link.js';
import type { Question } from '../../../types/question.js';
import type { Note } from '../../../types/note.js';
import type { AiApp } from '../../../types/app.js';
import { logger } from '../../../lib/utils/log.js';

type Kind = 'link' | 'qa' | 'note' | 'app';

const KIND_FILTERS: { key: Kind; label: string }[] = [
  { key: 'link', label: 'URL共有' },
  { key: 'qa', label: 'Q&A' },
  { key: 'note', label: '検証メモ' },
  { key: 'app', label: '作成アプリ' },
];

interface PendingDelete {
  kind: Kind;
  id: string;
  title: string;
  snapshot: Record<string, unknown>;
  reason: string;
}

const ACTION_OF: Record<Kind, AdminLogAction> = {
  link: 'delete_link',
  qa: 'delete_qa',
  note: 'delete_note',
  app: 'delete_app',
};

export function ModerationTab() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>('link');
  const [pending, setPending] = useState<PendingDelete | null>(null);

  const linksQ = useQuery({
    queryKey: ['admin', 'moderation', 'links'],
    queryFn: () => linksDb.findShared({ count: 100 }),
    enabled: kind === 'link',
    staleTime: 60_000,
  });
  const qaQ = useQuery({
    queryKey: ['admin', 'moderation', 'qa'],
    queryFn: () => questionsDb.findShared({ count: 100 }),
    enabled: kind === 'qa',
    staleTime: 60_000,
  });
  const notesQ = useQuery({
    queryKey: ['admin', 'moderation', 'notes'],
    queryFn: () => notesDb.findShared({ count: 100 }),
    enabled: kind === 'note',
    staleTime: 60_000,
  });
  const appsQ = useQuery({
    queryKey: ['admin', 'moderation', 'apps'],
    queryFn: () => appsDb.findShared({ count: 100 }),
    enabled: kind === 'app',
    staleTime: 60_000,
  });

  const logsQ = useQuery({
    queryKey: ['admin', 'logs'],
    queryFn: () => adminLogsDb.findRecent(10),
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: async (p: PendingDelete) => {
      switch (p.kind) {
        case 'link':
          await linksDb.remove(p.id);
          break;
        case 'qa':
          await questionsDb.remove(p.id);
          break;
        case 'note':
          await notesDb.remove(p.id);
          break;
        case 'app':
          await appsDb.remove(p.id);
          break;
      }
      if (profile) {
        await adminLogsDb.record(
          { uid: profile.id, handle: profile.handle },
          {
            action: ACTION_OF[p.kind],
            targetType: p.kind,
            targetId: p.id,
            targetSnapshot: p.snapshot,
            ...(p.reason ? { reason: p.reason } : {}),
          },
        );
      }
    },
    onSuccess: () => {
      setPending(null);
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      qc.invalidateQueries({ queryKey: ['admin', 'logs'] });
      qc.invalidateQueries({ queryKey: ['links', 'shared'] });
      qc.invalidateQueries({ queryKey: ['questions', 'shared'] });
      qc.invalidateQueries({ queryKey: ['notes', 'shared'] });
      qc.invalidateQueries({ queryKey: ['apps', 'shared'] });
      qc.invalidateQueries({ queryKey: ['sidebar', 'counts'] });
    },
    onError: (err) => {
      logger.error('failed to delete (moderation)', { err: String(err) });
      alert('削除に失敗しました。');
    },
  });

  const askDelete = (kind: Kind, id: string, title: string, snapshot: Record<string, unknown>) => {
    setPending({ kind, id, title, snapshot, reason: '' });
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <FilterBar filters={KIND_FILTERS} value={kind} onChange={setKind} groupLabel="種別" />
        <div className="admin-toolbar-note">
          ※ 共有中（shared）の投稿のみ表示。private 投稿は本人以外は閲覧不可のためモデレーション対象外です。
        </div>
      </div>

      {kind === 'link' && (
        <ModRowList
          q={linksQ}
          renderRow={(l: LinkDoc) => (
            <ModRow
              kind="link"
              id={l.id}
              title={l.title}
              author={l.createdBy}
              snapshot={{ title: l.title, url: l.url, createdBy: l.createdBy }}
              onDelete={askDelete}
            >
              <LinkRow link={l} />
            </ModRow>
          )}
        />
      )}
      {kind === 'qa' && (
        <ModRowList
          q={qaQ}
          renderRow={(q: Question) => (
            <ModRow
              kind="qa"
              id={q.id}
              title={q.title}
              author={q.createdBy}
              snapshot={{ title: q.title, body: q.body, createdBy: q.createdBy }}
              onDelete={askDelete}
            >
              <QARow q={q} />
            </ModRow>
          )}
        />
      )}
      {kind === 'note' && (
        <ModRowList
          q={notesQ}
          renderRow={(n: Note) => (
            <ModRow
              kind="note"
              id={n.id}
              title={n.title}
              author={n.createdBy}
              snapshot={{ title: n.title, purpose: n.purpose, createdBy: n.createdBy }}
              onDelete={askDelete}
            >
              <NoteRow note={n} />
            </ModRow>
          )}
        />
      )}
      {kind === 'app' && (
        <ModRowList
          q={appsQ}
          renderRow={(a: AiApp) => (
            <ModRow
              kind="app"
              id={a.id}
              title={a.name}
              author={a.createdBy}
              snapshot={{ name: a.name, url: a.url, createdBy: a.createdBy }}
              onDelete={askDelete}
            >
              <AppRow app={a} />
            </ModRow>
          )}
        />
      )}

      <div className="admin-logs">
        <div className="section-title">直近の管理操作</div>
        {logsQ.isPending ? (
          <Spinner />
        ) : (logsQ.data ?? []).length === 0 ? (
          <EmptyState title="まだ記録はありません" />
        ) : (
          <div className="admin-rows">
            {(logsQ.data ?? []).map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pending}
        title={`「${pending?.title ?? ''}」を削除しますか？`}
        description="削除は取り消せません。操作は admin_logs に記録されます。"
        destructive
        confirmLabel="削除する"
        onConfirm={() => pending && deleteMut.mutate(pending)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function ModRowList<T extends { id: string }>(props: {
  q: { isPending: boolean; data: T[] | undefined };
  renderRow: (item: T) => ReactNode;
}) {
  if (props.q.isPending) return <Spinner />;
  const items = props.q.data ?? [];
  if (items.length === 0) return <EmptyState title="共有中の投稿はありません" />;
  return <div className="admin-rows">{items.map((item) => <div key={item.id}>{props.renderRow(item)}</div>)}</div>;
}

function ModRow({
  kind,
  id,
  title,
  snapshot,
  onDelete,
  children,
}: {
  kind: Kind;
  id: string;
  title: string;
  author: string;
  snapshot: Record<string, unknown>;
  onDelete: (kind: Kind, id: string, title: string, snapshot: Record<string, unknown>) => void;
  children: ReactNode;
}) {
  return (
    <div className="admin-mod-row">
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <button
        type="button"
        className="btn xs btn-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(kind, id, title, snapshot);
        }}
        style={{ alignSelf: 'flex-start', flexShrink: 0 }}
      >
        管理者削除
      </button>
    </div>
  );
}

const ACTION_LABEL: Record<AdminLogAction, string> = {
  set_role: 'ロール変更',
  delete_link: 'URL削除',
  delete_qa: 'Q&A削除',
  delete_note: '検証メモ削除',
  delete_app: 'アプリ削除',
  create_tag: 'タグ作成',
  update_tag: 'タグ更新',
  delete_tag: 'タグ削除',
  set_feedback_status: 'フィードバック状態変更',
};

function LogRow({ log }: { log: AdminLog }) {
  return (
    <div className="admin-row">
      <span className="badge" data-status="ログ" style={{ flexShrink: 0 }}>
        {ACTION_LABEL[log.action]}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="admin-row-meta">
          <span>@{log.actorHandle}</span>
          <span className="dot-sep">·</span>
          <span>{log.targetType}/{log.targetId}</span>
          {log.reason && (
            <>
              <span className="dot-sep">·</span>
              <span>理由: {log.reason}</span>
            </>
          )}
        </div>
      </div>
      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
        {timeAgo(log.createdAt)}
      </span>
    </div>
  );
}
