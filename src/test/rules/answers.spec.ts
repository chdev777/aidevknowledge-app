import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { authed, makeEnv, seedUser, UIDS } from './helpers.js';

let env: RulesTestEnvironment;

const baseQuestion = (createdBy: string) => ({
  title: 'PDF RAG のチャンク戦略',
  body: 'チャンクサイズを 256/512/1024 で比較したい',
  status: '未回答',
  tags: ['t1'],
  createdBy,
  visibility: 'shared',
  answerCount: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const baseAnswer = (createdBy: string) => ({
  body: '512くらいが無難です',
  createdBy,
  votes: 0,
  accepted: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

async function seedQuestion(ctxEnv: RulesTestEnvironment, qid: string, owner: string) {
  await ctxEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `questions/${qid}`), baseQuestion(owner));
  });
}

beforeAll(async () => {
  env = await makeEnv();
});
afterAll(async () => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  // activeUser() Rule が users/{uid} の存在を要求するため、書込テスト用に seed
  await seedUser(env, UIDS.alice);
  await seedUser(env, UIDS.bob);
  await seedUser(env, UIDS.carol);
});

describe('answers rules', () => {
  it('回答者は accepted=false で create 可', async () => {
    await seedQuestion(env, 'q1', UIDS.alice);
    const db = authed(env, UIDS.bob).firestore();
    await assertSucceeds(setDoc(doc(db, 'questions/q1/answers/a1'), baseAnswer(UIDS.bob)));
  });

  it('accepted=true での create は拒否', async () => {
    await seedQuestion(env, 'q1', UIDS.alice);
    const db = authed(env, UIDS.bob).firestore();
    const bad = { ...baseAnswer(UIDS.bob), accepted: true };
    await assertFails(setDoc(doc(db, 'questions/q1/answers/a1'), bad));
  });

  it('質問者は accepted=true に切替できる', async () => {
    await seedQuestion(env, 'q1', UIDS.alice);
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), 'questions/q1/answers/a1'),
        baseAnswer(UIDS.bob),
      );
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'questions/q1/answers/a1'), {
        accepted: true,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('質問者でない人が accepted を書き換えると拒否', async () => {
    await seedQuestion(env, 'q1', UIDS.alice);
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), 'questions/q1/answers/a1'),
        baseAnswer(UIDS.bob),
      );
    });
    const db = authed(env, UIDS.carol).firestore();
    await assertFails(
      updateDoc(doc(db, 'questions/q1/answers/a1'), {
        accepted: true,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('votes ±1 の update は許可', async () => {
    await seedQuestion(env, 'q1', UIDS.alice);
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), 'questions/q1/answers/a1'),
        baseAnswer(UIDS.bob),
      );
    });
    const db = authed(env, UIDS.carol).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'questions/q1/answers/a1'), {
        votes: 1,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('votes ±1以上の差分 は拒否', async () => {
    await seedQuestion(env, 'q1', UIDS.alice);
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), 'questions/q1/answers/a1'),
        baseAnswer(UIDS.bob),
      );
    });
    const db = authed(env, UIDS.carol).firestore();
    await assertFails(
      updateDoc(doc(db, 'questions/q1/answers/a1'), {
        votes: 10,
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
