import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import type { Request, Response, NextFunction } from 'express';

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'aidev-knowledge-dev';

// Auth Emulator 接続
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST.replace(/^https?:\/\//, '');
}

if (!getApps().length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    initializeApp({ credential: cert(serviceAccountPath), projectId });
  } else {
    // emulator では credential 不要
    initializeApp({ projectId });
  }
}

const auth = getAuth();

export interface AuthedRequest extends Request {
  user?: DecodedIdToken;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing bearer token' });
    return;
  }
  const token = header.slice('Bearer '.length);
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'verify failed';
    res.status(401).json({ error: 'invalid token', detail: msg });
  }
}
