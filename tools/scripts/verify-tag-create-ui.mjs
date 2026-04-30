// 管理者画面のタグタブで「新規タグ」ボタンが見える / クリックできる / フォームが出るかを確認

import { chromium } from 'playwright';

const APP = 'http://localhost:3200';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${APP}/login`);
  await page.fill('input[type="email"]', 'sato.k@example.ac.jp');
  await page.fill('input[type="password"]', 'testtest');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/$|\/home/);

  await page.goto(`${APP}/admin?tab=tags`);
  await page.waitForSelector('.admin-section', { timeout: 60000 });
  await page.waitForTimeout(800);

  const ss = `C:/Users/ipc_administrator/AppData/Local/Temp/tags-tab.png`;
  await page.screenshot({ path: ss, fullPage: true });
  console.log('SS:', ss);

  // 「新規タグ」ボタンを探す
  const newBtn = page.locator('button:has-text("新規タグ")');
  const newBtnCount = await newBtn.count();
  console.log(`'新規タグ' ボタン数: ${newBtnCount}`);

  if (newBtnCount > 0) {
    const isVisible = await newBtn.first().isVisible();
    const box = await newBtn.first().boundingBox();
    console.log(`isVisible: ${isVisible}`);
    console.log(`box:`, box);

    // クリックしてフォームが出るか
    await newBtn.first().click();
    await page.waitForTimeout(300);
    const formVisible = await page.locator('form.admin-row-form').isVisible().catch(() => false);
    console.log(`フォーム表示: ${formVisible}`);

    const ss2 = `C:/Users/ipc_administrator/AppData/Local/Temp/tags-tab-after-click.png`;
    await page.screenshot({ path: ss2, fullPage: true });
    console.log('SS2:', ss2);
  }

  // FilterBar や toolbar のレイアウトを確認
  const toolbar = await page
    .locator('.admin-toolbar')
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el);
      const children = Array.from(el.children).map((c) => ({
        tag: c.tagName,
        class: c.className,
        text: (c.textContent ?? '').slice(0, 40),
        rect: c.getBoundingClientRect(),
      }));
      return {
        display: cs.display,
        flexDirection: cs.flexDirection,
        justifyContent: cs.justifyContent,
        children,
      };
    });
  console.log('toolbar:', JSON.stringify(toolbar, null, 2));

  await browser.close();
})();
