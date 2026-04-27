import { z } from 'zod';

export const visibilitySchema = z.enum(['private', 'shared']);

/** タグ自由入力。trim + 重複除去 + 空除去 + 32文字以内 + 最大10個 */
export const tagsSchema = z
  .array(z.string())
  .transform((arr) =>
    Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))),
  )
  .pipe(z.array(z.string().max(32)).max(10));

/** http/https のみ許可（javascript: 等は拒否） */
export const safeUrlSchema = z
  .string()
  .trim()
  .min(1, 'URL を入力してください')
  .max(2000)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'URL の形式が正しくありません（http:// か https:// のみ）');

export const titleSchema = z
  .string()
  .trim()
  .min(1, 'タイトルを入力してください')
  .max(200, 'タイトルは200文字以内');

export const longTextSchema = (max: number, label = '本文') =>
  z.string().max(max, `${label}は${max}文字以内`);

export function csvToTags(input: string): string[] {
  return input
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
}
