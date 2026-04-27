import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { authed, makeEnv, UIDS } from './helpers.js';

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

describe('tags / projects rules', () => {
  it('tags は認証ユーザーが read 可', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tags/t1'), { name: 'RAG', type: '技術' });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(getDoc(doc(db, 'tags/t1')));
  });

  it('tags への書込は全ユーザー拒否（admin SDK 専用）', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'tags/t99'), { name: 'X', type: '技術' }));
  });

  it('projects も同様', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'projects/p99'), { name: 'X' }));
  });
});
