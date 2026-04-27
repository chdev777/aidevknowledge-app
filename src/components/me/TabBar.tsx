import type { ReactNode } from 'react';

export interface TabDef {
  id: string;
  label: string;
  count?: number;
  badge?: ReactNode;
  disabled?: boolean;
}

interface Props {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function TabBar({ tabs, active, onChange }: Props) {
  return (
    <nav className="me-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          aria-disabled={t.disabled || undefined}
          className={`me-tab ${t.id === active ? 'is-active' : ''} ${t.disabled ? 'is-disabled' : ''}`}
          onClick={() => !t.disabled && onChange(t.id)}
          disabled={t.disabled}
        >
          <span>{t.label}</span>
          {t.count !== undefined && (
            <span className="mono me-tab-count">{t.count}</span>
          )}
          {t.badge}
        </button>
      ))}
    </nav>
  );
}
