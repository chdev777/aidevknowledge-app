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
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { authed, makeEnv, seedUser, UIDS } from './helpers.js';

let env: RulesTestEnvironment;

const baseFb = (createdBy: string, status: 'new' | 'acknowledged' | 'resolved' = 'new') => ({
  createdBy,
  userHandleSnap: 'someone',
  userNameSnap: 'Someone',
  category: 'bug',
  message: 'something is broken',
  currentView: '/links',
  status,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await makeEnv();
});
afterAll(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

describe('feedbacks rules — create', () => {
  it('認証ユーザーは自分の createdBy で create 成功', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(setDoc(doc(db, 'feedbacks/f1'), baseFb(UIDS.alice)));
  });

  it('createdBy を他人にした create は拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'feedbacks/f1'), baseFb(UIDS.bob)));
  });

  it('status=new 以外の create は拒否（自己昇格防止）', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      setDoc(doc(db, 'feedbacks/f1'), baseFb(UIDS.alice, 'resolved')),
    );
  });

  it('未知の category は拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      setDoc(doc(db, 'feedbacks/f1'), { ...baseFb(UIDS.alice), category: 'spam' }),
    );
  });

  it('空文字の message は拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      setDoc(doc(db, 'feedbacks/f1'), { ...baseFb(UIDS.alice), message: '' }),
    );
  });

  it('1001 文字の message は拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      setDoc(doc(db, 'feedbacks/f1'), {
        ...baseFb(UIDS.alice),
        message: 'x'.repeat(1001),
      }),
    );
  });
});

describe('feedbacks rules — read', () => {
  it('一般ユーザーは feedbacks を read できない（投稿者本人でも）', async () => {
    await seedUser(env, UIDS.alice, 'DX推進');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFb(UIDS.alice));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(getDoc(doc(db, 'feedbacks/f1')));
  });

  it('管理者は read 可', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFb(UIDS.bob));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(getDoc(doc(db, 'feedbacks/f1')));
  });
});

describe('feedbacks rules — update', () => {
  it('一般ユーザーは update 不可', async () => {
    await seedUser(env, UIDS.alice, 'DX推進');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFb(UIDS.alice));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      updateDoc(doc(db, 'feedbacks/f1'), {
        status: 'acknowledged',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('管理者は new → acknowledged に進められる', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFb(UIDS.bob, 'new'));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'feedbacks/f1'), {
        status: 'acknowledged',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('管理者は new → resolved もスキップ可', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFb(UIDS.bob, 'new'));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'feedbacks/f1'), {
        status: 'resolved',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('管理者でも acknowledged → new の逆遷移は拒否', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), 'feedbacks/f1'),
        baseFb(UIDS.bob, 'acknowledged'),
      );
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      updateDoc(doc(db, 'feedbacks/f1'), {
        status: 'new',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('resolved からの更新は全て拒否', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), 'feedbacks/f1'),
        baseFb(UIDS.bob, 'resolved'),
      );
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      updateDoc(doc(db, 'feedbacks/f1'), {
        status: 'acknowledged',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'feedbacks/f1'), {
        status: 'new',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('管理者でも message 改ざんは拒否', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFb(UIDS.bob));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      updateDoc(doc(db, 'feedbacks/f1'), {
        status: 'acknowledged',
        message: 'tampered',
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe('feedbacks rules — delete', () => {
  it('管理者でも delete は拒否', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFb(UIDS.bob));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(deleteDoc(doc(db, 'feedbacks/f1')));
  });
});
