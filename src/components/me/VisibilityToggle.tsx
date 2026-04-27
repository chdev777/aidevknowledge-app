import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Visibility } from '../../types/visibility.js';
import { ConfirmDialog } from '../shared/ConfirmDialog.js';
import { toAppError } from '../../lib/utils/error.js';
import { logger } from '../../lib/utils/log.js';

interface Props {
  current: Visibility;
  invalidateKeys: string[][];
  setVisibility: (next: Visibility) => Promise<void>;
}

/**
 * 行ごとの「共有する / 非公開にする」切替ボタン + ConfirmDialog
 * 楽観的更新は行わず、確定後に該当 query を invalidate する
 */
export function VisibilityToggle({ current, invalidateKeys, setVisibility }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const next: Visibility = current === 'private' ? 'shared' : 'private';

  const m = useMutation({
    mutationFn: async () => setVisibility(next),
    onSuccess: () => {
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      setOpen(false);
    },
    onError: (err) => {
      logger.error('visibility toggle failed', { err: toAppError(err).userMessage });
      setOpen(false);
    },
  });

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost mono"
        onClick={() => setOpen(true)}
      >
        {next === 'shared' ? '共有する' : '非公開にする'}
      </button>
      <ConfirmDialog
        open={open}
        title={
          next === 'shared'
            ? 'この情報を共有しますか？'
            : 'この情報を非公開にしますか？'
        }
        description={
          next === 'shared'
            ? '共有すると、DX推進担当者・情報支援グループのメンバーが閲覧できます。'
            : '非公開にすると、本人以外は本文・コメントとも閲覧できなくなります。'
        }
        confirmLabel={next === 'shared' ? '共有する' : '非公開にする'}
        destructive={next === 'private'}
        onConfirm={() => m.mutate()}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
