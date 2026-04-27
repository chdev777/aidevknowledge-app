import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setLogLevel } from 'firebase/firestore';

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

export function unauthed(env: RulesTestEnvironment): RulesTestContext {
  return env.unauthenticatedContext();
}

export const FIXED_TIMESTAMP = new Date('2026-04-27T00:00:00Z');
