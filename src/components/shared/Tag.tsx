interface Props {
  name: string;
  onClick?: () => void;
}

export function TagChip({ name, onClick }: Props) {
  return (
    <span
      className="tag-pill"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
    >
      <span className="tag-pill-dot" />
      {name}
    </span>
  );
}

export function TagList({ names, onClick }: { names: string[]; onClick?: (name: string) => void }) {
  if (!names || names.length === 0) return null;
  return (
    <span className="tag-list">
      {names.map((n) => (
        <TagChip key={n} name={n} onClick={onClick ? () => onClick(n) : undefined} />
      ))}
    </span>
  );
}
