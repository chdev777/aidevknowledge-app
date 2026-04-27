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

export type AuthStatus = 'loading' | 'authed' | 'unauthed' | 'profileMissing';

export interface AuthState {
  status: AuthStatus;
  fbUser: FirebaseUser | null;
  profile: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendVerification: () => Promise<void>;
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
      refreshProfile: async () => {
        if (auth.currentUser) {
          const p = await loadProfile(auth.currentUser.uid);
          setProfile(p);
          setStatus(p ? 'authed' : 'profileMissing');
        }
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
