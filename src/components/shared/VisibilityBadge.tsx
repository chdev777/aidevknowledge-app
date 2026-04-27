import type { Visibility } from '../../types/visibility.js';
import { VISIBILITY_LABEL } from '../../types/visibility.js';

export function VisibilityBadge({ value }: { value: Visibility }) {
  return (
    <span className="visibility-badge mono" data-visibility={value}>
      <span className="visibility-dot" />
      {VISIBILITY_LABEL[value]}
    </span>
  );
}
