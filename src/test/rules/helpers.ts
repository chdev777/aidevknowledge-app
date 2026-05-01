import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { doc, setDoc, setLogLevel } from 'firebase/firestore';

setLogLevel('error');

const PROJECT_ID = 'aidev-knowledge-test';

function parseEmulatorHost(): { host: string; port: number } {
  const raw = process.env.FIRESTORE_EMULATOR_HOST?.trim();
  if (raw) {
    const [host, port] = raw.split(':');
    if (host && port) return { host, port: Number(port) };
  }
  return { host: '127.0.0.1', port: 8080 };
}

export async function makeEnv(): Promise<RulesTestEnvironment> {
  const { host, port } = parseEmulatorHost();
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      host,
      port,
    },
  });
}

export type Ctx = ReturnType<RulesTestEnvironment['authenticatedContext']>;

export const UIDS = {
  alice: 'alice',
  bob: 'bob',
  carol: 'carol',
} as const;

export function authed(env: RulesTestEnvironment, uid: string): RulesTestContext {
  return env.authenticatedContext(uid, { email_verified: true });
}

/** 未検証 (email_verified=false) ユーザのコンテキスト。書込系の主要パスは Rules で拒否されるはず。 */
export function authedUnverified(env: RulesTestEnvironment, uid: string): RulesTestContext {
  return env.authenticatedContext(uid, { email_verified: false });
}

export function unauthed(env: RulesTestEnvironment): RulesTestContext {
  return env.unauthenticatedContext();
}

export const FIXED_TIMESTAMP = new Date('2026-04-27T00:00:00Z');

/** ルールをバイパスして users/{uid} を作成（admin/non-admin 区別をテストで使う） */
export async function seedUser(
  env: RulesTestEnvironment,
  uid: string,
  role: 'DX推進' | '情報支援' | '管理者' = 'DX推進',
): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `users/${uid}`), {
      name: uid,
      handle: uid,
      role,
      color: '#6b7a99',
    });
  });
}
