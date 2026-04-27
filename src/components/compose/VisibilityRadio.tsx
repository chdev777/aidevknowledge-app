import type { Visibility } from '../../types/visibility.js';

interface Props {
  value: Visibility;
  onChange: (next: Visibility) => void;
}

export function VisibilityRadio({ value, onChange }: Props) {
  return (
    <fieldset className="visibility-radio">
      <legend>公開設定</legend>
      <label className="radio">
        <input
          type="radio"
          name="visibility"
          value="private"
          checked={value === 'private'}
          onChange={() => onChange('private')}
        />
        <span>
          <strong>非公開</strong>
          <em className="mono">自分だけが見られる</em>
        </span>
      </label>
      <label className="radio">
        <input
          type="radio"
          name="visibility"
          value="shared"
          checked={value === 'shared'}
          onChange={() => onChange('shared')}
        />
        <span>
          <strong>共有</strong>
          <em className="mono">DX推進・情報支援グループに公開</em>
        </span>
      </label>
    </fieldset>
  );
}
