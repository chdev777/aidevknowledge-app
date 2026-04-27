import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = (kind: string) => `aidev:draft:${kind}`;

export interface UseDraftResult<T> {
  value: T;
  set: (next: T) => void;
  clear: () => void;
  /** mount 時に localStorage から復元されたかどうか */
  wasRestored: boolean;
}

/**
 * ComposeModal の下書き自動保存（localStorage、debounce 500ms）
 *
 * - kind 単位（link/question/note/app）に1件だけ
 * - submit 成功時は clear() を呼ぶ
 * - キャンセル時は残す（誤閉じ復帰のため）。再表示時に wasRestored:true で
 *   バナー表示すること
 */
export function useDraft<T>(kind: string, initial: T): UseDraftResult<T> {
  const [{ value, wasRestored }, setState] = useState<{ value: T; wasRestored: boolean }>(() => {
    try {
      const raw = localStorage.getItem(KEY(kind));
      if (raw) return { value: { ...initial, ...JSON.parse(raw) }, wasRestored: true };
    } catch {
      /* ignore */
    }
    return { value: initial, wasRestored: false };
  });

  const timer = useRef<number | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(KEY(kind), JSON.stringify(value));
      } catch {
        /* ignore quota */
      }
    }, 500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [kind, value]);

  const set = useCallback((next: T) => {
    dirty.current = true;
    setState((prev) => ({ value: next, wasRestored: prev.wasRestored }));
  }, []);

  const clear = useCallback(() => {
    dirty.current = false;
    try {
      localStorage.removeItem(KEY(kind));
    } catch {
      /* ignore */
    }
    setState({ value: initial, wasRestored: false });
  }, [kind, initial]);

  return { value, set, clear, wasRestored };
}
