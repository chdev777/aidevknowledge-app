import { useState, type KeyboardEvent } from 'react';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  placeholder?: string;
}

export function TagInput({ value, onChange, max = 10, placeholder }: Props) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (value.includes(t)) return;
    if (value.length >= max) return;
    onChange([...value, t.slice(0, 32)]);
    setDraft('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '、') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="tag-input">
      <div className="tag-chips">
        {value.map((t) => (
          <span key={t} className="tag-chip">
            <span>{t}</span>
            <button
              type="button"
              className="tag-chip-x"
              aria-label={`タグ ${t} を削除`}
              onClick={() => onChange(value.filter((x) => x !== t))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="tag-chip-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => draft && add(draft)}
          placeholder={value.length === 0 ? placeholder ?? 'タグを入力してEnter' : ''}
          maxLength={32}
        />
      </div>
      <div className="tag-input-help mono">
        {value.length}/{max} · Enter またはカンマで確定
      </div>
    </div>
  );
}
