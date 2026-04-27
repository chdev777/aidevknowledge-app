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
  // ブラウザは Docker network の外なので、ホスト側マッピング（+200 シフト済）を使う
  // 万一 Docker network 名が指定されていても localhost に置換して安全側に倒す
  const authHost = (import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? 'localhost:9299')
    .replace(/^https?:\/\//, '')
    .replace('firebase-emulator', 'localhost');
  const fsHost = (import.meta.env.VITE_FIRESTORE_EMULATOR_HOST ?? 'localhost:8280')
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
