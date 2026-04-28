import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, deleteDoc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { authed, makeEnv, seedUser, UIDS } from './helpers.js';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await makeEnv();
});
afterAll(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

describe('favorites rules', () => {
  it('本人の favorites は read/write 可', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(
      setDoc(doc(db, `favorites/${UIDS.alice}/items/f1`), {
        targetType: 'link',
        targetId: 'l1',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('他人の favorites は read 拒否', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `favorites/${UIDS.alice}/items/f1`), {
        targetType: 'link',
        targetId: 'l1',
      });
    });
    const db = authed(env, UIDS.bob).firestore();
    await assertFails(getDoc(doc(db, `favorites/${UIDS.alice}/items/f1`)));
  });

  it('他人の favorites に write 拒否', async () => {
    const db = authed(env, UIDS.bob).firestore();
    await assertFails(
      setDoc(doc(db, `favorites/${UIDS.alice}/items/f1`), {
        targetType: 'link',
        targetId: 'l1',
      }),
    );
  });
});

describe('tags rules', () => {
  it('認証ユーザーは tags を read できる', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tags/t1'), { name: 'RAG', type: '技術' });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(getDoc(doc(db, 'tags/t1')));
  });

  it('一般ユーザーは tags を create できない', async () => {
    await seedUser(env, UIDS.alice, 'DX推進');
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'tags/t99'), { name: 'X', type: '技術' }));
  });

  it('管理者は tags を create できる', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(setDoc(doc(db, 'tags/t99'), { name: 'X', type: '技術' }));
  });

  it('管理者でも未知の type は拒否', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'tags/t99'), { name: 'X', type: 'スパム' }));
  });

  it('管理者でも空の name は拒否', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'tags/t99'), { name: '', type: '技術' }));
  });

  it('管理者は tags を update / delete できる', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tags/t1'), { name: 'RAG', type: '技術' });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(updateDoc(doc(db, 'tags/t1'), { name: 'RAG2', type: '技術' }));
    await assertSucceeds(deleteDoc(doc(db, 'tags/t1')));
  });

  it('一般ユーザーは tags を delete できない', async () => {
    await seedUser(env, UIDS.alice, 'DX推進');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tags/t1'), { name: 'RAG', type: '技術' });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(deleteDoc(doc(db, 'tags/t1')));
  });
});

describe('projects rules', () => {
  it('projects は read 可だが write 不可', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'projects/p99'), { name: 'X' }));
  });
});
