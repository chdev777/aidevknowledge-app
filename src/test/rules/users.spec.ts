import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { authed, makeEnv, UIDS } from './helpers.js';

let env: RulesTestEnvironment;

const baseUser = (role: 'DX推進' | '情報支援' | '管理者' = 'DX推進') => ({
  name: '佐藤 健一',
  handle: 'sato.k',
  role,
  color: '#b08968',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await makeEnv();
});
afterAll(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

describe('users rules', () => {
  it('自分の users/{uid} は create 成功', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(setDoc(doc(db, `users/${UIDS.alice}`), baseUser()));
  });

  it('role に "管理者" を指定した create は拒否（自己昇格防止）', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, `users/${UIDS.alice}`), baseUser('管理者')));
  });

  it('他人の users/{uid} は create 拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, `users/${UIDS.bob}`), baseUser()));
  });

  it('handle 改ざん update は拒否', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${UIDS.alice}`), baseUser());
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(updateDoc(doc(db, `users/${UIDS.alice}`), { handle: 'newname' }));
  });

  it('role 自己昇格 update は拒否', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${UIDS.alice}`), baseUser('DX推進'));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(updateDoc(doc(db, `users/${UIDS.alice}`), { role: '管理者' }));
  });

  it('private profile は本人のみ read 可', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${UIDS.alice}/private/profile`), {
        email: 'alice@example.ac.jp',
      });
    });
    const aliceDb = authed(env, UIDS.alice).firestore();
    const bobDb = authed(env, UIDS.bob).firestore();
    await assertSucceeds(getDoc(doc(aliceDb, `users/${UIDS.alice}/private/profile`)));
    await assertFails(getDoc(doc(bobDb, `users/${UIDS.alice}/private/profile`)));
  });
});

describe('handles rules', () => {
  it('自分のUIDで handle 登録は成功', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'handles/sato.k'), {
        uid: UIDS.alice,
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('他人のUIDで handle 登録は拒否（なりすまし防止）', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      setDoc(doc(db, 'handles/sato.k'), {
        uid: UIDS.bob,
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('既存 handle の update は拒否', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'handles/sato.k'), {
        uid: UIDS.alice,
        createdAt: serverTimestamp(),
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(updateDoc(doc(db, 'handles/sato.k'), { uid: UIDS.bob }));
  });
});
