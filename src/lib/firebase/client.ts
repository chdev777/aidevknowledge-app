import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const useEmulator = import.meta.env.VITE_USE_EMULATOR === '1';

const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (useEmulator) {
  // ブラウザからは host name 解決のため localhost を使う（Docker host network）
  const authHost = (import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? 'localhost:9099')
    .replace(/^https?:\/\//, '')
    .replace('firebase-emulator', 'localhost');
  const fsHost = (import.meta.env.VITE_FIRESTORE_EMULATOR_HOST ?? 'localhost:8080')
    .replace(/^https?:\/\//, '')
    .replace('firebase-emulator', 'localhost');

  const [authHostname, authPort] = authHost.split(':');
  const [fsHostname, fsPort] = fsHost.split(':');

  connectAuthEmulator(auth, `http://${authHostname}:${authPort}`, { disableWarnings: true });
  if (fsHostname && fsPort) {
    connectFirestoreEmulator(db, fsHostname, Number(fsPort));
  }

  // 共有PCでのIndexedDBキャッシュ残留を防ぐため、本MVPではオフライン永続化を無効化
  // （何もしない＝既定でメモリのみ）
}

export const firebaseConfig = config;
export const isEmulator = useEmulator;
