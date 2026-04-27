import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  appsDb,
  commentsDb,
  linksDb,
  notesDb,
  questionsDb,
} from '../lib/db/index.js';
import { useAuth } from '../lib/firebase/auth-context.js';
import { Avatar } from '../components/shell/Avatar.js';
import { TabBar, type TabDef } from '../components/me/TabBar.js';
import { MetricsRow } from '../components/me/MetricsRow.js';
import { VisibilityToggle } from '../components/me/VisibilityToggle.js';
import { VisibilityBadge } from '../components/shared/VisibilityBadge.js';
import { TagList } from '../components/shared/Tag.js';
import { StatusBadge } from '../components/shared/StatusBadge.js';
import { Spinner } from '../components/shared/Spinner.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { CommentTypeBadge } from '../components/comments/CommentTypeBadge.js';
import type { Visibility } from '../types/visibility.js';

type VisFilter = 'all' | 'shared' | 'private';
type TabId = 'links' | 'questions' | 'notes' | 'apps' | 'comments';

export function MyPage() {
  const { profile, fbUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>('links');
  const [visFilter, setVisFilter] = useState<VisFilter>('all');

  const uid = fbUser?.uid;

  const linksQ = useQuery({
    queryKey: ['me', 'links', uid],
    queryFn: () => (uid ? linksDb.findByOwner(uid) : Promise.resolve([])),
    enabled: !!uid,
  });
  const questionsQ = useQuery({
    queryKey: ['me', 'questions', uid],
    queryFn: () => (uid ? questionsDb.findByOwner(uid) : Promise.resolve([])),
    enabled: !!uid,
  });
  const notesQ = useQuery({
    queryKey: ['me', 'notes', uid],
    queryFn: () => (uid ? notesDb.findByOwner(uid) : Promise.resolve([])),
    enabled: !!uid,
  });
  const appsQ = useQuery({
    queryKey: ['me', 'apps', uid],
    queryFn: () => (uid ? appsDb.findByOwner(uid) : Promise.resolve([])),
    enabled: !!uid,
  });
  const commentsQ = useQuery({
    queryKey: ['me', 'comments', uid],
    queryFn: () => (uid ? commentsDb.findByOwner(uid) : Promise.resolve([])),
    enabled: !!uid,
  });

  const counts = useMemo(() => {
    const tally = <T extends { visibility: Visibility }>(arr: T[] | undefined) => {
      const total = arr?.length ?? 0;
      const shared = arr?.filter((x) => x.visibility === 'shared').length ?? 0;
      return { total, shared, privateCount: total - shared };
    };
    return {
      links: tally(linksQ.data),
      questions: tally(questionsQ.data),
      notes: tally(notesQ.data),
      apps: tally(appsQ.data),
      comments: { total: commentsQ.data?.length ?? 0 },
    };
  }, [linksQ.data, questionsQ.data, notesQ.data, appsQ.data, commentsQ.data]);

  const tabs: TabDef[] = [
    { id: 'links', label: '自分のURL', count: counts.links.total },
    { id: 'questions', label: '自分の質問', count: counts.questions.total },
    { id: 'notes', label: '自分の検証メモ', count: counts.notes.total },
    { id: 'apps', label: '自分の作成アプリ', count: counts.apps.total },
    { id: 'comments', label: 'コメント履歴', count: counts.comments.total },
    { id: 'favorites', label: 'お気に入り', disabled: true },
    { id: 'drafts', label: '下書き', disabled: true },
  ];

  const visMatch = (v: Visibility) =>
    visFilter === 'all' ? true : visFilter === v;

  const compose = (kind: 'link' | 'question' | 'note' | 'app') => {
    const next = new URLSearchParams(params);
    next.set('compose', kind);
    setParams(next);
  };

  return (
    <div className="page">
      <header className="me-header">
        {profile && <Avatar user={profile} size="lg" />}
        <div className="me-header-meta">
          <h1 className="me-name">{profile?.name}</h1>
          <div className="mono me-handle">
            @{profile?.handle} · {profile?.role}
          </div>
        </div>
        <div className="me-quick-actions">
          <button type="button" className="btn" onClick={() => compose('link')}>
            ＋ URL
          </button>
          <button type="button" className="btn" onClick={() => compose('question')}>
            ＋ 質問
          </button>
          <button type="button" className="btn" onClick={() => compose('note')}>
            ＋ メモ
          </button>
          <button type="button" className="btn" onClick={() => compose('app')}>
            ＋ アプリ
          </button>
        </div>
      </header>

      <MetricsRow
        items={[
          { label: 'URL', total: counts.links.total, shared: counts.links.shared, privateCount: counts.links.privateCount },
          { label: '質問', total: counts.questions.total, shared: counts.questions.shared, privateCount: counts.questions.privateCount },
          { label: '検証メモ', total: counts.notes.total, shared: counts.notes.shared, privateCount: counts.notes.privateCount },
          { label: '作成アプリ', total: counts.apps.total, shared: counts.apps.shared, privateCount: counts.apps.privateCount },
          { label: 'コメント', total: counts.comments.total },
        ]}
      />

      <TabBar tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab !== 'comments' && (
        <div className="me-vis-filter">
          <SegmentedControl
            value={visFilter}
            onChange={setVisFilter}
            options={[
              { id: 'all', label: 'すべて' },
              { id: 'shared', label: '共有中' },
              { id: 'private', label: '非公開' },
            ]}
          />
        </div>
      )}

      {tab === 'links' && (
        <OwnedList
          q={linksQ}
          filter={(item) => visMatch(item.visibility)}
          rowKey="id"
          renderRow={(l) => (
            <Link to={`/links/${l.id}`} className="row-link">
              <div className="row-meta">
                <VisibilityBadge value={l.visibility} />
                <StatusBadge value={l.status} />
                <span className="mono row-domain">{l.sourceType} · {l.domain}</span>
              </div>
              <div className="row-title">{l.title}</div>
              <TagList names={l.tags} />
            </Link>
          )}
          renderActions={(l) => (
            <VisibilityToggle
              current={l.visibility}
              invalidateKeys={[
                ['me', 'links', uid],
                ['links', 'shared'],
                ['home', 'recentLinks'],
              ]}
              setVisibility={(v) => linksDb.updateVisibility(l.id, v)}
            />
          )}
        />
      )}

      {tab === 'questions' && (
        <OwnedList
          q={questionsQ}
          filter={(item) => visMatch(item.visibility)}
          rowKey="id"
          renderRow={(qq) => (
            <Link to={`/qa/${qq.id}`} className="row-link">
              <div className="row-meta">
                <VisibilityBadge value={qq.visibility} />
                <StatusBadge value={qq.status} />
                <span className="mono">回答 {qq.answerCount}</span>
              </div>
              <div className="row-title">{qq.title}</div>
              <TagList names={qq.tags} />
            </Link>
          )}
          renderActions={(qq) => (
            <VisibilityToggle
              current={qq.visibility}
              invalidateKeys={[
                ['me', 'questions', uid],
                ['questions', 'shared'],
                ['home', 'unansweredQuestions'],
              ]}
              setVisibility={(v) => questionsDb.updateVisibility(qq.id, v)}
            />
          )}
        />
      )}

      {tab === 'notes' && (
        <OwnedList
          q={notesQ}
          filter={(item) => visMatch(item.visibility)}
          rowKey="id"
          renderRow={(n) => (
            <Link to={`/notes/${n.id}`} className="row-link">
              <div className="row-meta">
                <VisibilityBadge value={n.visibility} />
              </div>
              <div className="row-title">{n.title}</div>
              <div className="row-comment">{n.purpose || n.result}</div>
              <TagList names={n.tags} />
            </Link>
          )}
          renderActions={(n) => (
            <VisibilityToggle
              current={n.visibility}
              invalidateKeys={[
                ['me', 'notes', uid],
                ['notes', 'shared'],
                ['home', 'recentNotes'],
              ]}
              setVisibility={(v) => notesDb.updateVisibility(n.id, v)}
            />
          )}
        />
      )}

      {tab === 'apps' && (
        <OwnedList
          q={appsQ}
          filter={(item) => visMatch(item.visibility)}
          rowKey="id"
          renderRow={(a) => (
            <Link to={`/apps/${a.id}`} className="row-link">
              <div className="row-meta">
                <VisibilityBadge value={a.visibility} />
                <StatusBadge value={a.status} />
                <span className="mono">{a.usageScope}</span>
              </div>
              <div className="row-title">{a.name}</div>
              <div className="row-comment">{a.summary}</div>
              <TagList names={a.tags} />
            </Link>
          )}
          renderActions={(a) => (
            <VisibilityToggle
              current={a.visibility}
              invalidateKeys={[
                ['me', 'apps', uid],
                ['apps', 'shared'],
                ['home', 'recentApps'],
              ]}
              setVisibility={(v) => appsDb.updateVisibility(a.id, v)}
            />
          )}
        />
      )}

      {tab === 'comments' && (
        <CommentHistory
          isPending={commentsQ.isPending}
          items={commentsQ.data ?? []}
        />
      )}
    </div>
  );
}

function OwnedList<T extends { id: string }>(props: {
  q: { isPending: boolean; data: T[] | undefined };
  filter: (item: T) => boolean;
  rowKey: keyof T;
  renderRow: (item: T) => JSX.Element;
  renderActions: (item: T) => JSX.Element;
}) {
  if (props.q.isPending) return <div className="section-loading"><Spinner /></div>;
  const items = (props.q.data ?? []).filter(props.filter);
  if (items.length === 0) {
    return <EmptyState title="該当する登録はありません" />;
  }
  return (
    <ul className="row-list">
      {items.map((item) => (
        <li key={String(item[props.rowKey])} className="row-item me-row">
          <div className="me-row-main">{props.renderRow(item)}</div>
          <div className="me-row-actions">{props.renderActions(item)}</div>
        </li>
      ))}
    </ul>
  );
}

function CommentHistory({
  isPending,
  items,
}: {
  isPending: boolean;
  items: import('../types/comment.js').Comment[];
}) {
  if (isPending) return <div className="section-loading"><Spinner /></div>;
  if (items.length === 0) return <EmptyState title="まだコメントはありません" />;
  return (
    <ul className="comment-list">
      {items.map((c) => (
        <li key={c.id} className="comment-item">
          <div className="comment-head">
            <CommentTypeBadge value={c.type} />
            <span className="mono">{c.targetType}</span>
            <Link to={`/${c.targetType}s/${c.targetId}`} className="mono comment-target-link">
              → 対象を見る
            </Link>
            <time className="comment-time mono">
              {c.createdAt.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
            </time>
          </div>
          <div className="comment-body prose">{c.body}</div>
        </li>
      ))}
    </ul>
  );
}

function SegmentedControl<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="segmented">
      {props.options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`segmented-item ${props.value === o.id ? 'is-active' : ''}`}
          onClick={() => props.onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
