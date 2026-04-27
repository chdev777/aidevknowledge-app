interface Stat {
  label: string;
  total: number;
  shared?: number;
  privateCount?: number;
}

interface Props {
  items: Stat[];
}

export function MetricsRow({ items }: Props) {
  return (
    <section className="me-metrics">
      {items.map((it) => (
        <div key={it.label} className="me-metric">
          <div className="me-metric-label mono">{it.label}</div>
          <div className="me-metric-total">{it.total}</div>
          {(it.shared !== undefined || it.privateCount !== undefined) && (
            <div className="me-metric-sub mono">
              {it.shared !== undefined && <span>共有 {it.shared}</span>}
              {it.privateCount !== undefined && (
                <span>非公開 {it.privateCount}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
