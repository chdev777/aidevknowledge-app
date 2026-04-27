import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type Accent = 'amber' | 'indigo' | 'forest';
export type Density = 'standard' | 'compact';

export interface Tweaks {
  theme: Theme;
  accent: Accent;
  density: Density;
}

const KEY = 'aidev:tweaks:v1';

const DEFAULTS: Tweaks = {
  theme: 'light',
  accent: 'amber',
  density: 'standard',
};

function load(): Tweaks {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Tweaks>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function applyToBody(t: Tweaks): void {
  if (typeof document === 'undefined') return;
  document.body.dataset['theme'] = t.theme;
  document.body.dataset['accent'] = t.accent;
  document.body.dataset['density'] = t.density === 'compact' ? 'compact' : '';
}

export function useTweaks(): [Tweaks, <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void] {
  const [tweaks, setTweaks] = useState<Tweaks>(() => {
    const v = load();
    applyToBody(v);
    return v;
  });

  useEffect(() => {
    applyToBody(tweaks);
    try {
      localStorage.setItem(KEY, JSON.stringify(tweaks));
    } catch {
      /* quota exceeded — silently ignore */
    }
  }, [tweaks]);

  function set<K extends keyof Tweaks>(key: K, value: Tweaks[K]): void {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  }

  return [tweaks, set];
}
