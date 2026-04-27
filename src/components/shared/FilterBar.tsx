interface Filter<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  filters: Filter<T>[];
  value: T;
  onChange: (key: T) => void;
  groupLabel?: string;
}

export function FilterBar<T extends string>({ filters, value, onChange, groupLabel }: Props<T>) {
  return (
    <div className="filter-bar">
      {groupLabel && <span className="filter-group-label">{groupLabel}</span>}
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`filter-chip ${value === f.key ? 'active' : ''}`}
          onClick={() => onChange(f.key)}
        >
          {f.label}
          {f.count !== undefined && <span className="chip-count">{f.count}</span>}
        </button>
      ))}
    </div>
  );
}
