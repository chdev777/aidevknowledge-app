interface Props {
  visible: boolean;
  onDiscard: () => void;
}

export function DraftRestoredBanner({ visible, onDiscard }: Props) {
  if (!visible) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 12px',
        marginBottom: 14,
        border: '1px solid var(--line)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 8,
        background: 'var(--bg-2)',
        fontSize: 12,
        color: 'var(--ink-2)',
      }}
    >
      <span>前回の下書きを復元しました</span>
      <button
        type="button"
        className="btn ghost xs"
        onClick={onDiscard}
        title="入力をクリアして新規作成"
      >
        破棄して新規作成
      </button>
    </div>
  );
}
