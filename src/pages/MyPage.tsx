import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  appsDb,
  commentsDb,
  linksDb,
  notesDb,
  questionsDb,
} from '../lib/db/index.js';
import { useAuth } from '../lib/firebase/auth-context.js';
import { VisibilityToggle } from '../components/me/VisibilityToggle.js';
import { Spinner } from '../components/shared/Spinner.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { Icon, type IconName } from '../components/shared/Icon.js';
import { CommentTypeBadge } from '../components/comments/CommentTypeBadge.js';
import { sourceShort } from '../lib/utils/source.js';
import { timeAgo } from '../lib/utils/time.js';
import type { Visibility } from '../types/visibility.js';
import type { Link as LinkDoc } from '../types/link.js';
import type { Question } from '../types/question.js';
import type { Note } from '../types/note.js';
import type { AiApp } from '../types/app.js';

type VisFilter = 'all' | 'shared' | 'private';
type TabId = 'links' | 'questions' | 'notes' | 'apps' | 'comments' | 'favorites' | 'drafts';

interface TabDef {
  id: TabId;
  label: string;
  icon: IconName;
  count?: number;
  disabled?: boolean;
}

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

  const unanswered = (questionsQ.data ?? []).filter((q) => q.answerCount === 0).length;
  const answered = (counts.questions.total ?? 0) - unanswered;

  const tabs: TabDef[] = [
    { id: 'links', label: '自分のURL', icon: 'link', count: counts.links.total },
    { id: 'questions', label: '自分の質問', icon: 'qa', count: counts.questions.total },
    { id: 'notes', label: '自分の検証メモ', icon: 'note', count: counts.notes.total },
    { id: 'apps', label: '自分の作成アプリ', icon: 'app', count: counts.apps.total },
    { id: 'comments', label: 'コメント履歴', icon: 'message', count: counts.comments.total },
    { id: 'favorites', label: 'お気に入り', icon: 'star', disabled: true },
    { id: 'drafts', label: '下書き', icon: 'note', disabled: true },
  ];

  const visMatch = (v: Visibility) =>
    visFilter === 'all' ? true : visFilter === v;

  const compose = (kind: 'link' | 'note' | 'app') => {
    const next = new URLSearchParams(params);
    next.set('compose', kind);
    setParams(next);
  };

  if (!uid || !profile) return null;

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.charAt(0))
    .join('')
    .slice(0, 2);

  return (
    <div className="page">
      <div className="me-header">
        <div
          className="me-avatar"
          style={{
            background: `${profile.color}22`,
            color: profile.color,
            borderColor: `${profile.color}44`,
          }}
        >
          {initials}
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-3)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            MY PAGE
          </div>
          <div className="me-name">
            {profile.name}{' '}
            <span style={{ color: 'var(--ink-3)', fontSize: 14, fontWeight: 400 }}>さん</span>
          </div>
          <div className="me-role">{profile.role} · @{profile.handle}</div>
          {fbUser?.email && <div className="me-email">{fbUser.email}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button type="button" className="btn sm" onClick={() => compose('link')}>
            <Icon name="plus" size={12} />
            URLを登録
          </button>
          <button type="button" className="btn sm" onClick={() => compose('note')}>
            <Icon name="plus" size={12} />
            検証メモを書く
          </button>
          <button type="button" className="btn sm" onClick={() => compose('app')}>
            <Icon name="plus" size={12} />
            作成アプリを登録
          </button>
        </div>
      </div>

      <div className="section-title">自分の登録状況</div>
      <div className="me-stats">
        <Stat label="登録URL" value={counts.links.total} unit="件" splits={[`共有 ${counts.links.shared}`, `非公開 ${counts.links.privateCount}`]} />
        <Stat label="質問" value={counts.questions.total} unit="件" splits={[`未回答 ${unanswered}`, `回答済 ${answered}`]} />
        <Stat label="検証メモ" value={counts.notes.total} unit="件" splits={[`共有 ${counts.notes.shared}`, `非公開 ${counts.notes.privateCount}`]} />
        <Stat label="作成アプリ" value={counts.apps.total} unit="件" splits={[`共有 ${counts.apps.shared}`, `非公開 ${counts.apps.privateCount}`]} />
        <Stat label="コメント" value={counts.comments.total} unit="件" />
      </div>

      <div className="me-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`me-tab ${t.id === tab ? 'active' : ''}`}
            onClick={() => !t.disabled && setTab(t.id)}
            disabled={t.disabled}
            style={t.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
            {t.count !== undefined && <span className="me-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {(tab === 'links' || tab === 'questions' || tab === 'notes' || tab === 'apps') && (
        <div className="me-filter">
          <div className="vis-switch">
            <button
              type="button"
              className={visFilter === 'all' ? 'active' : ''}
              onClick={() => setVisFilter('all')}
            >
              すべて
            </button>
            <button
              type="button"
              className={visFilter === 'shared' ? 'active' : ''}
              onClick={() => setVisFilter('shared')}
            >
              共有中
            </button>
            <button
              type="button"
              className={visFilter === 'private' ? 'active' : ''}
              onClick={() => setVisFilter('private')}
            >
              非公開
            </button>
          </div>
        </div>
      )}

      {tab === 'links' && (
        <OwnedList
          q={linksQ}
          filter={(item) => visMatch(item.visibility)}
          renderRow={(l) => (
            <LinkMeRow
              link={l}
              uid={uid}
            />
          )}
          rowKey="id"
        />
      )}

      {tab === 'questions' && (
        <OwnedList
          q={questionsQ}
          filter={(item) => visMatch(item.visibility)}
          renderRow={(q) => <QuestionMeRow q={q} uid={uid} />}
          rowKey="id"
        />
      )}

      {tab === 'notes' && (
        <OwnedList
          q={notesQ}
          filter={(item) => visMatch(item.visibility)}
          renderRow={(n) => <NoteMeRow note={n} uid={uid} />}
          rowKey="id"
        />
      )}

      {tab === 'apps' && (
        <OwnedList
          q={appsQ}
          filter={(item) => visMatch(item.visibility)}
          renderRow={(a) => <AppMeRow app={a} uid={uid} />}
          rowKey="id"
        />
      )}

      {tab === 'comments' && <CommentHistory items={commentsQ.data ?? []} isPending={commentsQ.isPending} />}

      {(tab === 'favorites' || tab === 'drafts') && (
        <EmptyState title="今後実装予定" description="Phase 2 で公開予定の機能です。" />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  splits,
}: {
  label: string;
  value: number;
  unit?: string;
  splits?: string[];
}) {
  return (
    <div className="me-stat">
      <div className="me-stat-label">{label}</div>
      <div className="me-stat-value">
        {value}
        {unit && <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>{unit}</span>}
      </div>
      {splits && splits.length > 0 && (
        <div className="me-stat-split">
          {splits.map((s, i) => (
            <span key={i} className={i === 0 && splits[0]!.startsWith('共有') ? 'sp-shared' : 'sp-private'}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function OwnedList<T extends { id: string }>(props: {
  q: { isPending: boolean; data: T[] | undefined };
  filter: (item: T) => boolean;
  rowKey: keyof T;
  renderRow: (item: T) => JSX.Element;
}) {
  if (props.q.isPending) return <Spinner />;
  const items = (props.q.data ?? []).filter(props.filter);
  if (items.length === 0) {
    return <EmptyState title="該当する登録はありません" />;
  }
  return (
    <div style={{ borderTop: '1px solid var(--line)' }}>
      {items.map((item) => (
        <div key={String(item[props.rowKey])}>{props.renderRow(item)}</div>
      ))}
    </div>
  );
}

function VisBadge({ v }: { v: Visibility }) {
  return (
    <span className="vis-badge" data-vis={v}>
      {v === 'shared' ? '共有中' : '非公開'}
    </span>
  );
}

function LinkMeRow({ link, uid }: { link: LinkDoc; uid: string }) {
  const nav = useNavigate();
  return (
    <div className="me-row">
      <div className="me-row-icon">{sourceShort(link.sourceType)}</div>
      <div style={{ minWidth: 0 }}>
        <div className="me-row-title" onClick={() => nav(`/links/${link.id}`)}>{link.title}</div>
        <div className="me-row-meta">
          <VisBadge v={link.visibility} />
          {link.tags.slice(0, 3).map((t) => (
            <span key={t} className="tag"><span className="tag-dot" />{t}</span>
          ))}
          <span>· {timeAgo(link.createdAt)}</span>
        </div>
      </div>
      <div className="me-actions">
        <Link to={`/links/${link.id}`} className="btn xs">詳細</Link>
        <VisibilityToggle
          current={link.visibility}
          invalidateKeys={[
            ['me', 'links', uid],
            ['links', 'shared'],
            ['home', 'recentLinks'],
          ]}
          setVisibility={(v) => linksDb.updateVisibility(link.id, v)}
        />
      </div>
    </div>
  );
}

function QuestionMeRow({ q, uid }: { q: Question; uid: string }) {
  const nav = useNavigate();
  return (
    <div className="me-row">
      <div className="me-row-icon">Q&A</div>
      <div style={{ minWidth: 0 }}>
        <div className="me-row-title" onClick={() => nav(`/qa/${q.id}`)}>{q.title}</div>
        <div className="me-row-meta">
          <VisBadge v={q.visibility} />
          <span className="badge" data-status={q.status}><span className="badge-dot" />{q.status}</span>
          <span>· 回答 {q.answerCount}</span>
          <span>· {timeAgo(q.createdAt)}</span>
        </div>
      </div>
      <div className="me-actions">
        <Link to={`/qa/${q.id}`} className="btn xs">詳細</Link>
        <VisibilityToggle
          current={q.visibility}
          invalidateKeys={[
            ['me', 'questions', uid],
            ['questions', 'shared'],
            ['home', 'unansweredQuestions'],
          ]}
          setVisibility={(v) => questionsDb.updateVisibility(q.id, v)}
        />
      </div>
    </div>
  );
}

function NoteMeRow({ note, uid }: { note: Note; uid: string }) {
  const nav = useNavigate();
  return (
    <div className="me-row">
      <div className="me-row-icon">NOTE</div>
      <div style={{ minWidth: 0 }}>
        <div className="me-row-title" onClick={() => nav(`/notes/${note.id}`)}>{note.title}</div>
        <div className="me-row-meta">
          <VisBadge v={note.visibility} />
          {note.tags.slice(0, 3).map((t) => (
            <span key={t} className="tag"><span className="tag-dot" />{t}</span>
          ))}
          <span>· {timeAgo(note.createdAt)}</span>
        </div>
      </div>
      <div className="me-actions">
        <Link to={`/notes/${note.id}`} className="btn xs">詳細</Link>
        <VisibilityToggle
          current={note.visibility}
          invalidateKeys={[
            ['me', 'notes', uid],
            ['notes', 'shared'],
            ['home', 'recentNotes'],
          ]}
          setVisibility={(v) => notesDb.updateVisibility(note.id, v)}
        />
      </div>
    </div>
  );
}

function AppMeRow({ app, uid }: { app: AiApp; uid: string }) {
  const nav = useNavigate();
  return (
    <div className="me-row">
      <div className="me-row-icon">APP</div>
      <div style={{ minWidth: 0 }}>
        <div className="me-row-title" onClick={() => nav(`/apps/${app.id}`)}>{app.name}</div>
        <div className="me-row-meta">
          <VisBadge v={app.visibility} />
          <span className="badge" data-status={app.status}><span className="badge-dot" />{app.status}</span>
          <span>· {timeAgo(app.createdAt)}</span>
        </div>
      </div>
      <div className="me-actions">
        <Link to={`/apps/${app.id}`} className="btn xs">詳細</Link>
        <VisibilityToggle
          current={app.visibility}
          invalidateKeys={[
            ['me', 'apps', uid],
            ['apps', 'shared'],
            ['home', 'recentApps'],
          ]}
          setVisibility={(v) => appsDb.updateVisibility(app.id, v)}
        />
      </div>
    </div>
  );
}

function CommentHistory({
  items,
  isPending,
}: {
  items: import('../types/comment.js').Comment[];
  isPending: boolean;
}) {
  if (isPending) return <Spinner />;
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
