import { auth } from '../firebase/client.js';

const proxyUrl = import.meta.env.VITE_OG_PROXY_URL ?? 'http://localhost:8987';

export interface OgMeta {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

export class OgFetchError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'OgFetchError';
  }
}

/**
 * og-proxy 経由で OG メタデータを取得。
 * - 通信エラー / 認証切れ / upstream 502 等は OgFetchError を throw
 * - 取得自体は成功したが title/description/image が全て空のケースは OgMeta を返す
 *   （X.com の非ブラウザ UA レスポンスのように、サイト側が空メタを返すのも正常応答扱い）
 *   呼び出し側で `isOgEmpty(og)` をチェックしてユーザーに通知すること
 */
export async function fetchOg(targetUrl: string): Promise<OgMeta> {
  const user = auth.currentUser;
  if (!user) throw new OgFetchError(401, 'サインインが必要です');
  const token = await user.getIdToken();

  let res: Response;
  try {
    res = await fetch(
      `${proxyUrl}/api/og?url=${encodeURIComponent(targetUrl)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch (err) {
    throw new OgFetchError(0, `og-proxy に接続できません: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new OgFetchError(res.status, `og-proxy ${res.status}: ${detail.slice(0, 120)}`);
  }
  return (await res.json()) as OgMeta;
}

export function isOgEmpty(og: OgMeta): boolean {
  return !og.title && !og.description && !og.image;
}
