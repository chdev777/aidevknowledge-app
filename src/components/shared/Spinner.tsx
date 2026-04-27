export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="page-loading">
      <Spinner size={28} />
      <span className="mono">読み込み中…</span>
    </div>
  );
}
