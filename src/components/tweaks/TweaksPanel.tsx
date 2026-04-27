import { useState } from 'react';
import { useTweaks, type Accent, type Density, type Theme } from '../../lib/utils/tweaks.js';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: 'ライト' },
  { id: 'dark', label: 'ダーク' },
];

const ACCENTS: { id: Accent; label: string }[] = [
  { id: 'amber', label: 'アンバー' },
  { id: 'indigo', label: 'インディゴ' },
  { id: 'forest', label: 'フォレスト' },
];

const DENSITIES: { id: Density; label: string }[] = [
  { id: 'standard', label: '標準' },
  { id: 'compact', label: 'コンパクト' },
];

export function TweaksPanel() {
  const [tweaks, setTweak] = useTweaks();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="tweaks-toggle"
        onClick={() => setOpen((v) => !v)}
        title="Tweaks"
        aria-label="Tweaks"
      >
        ⚙
      </button>

      {open && (
        <div className="tweaks-panel" role="dialog" aria-label="Tweaks">
          <div className="tweaks-head">
            <b>Tweaks</b>
            <button
              type="button"
              className="tweaks-close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="tweaks-body">
            <Segmented
              label="テーマ"
              value={tweaks.theme}
              options={THEMES}
              onChange={(v) => setTweak('theme', v)}
            />
            <Segmented
              label="アクセント"
              value={tweaks.accent}
              options={ACCENTS}
              onChange={(v) => setTweak('accent', v)}
            />
            <Segmented
              label="情報密度"
              value={tweaks.density}
              options={DENSITIES}
              onChange={(v) => setTweak('density', v)}
            />
          </div>
        </div>
      )}
    </>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}

function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="tweaks-row">
      <div className="tweaks-lbl">{label}</div>
      <div className="tweaks-seg" role="radiogroup">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === value}
            className={`tweaks-seg-btn ${o.id === value ? 'is-active' : ''}`}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
