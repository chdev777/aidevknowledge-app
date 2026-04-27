export type Visibility = 'private' | 'shared';

export const VISIBILITY_VALUES: readonly Visibility[] = ['private', 'shared'] as const;

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  private: '非公開',
  shared: '共有中',
};
