import type { CommentType } from '../../types/comment.js';

const SLUG: Record<CommentType, string> = {
  感想: 'impression',
  改善提案: 'improve',
  不具合報告: 'bug',
  活用アイデア: 'idea',
  技術メモ: 'tech',
  セキュリティ指摘: 'security',
};

export function CommentTypeBadge({ value }: { value: CommentType }) {
  return (
    <span className="comment-type mono" data-type={SLUG[value]}>
      {value}
    </span>
  );
}
