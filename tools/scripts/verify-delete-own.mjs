// 自分の投稿削除 UI のスモークテスト
// - /me に「削除」ボタンが各行に表示される
// - ボタン押下で ConfirmDialog が開く
// - destructive スタイル（赤系）で「削除する」ボタンが出る
// - キャンセルで row 数が変わらない（実削除は手動テストに任せる）

import { chromium } from 'playwright';

const APP = 'http://localhost:3200';

async function login(page, email, password) {
  await page.goto(`${APP}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/$|\/home/);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('1. 木村亮介でログイン');
  await login(page, 'kimura.r@example.ac.jp', 'testtest');

  console.log('2. /me に移動');
  await page.goto(`${APP}/me`);
  await page.waitForSelector('.me-row', { timeout: 60000 });

  const beforeCount = await page.locator('.me-row').count();
  console.log(`   行数: ${beforeCount}`);

  console.log('3. 各行に「削除」ボタンが存在');
  const deleteButtons = page.locator('.me-row .me-actions button:has-text("削除")');
  const btnCount = await deleteButtons.count();
  console.log(`   削除ボタン数: ${btnCount}`);
  if (btnCount === 0) {
    console.log('❌ 削除ボタンが 1 つもない');
    await browser.close();
    process.exit(1);
  }

  console.log('4. 最初の削除ボタン押下 → ConfirmDialog');
  await deleteButtons.first().click();
  await page.waitForSelector('.modal-confirm', { timeout: 5000 });
  const dialogTitle = await page.locator('.modal-title').textContent();
  const hasDeleteVerb = dialogTitle?.includes('削除しますか');
  const destructiveBtn = page.locator('button.btn-destructive:has-text("削除する")');
  const destructiveCount = await destructiveBtn.count();
  console.log(`   ダイアログ: "${dialogTitle}"`);
  console.log(`   destructive ボタン: ${destructiveCount}`);

  console.log('5. キャンセルで閉じる');
  await page.click('button:has-text("キャンセル")');
  await page.waitForSelector('.modal-confirm', { state: 'detached', timeout: 5000 });

  const afterCount = await page.locator('.me-row').count();
  console.log(`   キャンセル後の行数: ${afterCount}`);

  const ok =
    btnCount === beforeCount &&
    hasDeleteVerb === true &&
    destructiveCount === 1 &&
    afterCount === beforeCount;

  console.log(ok ? '\n✅ 削除 UI 動作確認 PASS' : '\n❌ いずれかの条件未達');

  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
