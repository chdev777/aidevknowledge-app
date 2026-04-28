import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { authed, makeEnv, seedUser, UIDS } from './helpers.js';

let env: RulesTestEnvironment;

const baseLog = (actorId: string) => ({
  actorId,
  actorHandle: 'sato.k',
  action: 'set_role',
  targetType: 'user',
  targetId: 'someone',
  createdAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await makeEnv();
});
afterAll(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

describe('admin_logs rules', () => {
  it('管理者は log を create できる', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(setDoc(doc(db, 'admin_logs/log1'), baseLog(UIDS.alice)));
  });

  it('一般ユーザーは log を create できない', async () => {
    await seedUser(env, UIDS.alice, 'DX推進');
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'admin_logs/log1'), baseLog(UIDS.alice)));
  });

  it('actorId が自分以外の log create は拒否（なりすまし防止）', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await seedUser(env, UIDS.bob, '管理者');
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'admin_logs/log1'), baseLog(UIDS.bob)));
  });

  it('未知の action は create 拒否', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    const db = authed(env, UIDS.alice).firestore();
    const bad = { ...baseLog(UIDS.alice), action: 'evil' };
    await assertFails(setDoc(doc(db, 'admin_logs/log1'), bad));
  });

  it('管理者は log を read できる', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'admin_logs/log1'), {
        ...baseLog(UIDS.alice),
        createdAt: new Date(),
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(getDoc(doc(db, 'admin_logs/log1')));
  });

  it('一般ユーザーは log を read できない', async () => {
    await seedUser(env, UIDS.alice, 'DX推進');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'admin_logs/log1'), {
        ...baseLog(UIDS.alice),
        createdAt: new Date(),
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(getDoc(doc(db, 'admin_logs/log1')));
  });

  it('管理者でも log の update / delete は不可（不変ログ）', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'admin_logs/log1'), {
        ...baseLog(UIDS.alice),
        createdAt: new Date(),
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(updateDoc(doc(db, 'admin_logs/log1'), { reason: 'changed' }));
    await assertFails(deleteDoc(doc(db, 'admin_logs/log1')));
  });
});
