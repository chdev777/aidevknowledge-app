// マイページの URL 行が 3 カラム grid で正しくレイアウトされることを確認
// 修正前: extra.css の `.me-row { grid-template-columns: 1fr auto }` で 2 カラムにされていた
// 修正後: globals.css の `auto 1fr auto` (3 カラム) のみが適用される

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

  await page.goto(`${APP}/me`);
  await page.waitForSelector('.me-row', { timeout: 30000 });

  const rows = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.me-row'));
    return rows.slice(0, 5).map((row) => {
      const cs = getComputedStyle(row);
      const children = Array.from(row.children);
      const rowRect = row.getBoundingClientRect();
      // align-items: center で child の top は高さ差で揃わないので、
      // child が親 row の bounding 内に収まっている = 同行と判定
      const allInsideRow = children.every((c) => {
        const cr = c.getBoundingClientRect();
        return cr.top >= rowRect.top - 1 && cr.bottom <= rowRect.bottom + 1;
      });
      return {
        gridTemplateColumns: cs.gridTemplateColumns,
        columnCount: cs.gridTemplateColumns.trim().split(/\s+/).length,
        childCount: children.length,
        allInsideRow,
        firstClass: children[0]?.className,
        lastClass: children[children.length - 1]?.className,
      };
    });
  });

  console.log(JSON.stringify(rows, null, 2));

  const allOk = rows.every(
    (r) => r.childCount === 3 && r.columnCount === 3 && r.allInsideRow,
  );

  console.log(allOk ? '\n✅ 全行で 3 カラムが正しく適用されている' : '\n❌ 2 カラムに退化している行あり');

  await browser.close();
  process.exit(allOk ? 0 : 1);
})();
