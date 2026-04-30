import { describe, expect, it } from 'vitest';
import type { Release } from '../../lib/data/changelog.js';
import {
  filterChangelog,
  getUnreadRelease,
  hasFromFeedback,
  markAsRead,
  recordDismiss,
  unreadCount,
} from '../../lib/utils/changelog.js';

const sample: Release[] = [
  {
    version: '1.6.0',
    date: '2026-04-01',
    title: 'コメントと管理機能',
    entries: [
      { type: 'feature', title: 'コメント機能' },
      { type: 'improvement', title: '管理者機能', audience: 'admin' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-03-15',
    title: 'ご要望対応',
    entries: [
      { type: 'feature', title: 'ドラッグ改善', fromFeedback: true },
    ],
  },
  {
    version: '1.4.1',
    date: '2026-03-01',
    title: '管理者専用',
    entries: [{ type: 'fix', title: '管理者専用修正', audience: 'admin' }],
  },
];

describe('filterChangelog', () => {
  it('管理者は全件取得（元配列を破壊しない）', () => {
    const out = filterChangelog(sample, true);
    expect(out).toHaveLength(3);
    expect(out[0]!.entries).toHaveLength(2);
    // 不変性
    expect(sample).toHaveLength(3);
  });

  it('一般ユーザーは admin エントリ除外', () => {
    const out = filterChangelog(sample, false);
    // 1.6.0 は entries が 1 件に減って残る、1.5.0 は無傷、1.4.1 は Release ごと消える
    expect(out).toHaveLength(2);
    expect(out[0]!.version).toBe('1.6.0');
    expect(out[0]!.entries).toHaveLength(1);
    expect(out[0]!.entries[0]!.title).toBe('コメント機能');
    expect(out[1]!.version).toBe('1.5.0');
  });

  it('audience 未指定は all 扱い', () => {
    const data: Release[] = [
      { version: '1.0.0', date: '2026-01-01', title: 't', entries: [{ type: 'feature', title: 'a' }] },
    ];
    expect(filterChangelog(data, false)).toHaveLength(1);
  });

  it('null/empty は空配列', () => {
    expect(filterChangelog(null, false)).toEqual([]);
    expect(filterChangelog(undefined, false)).toEqual([]);
    expect(filterChangelog([], false)).toEqual([]);
  });
});

describe('getUnreadRelease', () => {
  it('lastSeen が最新と一致 → null', () => {
    expect(getUnreadRelease(sample, '1.6.0')).toBeNull();
  });
  it('lastSeen が null → 最新を返す', () => {
    expect(getUnreadRelease(sample, null)?.version).toBe('1.6.0');
  });
  it('lastSeen が古いバージョン → 最新を返す', () => {
    expect(getUnreadRelease(sample, '1.5.0')?.version).toBe('1.6.0');
  });
  it('空配列 → null', () => {
    expect(getUnreadRelease([], null)).toBeNull();
  });
});

describe('unreadCount', () => {
  it('lastSeen 無し → 全件', () => {
    expect(unreadCount(sample, null)).toBe(3);
  });
  it('lastSeen が最新 → 0', () => {
    expect(unreadCount(sample, '1.6.0')).toBe(0);
  });
  it('lastSeen が真ん中 → それより新しい数', () => {
    expect(unreadCount(sample, '1.5.0')).toBe(1);
  });
  it('lastSeen が見つからない → 全件未読', () => {
    expect(unreadCount(sample, '99.99.99')).toBe(3);
  });
});

describe('recordDismiss', () => {
  it('1 回目は lastSeen 更新無し', () => {
    expect(recordDismiss(0, '1.6.0')).toEqual({ newDismissCount: 1 });
  });
  it('2 回目も lastSeen 更新無し', () => {
    expect(recordDismiss(1, '1.6.0')).toEqual({ newDismissCount: 2 });
  });
  it('3 回目で lastSeen も更新', () => {
    expect(recordDismiss(2, '1.6.0')).toEqual({
      newDismissCount: 3,
      newLastSeen: '1.6.0',
    });
  });
});

describe('markAsRead', () => {
  it('lastSeen と dismissCount=0 を返す', () => {
    expect(markAsRead('1.6.0')).toEqual({ newLastSeen: '1.6.0', newDismissCount: 0 });
  });
});

describe('hasFromFeedback', () => {
  it('fromFeedback ありの release は true', () => {
    expect(hasFromFeedback(sample[1]!)).toBe(true);
  });
  it('無しは false', () => {
    expect(hasFromFeedback(sample[0]!)).toBe(false);
  });
  it('null は false', () => {
    expect(hasFromFeedback(null)).toBe(false);
  });
});
