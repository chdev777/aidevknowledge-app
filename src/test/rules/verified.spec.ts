// 未検証 (email_verified=false) ユーザが書込系の主要パスを実行できないことを検証する。
// Rules の verified() ヘルパが各リソースの create/update/delete に効いているかの一括テスト。
//
// bootstrap 経路（users create / handles create / users/{uid}/private create）と
// 読取系は signedIn() のままなので未検証でも通過する点に注意。

import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { authed, authedUnverified, makeEnv, seedUser, UIDS } from './helpers.js';

let env: RulesTestEnvironment;

const baseLink = (createdBy: string, visibility: 'private' | 'shared' = 'shared') => ({
  title: 'sample',
  url: 'https://example.com/x',
  sourceType: 'Web',
  domain: 'example.com',
  summary: 's',
  userComment: 'c',
  importance: '中',
  status: '未確認',
  tags: [],
  createdBy,
  visibility,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const baseComment = (createdBy: string) => ({
  targetType: 'link',
  targetId: 'l1',
  targetVisibility: 'shared',
  type: '感想',
  body: 'hello',
  createdBy,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const baseFeedback = (createdBy: string) => ({
  status: 'new',
  category: 'bug',
  message: 'something broken',
  userHandleSnap: createdBy,
  userNameSnap: 'name',
  currentView: '/links',
  createdBy,
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

describe('verified gate', () => {
  describe('bootstrap 経路は未検証でも許可（signedIn のみ要求）', () => {
    it('未検証ユーザが users/{uid} を create できる（bootstrap）', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertSucceeds(
        setDoc(doc(ctx.firestore(), `users/${UIDS.alice}`), {
          name: 'Alice',
          handle: 'alice',
          role: 'DX推進',
          color: '#b08968',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('未検証ユーザが handles/{handle} を create できる（bootstrap）', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertSucceeds(
        setDoc(doc(ctx.firestore(), 'handles/alice'), {
          uid: UIDS.alice,
          createdAt: serverTimestamp(),
        }),
      );
    });

    it('未検証ユーザが users/{uid}/private/profile を create できる（bootstrap）', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertSucceeds(
        setDoc(doc(ctx.firestore(), `users/${UIDS.alice}/private/profile`), {
          email: 'a@example.com',
          createdAt: serverTimestamp(),
        }),
      );
    });
  });

  describe('未検証ユーザは書込系をブロックされる', () => {
    beforeEach(async () => {
      await seedUser(env, UIDS.alice);
    });

    it('未検証ユーザは links create できない', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice)));
    });

    it('未検証ユーザは links update できない', async () => {
      // seed (rule bypass) で既存 link 作成
      await env.withSecurityRulesDisabled(async (admin) => {
        await setDoc(doc(admin.firestore(), 'links/l1'), baseLink(UIDS.alice));
      });
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        updateDoc(doc(ctx.firestore(), 'links/l1'), { summary: 'edited' }),
      );
    });

    it('未検証ユーザは links delete できない', async () => {
      await env.withSecurityRulesDisabled(async (admin) => {
        await setDoc(doc(admin.firestore(), 'links/l1'), baseLink(UIDS.alice));
      });
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(deleteDoc(doc(ctx.firestore(), 'links/l1')));
    });

    it('未検証ユーザは comments create できない', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), 'comments/c1'), baseComment(UIDS.alice)),
      );
    });

    it('未検証ユーザは feedbacks create できない', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFeedback(UIDS.alice)),
      );
    });

    it('未検証ユーザは questions create できない', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), 'questions/q1'), {
          title: 'sample',
          body: 'body',
          status: '未回答',
          tags: [],
          answerCount: 0,
          createdBy: UIDS.alice,
          visibility: 'shared',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('未検証ユーザは answers create できない', async () => {
      await env.withSecurityRulesDisabled(async (admin) => {
        await setDoc(doc(admin.firestore(), 'questions/q1'), {
          title: 'q',
          body: 'b',
          status: '未回答',
          tags: [],
          answerCount: 0,
          createdBy: UIDS.bob,
          visibility: 'shared',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), 'questions/q1/answers/a1'), {
          body: 'answer',
          createdBy: UIDS.alice,
          votes: 0,
          accepted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('未検証ユーザは answers の vote update できない', async () => {
      await env.withSecurityRulesDisabled(async (admin) => {
        await setDoc(doc(admin.firestore(), 'questions/q1'), {
          title: 'q',
          body: 'b',
          status: '未回答',
          tags: [],
          answerCount: 0,
          createdBy: UIDS.bob,
          visibility: 'shared',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await env.withSecurityRulesDisabled(async (admin) => {
        await setDoc(doc(admin.firestore(), 'questions/q1/answers/a1'), {
          body: 'a',
          createdBy: UIDS.bob,
          votes: 0,
          accepted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        updateDoc(doc(ctx.firestore(), 'questions/q1/answers/a1'), {
          votes: 1,
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('未検証ユーザは notes create できない', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), 'notes/n1'), {
          title: 'note',
          purpose: 'p',
          tried: 't',
          result: 'r',
          conclusion: 'c',
          tags: [],
          links: [],
          attachments: [],
          createdBy: UIDS.alice,
          visibility: 'shared',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('未検証ユーザは favorites write できない', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), `favorites/${UIDS.alice}/items/i1`), {
          targetType: 'link',
          targetId: 'l1',
          createdAt: serverTimestamp(),
        }),
      );
    });

    it('未検証ユーザは own profile を update できない（要検証）', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        updateDoc(doc(ctx.firestore(), `users/${UIDS.alice}`), {
          name: 'changed',
          updatedAt: serverTimestamp(),
        }),
      );
    });
  });

  describe('未検証管理者は admin 権限を行使できない', () => {
    beforeEach(async () => {
      // alice を 管理者 として seed（しかし未検証コンテキストで動作確認）
      await seedUser(env, UIDS.alice, '管理者');
    });

    it('未検証の管理者は tags を create できない', async () => {
      const ctx = authedUnverified(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), 'tags/t99'), { name: 'NEW', type: '技術' }),
      );
    });
  });

  describe('削除済みユーザ（verified だが users/{uid} 不在）の書込ブロック', () => {
    // users/{uid} を seed しないこと自体が「削除済み」状態のシミュレーション。
    // verified=true な idToken は持っているが activeUser() の exists() で弾かれる。

    it('削除済みユーザは links create できない', async () => {
      const ctx = authed(env, UIDS.alice); // verified=true, but users/{alice} not seeded
      await assertFails(setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice)));
    });

    it('削除済みユーザは comments create できない', async () => {
      const ctx = authed(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), 'comments/c1'), baseComment(UIDS.alice)),
      );
    });

    it('削除済みユーザは feedbacks create できない', async () => {
      const ctx = authed(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFeedback(UIDS.alice)),
      );
    });

    it('削除済みユーザは favorites write できない', async () => {
      const ctx = authed(env, UIDS.alice);
      await assertFails(
        setDoc(doc(ctx.firestore(), `favorites/${UIDS.alice}/items/i1`), {
          targetType: 'link',
          targetId: 'l1',
          createdAt: serverTimestamp(),
        }),
      );
    });

    it('削除済みユーザは自分の過去 link を update できない', async () => {
      // 過去に投稿した link を seed
      await env.withSecurityRulesDisabled(async (admin) => {
        await setDoc(doc(admin.firestore(), 'links/l1'), baseLink(UIDS.alice));
      });
      // alice の users/{uid} は seed しない（削除済み）
      const ctx = authed(env, UIDS.alice);
      await assertFails(
        updateDoc(doc(ctx.firestore(), 'links/l1'), { summary: 'edited' }),
      );
    });

    it('削除済みユーザは自分の過去 link を delete できない', async () => {
      await env.withSecurityRulesDisabled(async (admin) => {
        await setDoc(doc(admin.firestore(), 'links/l1'), baseLink(UIDS.alice));
      });
      const ctx = authed(env, UIDS.alice);
      await assertFails(deleteDoc(doc(ctx.firestore(), 'links/l1')));
    });
  });

  describe('検証済ユーザは従来通り通過する（regression）', () => {
    beforeEach(async () => {
      await seedUser(env, UIDS.alice);
    });

    it('検証済ユーザは links create できる', async () => {
      const ctx = authed(env, UIDS.alice);
      await assertSucceeds(setDoc(doc(ctx.firestore(), 'links/l1'), baseLink(UIDS.alice)));
    });

    it('検証済ユーザは feedbacks create できる', async () => {
      const ctx = authed(env, UIDS.alice);
      await assertSucceeds(
        setDoc(doc(ctx.firestore(), 'feedbacks/f1'), baseFeedback(UIDS.alice)),
      );
    });
  });
});
