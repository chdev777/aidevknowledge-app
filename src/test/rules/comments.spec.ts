import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { authed, makeEnv, seedUser, UIDS } from './helpers.js';

let env: RulesTestEnvironment;

const baseComment = (createdBy: string, targetVisibility: 'private' | 'shared' = 'shared') => ({
  targetType: 'link',
  targetId: 'l1',
  type: '感想',
  body: 'いい記事ですね',
  createdBy,
  targetVisibility,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await makeEnv();
});
afterAll(async () => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  // activeUser() Rule が users/{uid} の存在を要求するため、書込テスト用に seed
  await seedUser(env, UIDS.alice);
  await seedUser(env, UIDS.bob);
});

describe('comments rules', () => {
  it('targetVisibility=shared の他人コメントは read 可', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'comments/c1'), baseComment(UIDS.alice, 'shared'));
    });
    const db = authed(env, UIDS.bob).firestore();
    await assertSucceeds(getDoc(doc(db, 'comments/c1')));
  });

  it('targetVisibility=private の他人コメントは read 拒否（親docのvisibility継承）', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'comments/c1'), baseComment(UIDS.alice, 'private'));
    });
    const db = authed(env, UIDS.bob).firestore();
    await assertFails(getDoc(doc(db, 'comments/c1')));
  });

  it('自分が書いた private 親docのコメントは read 可', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'comments/c1'), baseComment(UIDS.alice, 'private'));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(getDoc(doc(db, 'comments/c1')));
  });

  it('createdBy を他人にした create は拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'comments/c1'), baseComment(UIDS.bob)));
  });

  it('未知の type は create 拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    const bad = { ...baseComment(UIDS.alice), type: 'スパム' };
    await assertFails(setDoc(doc(db, 'comments/c1'), bad));
  });

  it('body 2000字超は create 拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    const big = { ...baseComment(UIDS.alice), body: 'x'.repeat(2001) };
    await assertFails(setDoc(doc(db, 'comments/c1'), big));
  });

  it('正常な create は成功', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(setDoc(doc(db, 'comments/c1'), baseComment(UIDS.alice)));
  });

  it('管理者は他者の comment を delete できる', async () => {
    await seedUser(env, UIDS.bob, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'comments/c1'), baseComment(UIDS.alice));
    });
    const db = authed(env, UIDS.bob).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'comments/c1')));
  });
});
