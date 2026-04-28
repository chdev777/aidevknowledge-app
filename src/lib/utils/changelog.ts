import type { Entry, Release } from '../data/changelog.js';

export const MAX_DISMISS_COUNT = 3;

/**
 * audience='admin' のエントリを一般ユーザーから除外する。
 * フィルタ後 entries が空になった Release は Release ごと除外。
 * 元配列は破壊しない（不変）。
 */
export function filterChangelog(
  changelog: Release[] | null | undefined,
  isAdmin: boolean,
): Release[] {
  if (!changelog || changelog.length === 0) return [];
  if (isAdmin) return [...changelog];
  const filtered: Release[] = [];
  for (const release of changelog) {
    const entries = release.entries.filter((e) => (e.audience ?? 'all') !== 'admin');
    if (entries.length === 0) continue;
    filtered.push({ ...release, entries });
  }
  return filtered;
}

/**
 * 最新の未読リリースを取得。changelog はフィルタ済みであるべき。
 * `lastSeen === changelog[0].version` なら null。
 */
export function getUnreadRelease(
  changelog: Release[],
  lastSeen: string | null,
): Release | null {
  if (changelog.length === 0) return null;
  const latest = changelog[0]!;
  if (latest.version === lastSeen) return null;
  return latest;
}

/**
 * Sidebar の未読バッジ用。lastSeen 以降のリリース数を数える。
 * lastSeen が無い / 一致しない場合は全件を未読扱い。
 */
export function unreadCount(
  changelog: Release[],
  lastSeen: string | null,
): number {
  if (changelog.length === 0) return 0;
  if (!lastSeen) return changelog.length;
  const idx = changelog.findIndex((r) => r.version === lastSeen);
  if (idx < 0) return changelog.length; // 既知バージョンが見つからない → 全件未読
  return idx; // 配列の先頭が最新なので「lastSeen より前にある = それより新しい」件数
}

/**
 * × ボタン押下時の状態更新を計算（永続化は呼び出し側責務）。
 * `MAX_DISMISS_COUNT` に到達すると lastSeen も最新版に進める。
 */
export function recordDismiss(
  currentDismissCount: number,
  latestVersion: string,
  max: number = MAX_DISMISS_COUNT,
): { newDismissCount: number; newLastSeen?: string } {
  const newDismissCount = currentDismissCount + 1;
  if (newDismissCount >= max) {
    return { newDismissCount, newLastSeen: latestVersion };
  }
  return { newDismissCount };
}

/**
 * 「詳しく見る」クリック時。lastSeen を最新に進め、dismissCount を 0 にリセット。
 */
export function markAsRead(latestVersion: string): {
  newLastSeen: string;
  newDismissCount: 0;
} {
  return { newLastSeen: latestVersion, newDismissCount: 0 };
}

/**
 * Release に `fromFeedback: true` のエントリが 1 件でもあるか。
 * バナーアイコン / バッジ切替に使う。
 */
export function hasFromFeedback(release: Release | null | undefined): boolean {
  if (!release) return false;
  return release.entries.some((e) => e.fromFeedback === true);
}

/** 表示用: type 別アイコン */
export function entryIcon(type: Entry['type']): string {
  switch (type) {
    case 'feature':
      return '✨';
    case 'improvement':
      return '💡';
    case 'fix':
      return '🔧';
    case 'security':
      return '🔒';
    default:
      return '📌';
  }
}

/** 表示用: 日付フォーマッタ（YYYY-MM-DD → YYYY年M月D日、ゼロ埋めなし） */
export function formatReleaseDate(date: string): string {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date);
  if (!m) return date;
  const [, y, mo, d] = m;
  return `${y}年${Number(mo)}月${Number(d)}日`;
}
