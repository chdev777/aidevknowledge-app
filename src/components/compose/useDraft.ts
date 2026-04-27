import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = (kind: string) => `aidev:draft:${kind}`;

/**
 * ComposeModal の下書き自動保存（localStorage、debounce 500ms）
 *
 * - kind 単位（link/question/note/app）に1件だけ
 * - submit 成功時は clear() を呼ぶ
 */
export function useDraft<T>(
  kind: string,
  initial: T,
): [T, (next: T) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(KEY(kind));
      if (raw) return { ...initial, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return initial;
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

  const update = useCallback((next: T) => {
    dirty.current = true;
    setValue(next);
  }, []);

  const clear = useCallback(() => {
    dirty.current = false;
    try {
      localStorage.removeItem(KEY(kind));
    } catch {
      /* ignore */
    }
    setValue(initial);
  }, [kind, initial]);

  return [value, update, clear];
}
