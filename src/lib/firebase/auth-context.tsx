import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './client.js';
import type { User } from '../../types/user.js';
import { logger } from '../utils/log.js';

export type AuthStatus = 'loading' | 'authed' | 'unauthed' | 'unverified' | 'profileMissing';

export interface AuthState {
  status: AuthStatus;
  fbUser: FirebaseUser | null;
  profile: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendVerification: () => Promise<void>;
  /** Auth サーバから user を再取得して emailVerified を再評価。検証完了後に呼ぶ。 */
  recheckVerification: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function loadProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, `users/${uid}`));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data['name'],
    handle: data['handle'],
    role: data['role'],
    color: data['color'] ?? '#6b7a99',
    avatarPath: data['avatarPath'],
    createdAt: data['createdAt']?.toDate?.() ?? new Date(),
    updatedAt: data['updatedAt']?.toDate?.() ?? new Date(),
  };
}

/**
 * パスワード認証で email_verified=false の場合のみ「未検証」扱い。
 * Google/SAML 等の外部 IdP は IdP 側が検証済を保証するため対象外。
 */
function isPasswordUnverified(u: FirebaseUser): boolean {
  if (u.emailVerified) return false;
  return u.providerData.some((p) => p.providerId === 'password');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFbUser(u);
      if (!u) {
        setProfile(null);
        setStatus('unauthed');
        return;
      }
      if (isPasswordUnverified(u)) {
        setProfile(null);
        setStatus('unverified');
        return;
      }
      try {
        const p = await loadProfile(u.uid);
        if (!p) {
          setStatus('profileMissing');
          setProfile(null);
        } else {
          setProfile(p);
          setStatus('authed');
        }
      } catch (err) {
        logger.error('failed to load profile', { uid: u.uid, err: String(err) });
        setStatus('profileMissing');
      }
    });
    return unsub;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      fbUser,
      profile,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signOut: async () => {
        await fbSignOut(auth);
      },
      sendVerification: async () => {
        if (auth.currentUser) await sendEmailVerification(auth.currentUser);
      },
      recheckVerification: async () => {
        const before = auth.currentUser;
        if (!before) return;
        await before.reload();
        // reload は onAuthStateChanged を発火しないので手動で state 更新。
        // reload 後の最新状態を取り直してから判定する（mutable オブジェクトの stale 参照を避ける）
        const u = auth.currentUser;
        if (!u) {
          setFbUser(null);
          setProfile(null);
          setStatus('unauthed');
          return;
        }
        setFbUser(u);
        if (isPasswordUnverified(u)) {
          setStatus('unverified');
          return;
        }
        try {
          const p = await loadProfile(u.uid);
          setProfile(p);
          setStatus(p ? 'authed' : 'profileMissing');
        } catch (err) {
          logger.error('failed to load profile', { uid: u.uid, err: String(err) });
          setStatus('profileMissing');
        }
      },
      refreshProfile: async () => {
        const u = auth.currentUser;
        if (!u) return;
        // bootstrap 直後は emailVerified=false。ここで 'authed' を立てるとフラッシュが発生し
        // onAuthStateChanged が後から 'unverified' で上書きする。先に未検証判定して終了する。
        if (isPasswordUnverified(u)) {
          setProfile(null);
          setStatus('unverified');
          return;
        }
        const p = await loadProfile(u.uid);
        setProfile(p);
        setStatus(p ? 'authed' : 'profileMissing');
      },
    }),
    [status, fbUser, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
