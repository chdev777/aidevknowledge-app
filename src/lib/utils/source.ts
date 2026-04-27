export function sourceShort(t: string): string {
  const map: Record<string, string> = {
    YouTube: 'YT',
    X: 'X',
    GitHub: 'GH',
    記事: 'ART',
    公式Docs: 'DOC',
  };
  return map[t] ?? 'WEB';
}
