import type { DocumentData, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import type { Link } from '../../types/link.js';
import type { Question, Answer } from '../../types/question.js';
import type { Note } from '../../types/note.js';
import type { AiApp } from '../../types/app.js';
import type { Comment } from '../../types/comment.js';
import type { User } from '../../types/user.js';

function ts(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const v = value as { toDate?: () => Date };
  return v.toDate ? v.toDate() : new Date();
}

export function toLink(snap: QueryDocumentSnapshot<DocumentData>, _opts?: SnapshotOptions): Link {
  const d = snap.data();
  return {
    id: snap.id,
    title: d['title'] ?? '',
    url: d['url'] ?? '',
    sourceType: d['sourceType'] ?? 'Web',
    domain: d['domain'] ?? '',
    summary: d['summary'] ?? '',
    userComment: d['userComment'] ?? '',
    importance: d['importance'] ?? '中',
    status: d['status'] ?? '未確認',
    tags: d['tags'] ?? [],
    projectId: d['projectId'],
    createdBy: d['createdBy'] ?? '',
    visibility: d['visibility'] ?? 'private',
    thumbnailUrl: d['thumbnailUrl'],
    thumbnailPath: d['thumbnailPath'],
    createdAt: ts(d['createdAt']),
    updatedAt: ts(d['updatedAt']),
  };
}

export function toQuestion(snap: QueryDocumentSnapshot<DocumentData>): Question {
  const d = snap.data();
  return {
    id: snap.id,
    title: d['title'] ?? '',
    body: d['body'] ?? '',
    status: d['status'] ?? '未回答',
    tags: d['tags'] ?? [],
    projectId: d['projectId'],
    createdBy: d['createdBy'] ?? '',
    visibility: d['visibility'] ?? 'private',
    answerCount: d['answerCount'] ?? 0,
    acceptedAnswerId: d['acceptedAnswerId'],
    createdAt: ts(d['createdAt']),
    updatedAt: ts(d['updatedAt']),
  };
}

export function toAnswer(qid: string, snap: QueryDocumentSnapshot<DocumentData>): Answer {
  const d = snap.data();
  return {
    id: snap.id,
    questionId: qid,
    body: d['body'] ?? '',
    createdBy: d['createdBy'] ?? '',
    votes: d['votes'] ?? 0,
    accepted: !!d['accepted'],
    createdAt: ts(d['createdAt']),
    updatedAt: ts(d['updatedAt']),
  };
}

export function toNote(snap: QueryDocumentSnapshot<DocumentData>): Note {
  const d = snap.data();
  return {
    id: snap.id,
    title: d['title'] ?? '',
    purpose: d['purpose'] ?? '',
    tried: d['tried'] ?? '',
    result: d['result'] ?? '',
    conclusion: d['conclusion'] ?? '',
    tags: d['tags'] ?? [],
    links: d['links'] ?? [],
    projectId: d['projectId'],
    createdBy: d['createdBy'] ?? '',
    visibility: d['visibility'] ?? 'private',
    attachments: d['attachments'] ?? [],
    createdAt: ts(d['createdAt']),
    updatedAt: ts(d['updatedAt']),
  };
}

export function toApp(snap: QueryDocumentSnapshot<DocumentData>): AiApp {
  const d = snap.data();
  return {
    id: snap.id,
    name: d['name'] ?? '',
    url: d['url'] ?? '',
    summary: d['summary'] ?? '',
    purpose: d['purpose'] ?? '',
    technologies: d['technologies'] ?? [],
    aiModel: d['aiModel'] ?? '',
    usageScope: d['usageScope'] ?? '個人検証',
    status: d['status'] ?? '試作',
    caution: d['caution'] ?? '',
    tags: d['tags'] ?? [],
    projectId: d['projectId'],
    createdBy: d['createdBy'] ?? '',
    visibility: d['visibility'] ?? 'private',
    thumbnailPath: d['thumbnailPath'],
    stats: {
      views: d['stats']?.views ?? 0,
      comments: d['stats']?.comments ?? 0,
      likes: d['stats']?.likes ?? 0,
    },
    createdAt: ts(d['createdAt']),
    updatedAt: ts(d['updatedAt']),
  };
}

export function toComment(snap: QueryDocumentSnapshot<DocumentData>): Comment {
  const d = snap.data();
  return {
    id: snap.id,
    targetType: d['targetType'] ?? 'link',
    targetId: d['targetId'] ?? '',
    type: d['type'] ?? '感想',
    body: d['body'] ?? '',
    createdBy: d['createdBy'] ?? '',
    targetVisibility: d['targetVisibility'] ?? 'shared',
    createdAt: ts(d['createdAt']),
    updatedAt: ts(d['updatedAt']),
  };
}

export function toUser(snap: QueryDocumentSnapshot<DocumentData>): User {
  const d = snap.data();
  return {
    id: snap.id,
    name: d['name'] ?? '',
    handle: d['handle'] ?? '',
    role: d['role'] ?? 'DX推進',
    color: d['color'] ?? '#6b7a99',
    avatarPath: d['avatarPath'],
    createdAt: ts(d['createdAt']),
    updatedAt: ts(d['updatedAt']),
  };
}
