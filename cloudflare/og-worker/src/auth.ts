/**
 * Firebase ID Token 検証（firebase-admin SDK 不使用）
 *
 * Workers では firebase-admin が動かない（Node 依存重い）ため、
 * jose で JWT 署名を直接検証する。標準的な「Firebase Admin なしで
 * ID Token を verify する」パターン。
 *
 * 検証項目:
 *  - 署名 (RS256, Google の公開鍵)
 *  - iss = https://securetoken.google.com/<projectId>
 *  - aud = <projectId>
 *  - sub (uid) が空でない
 *  - exp が未来
 *  - auth_time が過去
 */

import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';

const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL), {
      cooldownDuration: 60 * 60 * 1000, // 1h
    });
  }
  return jwksCache;
}

export interface FirebaseTokenPayload extends JWTPayload {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  firebase?: {
    sign_in_provider?: string;
  };
}

export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
): Promise<FirebaseTokenPayload> {
  const jwks = getJwks();
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
    // Worker と Firebase の時刻ずれを許容（5 秒）。Admin SDK 公式実装と整合
    clockTolerance: '5s',
  });

  if (!payload.sub) {
    throw new Error('token missing sub (uid)');
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const tol = 5;
  const authTime = payload['auth_time'];
  if (typeof authTime === 'number' && authTime > nowSec + tol) {
    throw new Error('auth_time is in the future');
  }
  if (typeof payload.iat === 'number' && payload.iat > nowSec + tol) {
    throw new Error('iat is in the future');
  }

  return { ...payload, uid: payload.sub } as FirebaseTokenPayload;
}

/**
 * Hono ミドルウェア: Authorization: Bearer <token> を検証して
 * c.set('user', payload) する
 */
export function requireAuth(projectId: string) {
  return async (c: import('hono').Context, next: () => Promise<void>) => {
    const header = c.req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return c.json({ error: 'missing bearer token' }, 401);
    }
    const token = header.slice('Bearer '.length);
    try {
      const user = await verifyFirebaseIdToken(token, projectId);
      c.set('user', user);
      await next();
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'verify failed';
      return c.json({ error: 'invalid token', detail: msg }, 401);
    }
  };
}
