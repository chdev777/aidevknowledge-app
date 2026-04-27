export function timeAgo(d: Date | string | number, now: Date = new Date()): string {
  const t = d instanceof Date ? d : new Date(d);
  const diff = (now.getTime() - t.getTime()) / 1000;
  if (diff < 60) return 'たった今';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 時間前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 日前`;
  return t.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}
