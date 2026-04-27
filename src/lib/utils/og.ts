import { auth } from '../firebase/client.js';

const proxyUrl = import.meta.env.VITE_OG_PROXY_URL ?? 'http://localhost:8987';

export interface OgMeta {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

/**
 * og-proxy 経由で OG メタデータを取得
 * （PoC：dev用 Express、本番：Cloud Functions に同ロジックを移植）
 */
export async function fetchOg(targetUrl: string): Promise<OgMeta | null> {
  const user = auth.currentUser;
  if (!user) throw new Error('not signed in');
  const token = await user.getIdToken();
  try {
    const res = await fetch(
      `${proxyUrl}/api/og?url=${encodeURIComponent(targetUrl)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    return (await res.json()) as OgMeta;
  } catch {
    return null;
  }
}
