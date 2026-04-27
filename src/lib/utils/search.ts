/**
 * client-side fuzzy search （タイトル / 本文の部分一致）
 *
 * - ひらがな/カタカナ・大文字小文字を区別しない
 * - スペース区切りで AND 検索
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[ァ-ヶ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60),
    );
}

export function matches(haystack: string, query: string): boolean {
  if (!query.trim()) return true;
  const target = normalize(haystack);
  return query
    .trim()
    .split(/\s+/)
    .every((term) => target.includes(normalize(term)));
}

export function searchByFields<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  fields: (keyof T)[],
): T[] {
  if (!query.trim()) return items;
  return items.filter((item) =>
    fields.some((f) => {
      const v = item[f];
      return typeof v === 'string' && matches(v, query);
    }),
  );
}
