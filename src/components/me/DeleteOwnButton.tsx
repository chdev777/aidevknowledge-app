import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '../shared/ConfirmDialog.js';
import { logger } from '../../lib/utils/log.js';

type Kind = 'URL' | '質問' | '検証メモ' | '作成アプリ';

interface Props {
  kind: Kind;
  title: string;
  onDelete: () => Promise<void>;
  invalidateKeys: readonly (readonly unknown[])[];
}

/**
 * 投稿者本人が自分の投稿を削除するボタン。
 * Firestore Rules の `ownerOf(resource.data) || isAdmin()` で本人削除は許可済。
 * 管理者削除（admin_logs に記録）とは別経路で、本人による削除はログに残らない。
 */
export function DeleteOwnButton({ kind, title, onDelete, invalidateKeys }: Props) {
  const [askingConfirm, setAskingConfirm] = useState(false);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: onDelete,
    onSuccess: () => {
      setAskingConfirm(false);
      for (const key of invalidateKeys) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
    onError: (err) => {
      logger.error('failed to delete own post', { err: String(err), kind, title });
      alert('削除に失敗しました。');
      setAskingConfirm(false);
    },
  });

  return (
    <>
      <button
        type="button"
        className="btn xs"
        onClick={() => setAskingConfirm(true)}
        disabled={mut.isPending}
        aria-label={`${title} を削除`}
      >
        削除
      </button>
      <ConfirmDialog
        open={askingConfirm}
        title={`「${title}」を削除しますか？`}
        description={`この${kind}を完全に削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        destructive
        onConfirm={() => mut.mutate()}
        onCancel={() => setAskingConfirm(false)}
      />
    </>
  );
}
