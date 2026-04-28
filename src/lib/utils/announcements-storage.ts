// お知らせの既読状態を localStorage で保持する防御的ヘルパ。
// プライベートブラウジング等で localStorage が使えなくても例外を投げない。

const KEY_LAST_SEEN = 'aidev:announcements:lastSeen';
const KEY_DISMISS_COUNT = 'aidev:announcements:dismissCount';

export function getLastSeen(): string | null {
  try {
    return localStorage.getItem(KEY_LAST_SEEN);
  } catch {
    return null;
  }
}

export function setLastSeen(version: string): void {
  try {
    localStorage.setItem(KEY_LAST_SEEN, version);
  } catch {
    /* quota / disabled */
  }
}

export function getDismissCount(): number {
  try {
    const raw = localStorage.getItem(KEY_DISMISS_COUNT);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setDismissCount(n: number): void {
  try {
    localStorage.setItem(KEY_DISMISS_COUNT, String(n));
  } catch {
    /* quota / disabled */
  }
}
