export function StatusBadge({ value }: { value: string }) {
  return (
    <span className="status-badge mono" data-status={value}>
      <span className="status-dot" />
      {value}
    </span>
  );
}

export function ImportanceBadge({ value }: { value: '高' | '中' | '低' }) {
  return (
    <span className="importance-badge" data-level={value}>
      <span className="importance-bars" aria-hidden="true">
        <span className="importance-bar" />
        <span className="importance-bar" />
        <span className="importance-bar" />
      </span>
      <span className="mono">{value}</span>
    </span>
  );
}

export function SourceTypeBadge({ value }: { value: string }) {
  return <span className="source-badge mono">{value}</span>;
}
