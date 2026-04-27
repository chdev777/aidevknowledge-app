import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { authed, makeEnv, unauthed, UIDS } from './helpers.js';

let env: RulesTestEnvironment;

const baseLink = (createdBy: string, visibility: 'private' | 'shared' = 'shared') => ({
  title: 'RAG設計の失敗例',
  url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
  sourceType: 'YouTube',
  domain: 'youtube.com',
  summary: 'sample summary',
  userComment: 'sample comment',
  importance: '高',
  status: '検証済み',
  tags: ['t1', 't17'],
  createdBy,
  visibility,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await makeEnv();
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('links rules', () => {
  it('未認証ユーザーは shared link を read できない', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice, 'shared'));
    });
    const db = unauthed(env).firestore();
    await assertFails(getDoc(doc(db, 'links/l1')));
  });

  it('認証ユーザーは他人の shared link を read できる', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice, 'shared'));
    });
    const db = authed(env, UIDS.bob).firestore();
    await assertSucceeds(getDoc(doc(db, 'links/l1')));
  });

  it('他人の private link は read 拒否', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice, 'private'));
    });
    const db = authed(env, UIDS.bob).firestore();
    await assertFails(getDoc(doc(db, 'links/l1')));
  });

  it('自分の private link は read 許可', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice, 'private'));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(getDoc(doc(db, 'links/l1')));
  });

  it('createdBy を自分にすれば create 成功', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(setDoc(doc(db, 'links/l1'), baseLink(UIDS.alice)));
  });

  it('createdBy を他人にした create は拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(setDoc(doc(db, 'links/l1'), baseLink(UIDS.bob)));
  });

  it('createdBy 改ざん update は拒否', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(updateDoc(doc(db, 'links/l1'), { createdBy: UIDS.bob }));
  });

  it('他人による update は拒否', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice));
    });
    const db = authed(env, UIDS.bob).firestore();
    await assertFails(updateDoc(doc(db, 'links/l1'), { title: 'hacked' }));
  });

  it('所有者は visibility を private/shared に切替できる', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice, 'private'));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(updateDoc(doc(db, 'links/l1'), { visibility: 'shared' }));
  });

  it('所有者は delete できる', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice));
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'links/l1')));
  });

  it('巨大な title (200字超) は create 拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    const big = { ...baseLink(UIDS.alice), title: 'x'.repeat(201) };
    await assertFails(setDoc(doc(db, 'links/l1'), big));
  });

  it('javascript: URL は create 拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    const bad = { ...baseLink(UIDS.alice), url: 'javascript:alert(1)' };
    await assertFails(setDoc(doc(db, 'links/l1'), bad));
  });

  it('tags が10個超は create 拒否', async () => {
    const db = authed(env, UIDS.alice).firestore();
    const tooMany = {
      ...baseLink(UIDS.alice),
      tags: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    };
    await assertFails(setDoc(doc(db, 'links/l1'), tooMany));
  });
});
