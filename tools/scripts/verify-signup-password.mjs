// SignupPage のパスワード確認入力欄 + 表示トグルが正しく動作することを検証
// シナリオ:
//   1. /signup ページが表示され、パスワード入力欄が 2 つあること
//   2. 初期状態では両方とも type="password"（マスク）
//   3. 表示トグル押下で両方が type="text" に変わる（共有 toggle）
//   4. 異なる値を入力すると赤メッセージ + submit disabled
//   5. 同じ値を入力すると緑メッセージ + submit enabled
//   6. 確認欄が空のときは hint が中立（ok/ng クラス無し）

import { chromium } from 'playwright';

const APP = 'http://localhost:3200';

const results = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const mark = ok ? '✅' : '❌';
  console.log(`  ${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  console.log('=== SignupPage パスワード機能の検証 ===\n');

  // 1. /signup ページ表示
  console.log('[1] /signup ページ読み込み');
  const resp = await page.goto(`${APP}/signup`, { waitUntil: 'networkidle' });
  record('/signup が 200 を返す', resp?.status() === 200, `status=${resp?.status()}`);

  // パスワード入力欄が 2 つあること
  const passwordInputs = await page.locator('input[autocomplete="new-password"]').all();
  record(
    'パスワード input が 2 つ存在',
    passwordInputs.length === 2,
    `count=${passwordInputs.length}`,
  );

  // 2. 初期状態は type="password"
  console.log('\n[2] 初期マスク状態');
  const types0 = await Promise.all(passwordInputs.map((i) => i.getAttribute('type')));
  record('両 input が type="password"', types0.every((t) => t === 'password'), `types=${JSON.stringify(types0)}`);

  // 3. 表示トグルで text 切替（1 個目押下で両方変わる = 共有 toggle）
  console.log('\n[3] 表示トグル（共有切替）');
  const toggles = await page.locator('.auth-password-toggle').all();
  record('toggle ボタンが 2 つ存在', toggles.length === 2, `count=${toggles.length}`);

  await toggles[0].click();
  await page.waitForTimeout(50);
  const typesAfter = await Promise.all(passwordInputs.map((i) => i.getAttribute('type')));
  record(
    '1 個目 toggle 押下で両方が type="text"',
    typesAfter.every((t) => t === 'text'),
    `types=${JSON.stringify(typesAfter)}`,
  );

  // 元に戻す
  await toggles[0].click();
  await page.waitForTimeout(50);
  const typesBack = await Promise.all(passwordInputs.map((i) => i.getAttribute('type')));
  record(
    'もう一度押下で両方が type="password" に戻る',
    typesBack.every((t) => t === 'password'),
    `types=${JSON.stringify(typesBack)}`,
  );

  // 必須他フィールドを埋めて submit ボタンの enabled/disabled を観察可能にする
  await page.fill('input[autocomplete="email"]', 'verify-pw@example.com');
  await page.locator('label.auth-field').filter({ hasText: '氏名' }).locator('input').fill('検証太郎');
  await page.locator('label.auth-field').filter({ hasText: 'ハンドル名' }).locator('input').fill('verifypw');

  // 4. 不一致時
  console.log('\n[4] 不一致時');
  await passwordInputs[0].fill('password123');
  await passwordInputs[1].fill('password999');
  await page.waitForTimeout(50);

  const hint1 = await page.locator('#password-confirm-hint').first();
  const hintText1 = (await hint1.textContent()) ?? '';
  const hintClass1 = (await hint1.getAttribute('class')) ?? '';
  record(
    '不一致メッセージが表示',
    hintText1.includes('一致しません'),
    `text="${hintText1.trim()}"`,
  );
  record('hint に is-ng クラス', hintClass1.includes('is-ng'), `class="${hintClass1}"`);

  const submitDisabled1 = await page.locator('button[type="submit"]').isDisabled();
  record('submit ボタンが disabled', submitDisabled1 === true, `disabled=${submitDisabled1}`);

  const ariaInvalid = await passwordInputs[1].getAttribute('aria-invalid');
  record('確認 input に aria-invalid="true"', ariaInvalid === 'true', `aria-invalid=${ariaInvalid}`);

  // 5. 一致時
  console.log('\n[5] 一致時');
  await passwordInputs[1].fill('password123');
  await page.waitForTimeout(50);

  const hintText2 = (await hint1.textContent()) ?? '';
  const hintClass2 = (await hint1.getAttribute('class')) ?? '';
  record(
    '一致メッセージが表示',
    hintText2.includes('一致しています'),
    `text="${hintText2.trim()}"`,
  );
  record('hint に is-ok クラス', hintClass2.includes('is-ok'), `class="${hintClass2}"`);

  const submitDisabled2 = await page.locator('button[type="submit"]').isDisabled();
  record('submit ボタンが enabled', submitDisabled2 === false, `disabled=${submitDisabled2}`);

  // 6. 確認欄を空にすると中立
  console.log('\n[6] 確認欄空欄時');
  await passwordInputs[1].fill('');
  await page.waitForTimeout(50);
  const hintClass3 = (await hint1.getAttribute('class')) ?? '';
  record(
    'hint が中立（is-ok / is-ng なし）',
    !hintClass3.includes('is-ok') && !hintClass3.includes('is-ng'),
    `class="${hintClass3}"`,
  );
  const submitDisabled3 = await page.locator('button[type="submit"]').isDisabled();
  record('空欄では submit disabled', submitDisabled3 === true, `disabled=${submitDisabled3}`);

  // aria-pressed
  console.log('\n[7] アクセシビリティ');
  const ariaPressed = await toggles[0].getAttribute('aria-pressed');
  record(
    'toggle 初期状態 aria-pressed="false"',
    ariaPressed === 'false',
    `aria-pressed=${ariaPressed}`,
  );

  await browser.close();

  console.log('\n=== サマリ ===');
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`${passed}/${total} PASS`);
  if (passed !== total) {
    console.log('\n失敗したケース:');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
    process.exit(1);
  }
})().catch((err) => {
  console.error('検証中にエラー:', err);
  process.exit(1);
});
