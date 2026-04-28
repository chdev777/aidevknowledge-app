// 一時的な検証スクリプト：お知らせバナー + フィードバック FAB + 管理者タブを E2E で確認
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const ARTIFACTS = 'C:/Users/ipc_administrator/AppData/Local/Temp/announcements-feedback';
mkdirSync(ARTIFACTS, { recursive: true });

const results = [];
function ok(label, detail = '') {
  results.push({ status: 'OK', label, detail });
  console.log(`  ✓ ${label}${detail ? ' — ' + detail : ''}`);
}
function fail(label, detail = '') {
  results.push({ status: 'FAIL', label, detail });
  console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
}
function step(name) {
  console.log(`\n[STEP] ${name}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('dialog', (d) => d.accept().catch(() => {}));

async function login(email, password) {
  await page.goto('http://localhost:3200/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(800);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname === '/' || u.pathname === '', { timeout: 15000 });
  await page.waitForTimeout(1500);
}

async function shot(name) {
  await page.screenshot({ path: `${ARTIFACTS}/${name}.png`, fullPage: false });
}

async function clearStorage() {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('aidev:announcements:lastSeen');
      localStorage.removeItem('aidev:announcements:dismissCount');
    } catch {}
  });
}

const TEST_MESSAGE = `E2E フィードバック ${Date.now()}`;

try {
  // ============================================
  // STEP 1: kimura（一般）でログイン → バナー初表示確認
  // ============================================
  step('1. お知らせバナー初表示');
  await login('kimura.r@example.ac.jp', 'testtest');
  await clearStorage();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await shot('01-home-banner');

  const banner = page.locator('.announcements-banner');
  const bannerCount = await banner.count();
  if (bannerCount === 1) ok('Topbar 直下にお知らせバナー表示');
  else fail(`バナーが ${bannerCount} 件`);

  const role = await banner.first().getAttribute('role');
  if (role === 'alert') ok('role="alert" 付与済');
  else fail(`role 属性: ${role}`);

  // ============================================
  // STEP 2: × 1 回 → 同セッションで非表示
  // ============================================
  step('2. ×ボタン 1 回押下');
  await banner.locator('button[aria-label="閉じる"]').click();
  await page.waitForTimeout(500);
  if ((await page.locator('.announcements-banner').count()) === 0) {
    ok('×1 で同セッション非表示');
  } else fail('×1 後もバナーが見える');

  const dismissCount1 = await page.evaluate(() =>
    parseInt(localStorage.getItem('aidev:announcements:dismissCount') ?? '0', 10),
  );
  if (dismissCount1 === 1) ok('localStorage dismissCount = 1');
  else fail(`dismissCount = ${dismissCount1}`);

  // リロードで再表示
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  if ((await page.locator('.announcements-banner').count()) === 1) {
    ok('リロードで再表示（dismissCount<3）');
  } else fail('リロード後もバナーが出ない');

  // ============================================
  // STEP 3: 「詳しく見る」 → /announcements 遷移 + 既読化
  // ============================================
  step('3. 「詳しく見る」クリック');
  await page.locator('.announcements-banner button:has-text("詳しく見る")').click();
  await page.waitForURL((u) => u.pathname === '/announcements', { timeout: 10000 });
  await page.waitForTimeout(800);
  await shot('03-announcements-page');

  if (page.url().endsWith('/announcements')) ok('/announcements 遷移成功');

  const lastSeen = await page.evaluate(() =>
    localStorage.getItem('aidev:announcements:lastSeen'),
  );
  const dismissCountAfter = await page.evaluate(() =>
    parseInt(localStorage.getItem('aidev:announcements:dismissCount') ?? '0', 10),
  );
  if (lastSeen === '0.4.0') ok(`lastSeen=${lastSeen} に更新`);
  else fail(`lastSeen=${lastSeen}`);
  if (dismissCountAfter === 0) ok('dismissCount リセット (0)');
  else fail(`dismissCount=${dismissCountAfter}`);

  // 一覧にエントリが表示
  const entries = await page.locator('.announcements-entry').count();
  if (entries >= 2) ok(`announcements-entry が ${entries} 件表示`);
  else fail(`announcements-entry が ${entries} 件しかない`);

  // ホームに戻ってバナーが出ない
  await page.goto('http://localhost:3200/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  if ((await page.locator('.announcements-banner').count()) === 0) {
    ok('既読化後、ホームでバナー非表示');
  } else fail('既読化後もバナーが出る');

  // ============================================
  // STEP 4: × 3 回 で完全既読化
  // ============================================
  step('4. ×3 回で完全既読化');
  await clearStorage();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  for (let i = 1; i <= 3; i++) {
    const b = page.locator('.announcements-banner');
    if ((await b.count()) === 0) {
      fail(`× ${i} 回目: バナーが既に出ていない`);
      break;
    }
    await b.locator('button[aria-label="閉じる"]').click();
    await page.waitForTimeout(300);
    if (i < 3) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
    }
  }
  const finalDismissCount = await page.evaluate(() =>
    parseInt(localStorage.getItem('aidev:announcements:dismissCount') ?? '0', 10),
  );
  const finalLastSeen = await page.evaluate(() =>
    localStorage.getItem('aidev:announcements:lastSeen'),
  );
  if (finalDismissCount === 3) ok(`dismissCount=3`);
  else fail(`dismissCount=${finalDismissCount}`);
  if (finalLastSeen === '0.4.0') ok(`×3 で lastSeen も更新 (${finalLastSeen})`);
  else fail(`lastSeen=${finalLastSeen}`);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  if ((await page.locator('.announcements-banner').count()) === 0) {
    ok('リロード後もバナー非表示（完全既読）');
  } else fail('リロード後もバナーが出る');

  // ============================================
  // STEP 5: Sidebar の「お知らせ」リンク + 未読バッジ
  // ============================================
  step('5. Sidebar の「お知らせ」リンク');
  // 未読バッジは既読化済みなので表示されないはず
  const sidebarAnn = page.locator('.sidebar a:has-text("お知らせ")');
  if ((await sidebarAnn.count()) === 1) ok('Sidebar に「お知らせ」リンク');
  else fail('Sidebar に「お知らせ」リンクなし');

  // 未読リセットしたら badge が出る
  await clearStorage();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const badge = page.locator('.sidebar a:has-text("お知らせ") .nav-count');
  const badgeText = (await badge.textContent().catch(() => null)) ?? '';
  if (badgeText.trim() === '1') ok(`未読バッジ表示: ${badgeText.trim()}`);
  else fail(`未読バッジ: "${badgeText}"`);

  // ============================================
  // STEP 6: Feedback FAB が右下に表示
  // ============================================
  step('6. Feedback FAB が右下に表示');
  const fab = page.locator('.feedback-fab');
  if ((await fab.count()) === 1) ok('FAB 表示');
  else fail('FAB なし');

  // 位置確認: Tweaks の上にあるか
  const fabBox = await fab.boundingBox();
  const tweaksBox = await page.locator('.tweaks-toggle').boundingBox();
  if (fabBox && tweaksBox && fabBox.y < tweaksBox.y) {
    ok(`FAB は Tweaks の上に配置（feedback y=${Math.round(fabBox.y)}, tweaks y=${Math.round(tweaksBox.y)}）`);
  } else fail('FAB が Tweaks の上にない');

  // ============================================
  // STEP 7: フィードバック送信
  // ============================================
  step('7. フィードバック送信');
  await fab.click();
  await page.waitForTimeout(300);

  const panel = page.locator('.feedback-panel');
  if ((await panel.count()) === 1) ok('パネル展開');
  else fail('パネル展開せず');

  // カテゴリ「バグ報告」を選択
  await panel.locator('.feedback-cat:has-text("バグ報告")').click();
  await page.waitForTimeout(150);

  await panel.locator('textarea').fill(TEST_MESSAGE);
  await page.waitForTimeout(150);
  await panel.locator('button[type="submit"]:has-text("送信")').click();

  // 送信成功画面を待つ
  await page.waitForSelector('.feedback-sent', { timeout: 8000 }).catch(() => {});
  if ((await page.locator('.feedback-sent').count()) === 1) {
    ok('送信成功表示');
  } else fail('送信成功画面が出ない');

  // 自動クローズ待ち
  await page.waitForTimeout(3000);
  if ((await page.locator('.feedback-panel').count()) === 0) {
    ok('2.5 秒後に自動クローズ');
  } else fail('自動クローズせず');

  // ============================================
  // STEP 8: 管理者で /admin?tab=feedback を確認
  // ============================================
  step('8. 管理者でフィードバックタブ確認');
  // ログアウト
  await page.locator('button:has-text("ログアウト")').first().click().catch(() => {});
  await page.waitForURL((u) => u.pathname === '/login', { timeout: 10000 });
  await login('sato.k@example.ac.jp', 'testtest');

  await page.goto('http://localhost:3200/admin?tab=feedback', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  await page.waitForTimeout(1500);
  await shot('08-admin-feedback');

  const fbTab = page.locator('.me-tab:has-text("フィードバック")');
  if ((await fbTab.count()) === 1) ok('5 つ目のタブ「フィードバック」表示');

  const fbRow = page.locator('.admin-row-feedback').filter({ hasText: TEST_MESSAGE });
  if ((await fbRow.count()) === 1) ok('テスト送信したフィードバック行が表示');
  else fail(`フィードバック行が ${await fbRow.count()} 件`);

  // ============================================
  // STEP 9: ステータスを new → acknowledged に進める
  // ============================================
  step('9. ステータス変更（new → acknowledged）');
  await fbRow.locator('select').selectOption('acknowledged');
  await page.waitForTimeout(2000);

  // 一覧再取得後、ステータスが「確認済み」になっているか
  // value は 'acknowledged'
  const newSelectValue = await fbRow.locator('select').inputValue();
  if (newSelectValue === 'acknowledged') ok(`ステータス更新: ${newSelectValue}`);
  else fail(`ステータス: ${newSelectValue}`);

  // ============================================
  // STEP 10: 監査ログタブで set_feedback_status が記録されている
  // ============================================
  step('10. 監査ログに set_feedback_status 記録');
  await page.locator('.me-tab:has-text("監査ログ")').click();
  await page.waitForTimeout(1500);

  const logBadges = await page.locator('.admin-row .badge:has-text("フィードバック状態変更")').count();
  if (logBadges >= 1) ok(`監査ログに ${logBadges} 件の「フィードバック状態変更」記録`);
  else fail('フィードバック状態変更ログが見つからない');

  await shot('10-admin-logs');
} catch (err) {
  console.error('FATAL:', err.message);
  await shot('99-fatal').catch(() => {});
} finally {
  console.log('\n===== SUMMARY =====');
  const okCount = results.filter((r) => r.status === 'OK').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`OK: ${okCount} / FAIL: ${failCount} / TOTAL: ${results.length}`);
  if (failCount > 0) {
    console.log('\n--- FAILURES ---');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  ✗ ${r.label} — ${r.detail}`));
  }
  if (consoleErrors.length > 0) {
    console.log(`\n--- CONSOLE ERRORS (${consoleErrors.length}) ---`);
    consoleErrors.slice(0, 5).forEach((e) => console.log('  ', e.slice(0, 200)));
  }
  writeFileSync(`${ARTIFACTS}/results.json`, JSON.stringify({ results, consoleErrors }, null, 2));
  console.log(`\nArtifacts: ${ARTIFACTS}`);
  await browser.close();
  process.exit(failCount > 0 ? 1 : 0);
}
