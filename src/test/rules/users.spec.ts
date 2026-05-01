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
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { authed, makeEnv, seedUser, UIDS } from './helpers.js';

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

  it('管理者は他者の role を変更できる', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await seedUser(env, UIDS.bob, 'DX推進');
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(
      updateDoc(doc(db, `users/${UIDS.bob}`), {
        role: '情報支援',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('管理者は他者を管理者に昇格できる', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await seedUser(env, UIDS.bob, 'DX推進');
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(
      updateDoc(doc(db, `users/${UIDS.bob}`), {
        role: '管理者',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('管理者でも他者の handle 変更は拒否', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await seedUser(env, UIDS.bob, 'DX推進');
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      updateDoc(doc(db, `users/${UIDS.bob}`), {
        handle: 'evil',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('一般ユーザーは他者の role を変更できない', async () => {
    await seedUser(env, UIDS.alice, 'DX推進');
    await seedUser(env, UIDS.bob, 'DX推進');
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(
      updateDoc(doc(db, `users/${UIDS.bob}`), {
        role: '管理者',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('管理者は他者の users/{uid} を削除できる', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await seedUser(env, UIDS.bob, 'DX推進');
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(deleteDoc(doc(db, `users/${UIDS.bob}`)));
  });

  it('管理者でも自分自身の users/{uid} は削除できない', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(deleteDoc(doc(db, `users/${UIDS.alice}`)));
  });

  it('一般ユーザーは他者の users/{uid} を削除できない', async () => {
    await seedUser(env, UIDS.alice, 'DX推進');
    await seedUser(env, UIDS.bob, 'DX推進');
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(deleteDoc(doc(db, `users/${UIDS.bob}`)));
  });

  it('管理者は他者の private/profile を削除できる（user 削除のクリーンアップ）', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${UIDS.bob}/private/profile`), {
        email: 'bob@example.ac.jp',
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(deleteDoc(doc(db, `users/${UIDS.bob}/private/profile`)));
  });

  it('本人は自分の private/profile を削除できる', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${UIDS.alice}/private/profile`), {
        email: 'alice@example.ac.jp',
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(deleteDoc(doc(db, `users/${UIDS.alice}/private/profile`)));
  });

  it('一般ユーザーは他者の private/profile を削除できない', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${UIDS.bob}/private/profile`), {
        email: 'bob@example.ac.jp',
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(deleteDoc(doc(db, `users/${UIDS.bob}/private/profile`)));
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

  it('管理者は handle を削除できる（user 不在時のみ）', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    // bob の users/{uid} は seed しない（既に削除済み相当）
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'handles/bob'), {
        uid: UIDS.bob,
        createdAt: serverTimestamp(),
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'handles/bob')));
  });

  it('管理者でも生きているユーザの handle は削除できない（誤削除防止）', async () => {
    await seedUser(env, UIDS.alice, '管理者');
    await seedUser(env, UIDS.bob, 'DX推進'); // bob は生きている
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'handles/bob'), {
        uid: UIDS.bob,
        createdAt: serverTimestamp(),
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(deleteDoc(doc(db, 'handles/bob')));
  });

  it('一般ユーザーは handle を削除できない', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'handles/bob'), {
        uid: UIDS.bob,
        createdAt: serverTimestamp(),
      });
    });
    const db = authed(env, UIDS.alice).firestore();
    await assertFails(deleteDoc(doc(db, 'handles/bob')));
  });
});
