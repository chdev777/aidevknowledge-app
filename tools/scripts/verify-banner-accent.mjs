// お知らせバナーがアクセント色に追従することを検証
// 各アクセント（amber / indigo / forest）で border-color の oklch hue が変わることを確認

import { chromium } from 'playwright';

const APP = 'http://localhost:3200';

async function login(page, email, password) {
  await page.goto(`${APP}/login`);
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/$|\/home/);
}

function parseHue(oklchStr) {
  // 例: "oklch(0.58 0.14 55)" → 55
  const m = oklchStr.match(/oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)/);
  return m ? Number(m[1]) : null;
}

async function setAccent(page, accent) {
  await page.evaluate((a) => {
    const cur = JSON.parse(localStorage.getItem('aidev:tweaks:v1') || '{}');
    cur.accent = a;
    localStorage.setItem('aidev:tweaks:v1', JSON.stringify(cur));
    document.body.dataset.accent = a;
  }, accent);
  await page.waitForTimeout(100);
}

async function readBannerColors(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.announcements-banner');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      borderColor: cs.borderColor,
      color: cs.color,
      background: cs.backgroundColor,
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await login(page, 'sato.k@example.ac.jp', 'testtest');
  await page.waitForSelector('.announcements-banner', { timeout: 5000 });

  const results = {};
  for (const accent of ['amber', 'indigo', 'forest']) {
    await setAccent(page, accent);
    results[accent] = await readBannerColors(page);
  }

  console.log(JSON.stringify(results, null, 2));

  // 期待: hue が異なること（amber=55, indigo=265, forest=155）
  const hues = {
    amber: parseHue(results.amber.borderColor),
    indigo: parseHue(results.indigo.borderColor),
    forest: parseHue(results.forest.borderColor),
  };
  console.log('\nborder hues:', hues);

  const distinct = new Set(Object.values(hues)).size === 3;
  console.log(distinct ? '✅ アクセントごとに border 色が変化' : '❌ border 色が同一（バグ未修正）');

  await browser.close();
  process.exit(distinct ? 0 : 1);
})();
