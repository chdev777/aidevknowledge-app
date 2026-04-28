// 一時的な検証スクリプト：管理画面の本実装を E2E で確認
//
// 検証対象（順番）：
// 1. sato.k（管理者）でログイン → Sidebar に「管理」が出る
// 2. /admin → タブ 3 種が出る
// 3. UsersTab：matsuoka を 管理者 に昇格 → 管理者 → 情報支援 に降格
// 4. TagsTab：新規タグ作成 → 編集 → 削除
// 5. ModerationTab：他人 link を管理者削除 → admin_logs に記録される
// 6. ログアウト → matsuoka でログイン → Sidebar に「管理」が出ない / /admin が警告
//
// 使い方:
//   node tools/scripts/verify-admin.mjs
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const ARTIFACTS = 'C:/Users/ipc_administrator/AppData/Local/Temp/admin-verify';
mkdirSync(ARTIFACTS, { recursive: true });

const results = [];
const consoleErrors = [];
const pageErrors = [];

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

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => pageErrors.push(err.message));
// confirm/alert を自動で OK
page.on('dialog', (d) => {
  console.log(`  [dialog ${d.type()}] ${d.message()}`);
  d.accept().catch(() => {});
});

async function login(email, password) {
  await page.goto('http://localhost:3200/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname === '/' || u.pathname === '', { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(800);
}

async function logout() {
  // Topbar のログアウトボタン
  await page.locator('button:has-text("ログアウト")').first().click().catch(() => {});
  await page.waitForURL((u) => u.pathname === '/login', { timeout: 10000 });
}

async function shot(name) {
  await page.screenshot({ path: `${ARTIFACTS}/${name}.png`, fullPage: true });
}

try {
  // ============================================
  // STEP 1: sato.k（管理者）でログイン
  // ============================================
  step('1. sato.k でログイン → Sidebar 確認');
  await login('sato.k@example.ac.jp', 'testtest');
  await shot('01-home-as-sato');

  const sidebarAdmin = page.locator('.sidebar a:has-text("管理")');
  if (await sidebarAdmin.count() > 0) ok('Sidebar に「管理」リンク表示');
  else fail('Sidebar に「管理」リンクが見つからない');

  // ============================================
  // STEP 2: /admin → タブ 3 種が出る
  // ============================================
  step('2. /admin にアクセス → タブ 3 種');
  await sidebarAdmin.first().click();
  await page.waitForURL((u) => u.pathname === '/admin', { timeout: 10000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(500);
  await shot('02-admin-users');

  for (const tab of ['ユーザー', 'タグ', 'モデレーション']) {
    const t = page.locator(`.me-tab:has-text("${tab}")`);
    if (await t.count() > 0) ok(`タブ表示: ${tab}`);
    else fail(`タブが見えない: ${tab}`);
  }

  // ============================================
  // STEP 3: UsersTab - 松岡をロール変更
  // ============================================
  step('3. UsersTab でロール変更');
  await page.locator('.me-tab:has-text("ユーザー")').click();
  await page.waitForTimeout(500);

  // 行の存在確認
  const matsuokaRow = page.locator('.admin-row').filter({ hasText: '@matsuoka.m' });
  const satoRow = page.locator('.admin-row').filter({ hasText: '@sato.k' });

  if (await matsuokaRow.count() === 1) ok('matsuoka 行が1件表示');
  else fail(`matsuoka 行が ${await matsuokaRow.count()} 件`);

  if (await satoRow.count() === 1) {
    // 自分の行は disabled
    const selfDisabled = await satoRow.locator('select').first().isDisabled();
    if (selfDisabled) ok('自分（sato）の role セレクトは disabled');
    else fail('自分の role セレクトが disabled になっていない');
  }

  // 松岡を「管理者」に昇格
  await matsuokaRow.locator('select').first().selectOption('管理者');
  await page.waitForTimeout(1500);

  // 反映確認（再 fetch されたか）
  const matsuokaAfterPromote = await matsuokaRow.locator('select').first().inputValue();
  if (matsuokaAfterPromote === '管理者') ok('matsuoka を管理者に昇格成功');
  else fail(`昇格失敗: 現状 = ${matsuokaAfterPromote}`);

  await shot('03-users-after-promote');

  // 松岡を「情報支援」に戻す（admin が 2 → 1 になる、まだ自分が admin だから OK）
  await matsuokaRow.locator('select').first().selectOption('情報支援');
  await page.waitForTimeout(1500);
  const matsuokaAfterDemote = await matsuokaRow.locator('select').first().inputValue();
  if (matsuokaAfterDemote === '情報支援') ok('matsuoka を情報支援に降格成功');
  else fail(`降格失敗: 現状 = ${matsuokaAfterDemote}`);

  // ============================================
  // STEP 4: TagsTab - 新規タグ CRUD
  // ============================================
  step('4. TagsTab で新規タグ CRUD');
  await page.locator('.me-tab:has-text("タグ")').click();
  await page.waitForTimeout(500);
  await shot('04a-tags-list');

  const tagsBefore = await page.locator('.admin-row').count();

  // 新規タグボタン
  await page.locator('button:has-text("新規タグ")').click();
  await page.waitForTimeout(300);
  await page.locator('input[placeholder*="タグ名"]').fill('E2Eテスト');
  // type select は admin-row-form 内
  const formTypeSelect = page.locator('.admin-row-form select');
  await formTypeSelect.selectOption('技術');
  await page.locator('button[type="submit"]:has-text("保存")').click();
  await page.waitForTimeout(1500);

  // 追加された確認
  const created = page.locator('.admin-row').filter({ hasText: 'E2Eテスト' });
  if (await created.count() >= 1) ok('タグ作成成功 (E2Eテスト)');
  else fail(`タグ作成失敗。row 数 = ${await page.locator('.admin-row').count()}`);

  await shot('04b-tags-after-create');

  // 編集
  await created.locator('button:has-text("編集")').first().click();
  await page.waitForTimeout(300);
  const editingForm = page.locator('.admin-row-form');
  await editingForm.locator('input').fill('E2E更新後');
  await editingForm.locator('button[type="submit"]:has-text("保存")').click();
  await page.waitForTimeout(1500);
  const updated = page.locator('.admin-row').filter({ hasText: 'E2E更新後' });
  if (await updated.count() >= 1) ok('タグ更新成功 (E2E更新後)');
  else fail('タグ更新失敗');

  // 削除
  await updated.locator('button:has-text("削除")').first().click();
  await page.waitForTimeout(300);
  await page.locator('.modal-confirm button:has-text("削除する")').click();
  await page.waitForTimeout(1500);
  const afterDelete = page.locator('.admin-row').filter({ hasText: 'E2E更新後' });
  if (await afterDelete.count() === 0) ok('タグ削除成功');
  else fail('タグ削除失敗');

  await shot('04c-tags-after-delete');

  // ============================================
  // STEP 5: ModerationTab - 共有 link 削除 + ログ確認
  // ============================================
  step('5. ModerationTab で link 削除');
  await page.locator('.me-tab:has-text("モデレーション")').click();
  await page.waitForTimeout(800);
  await shot('05a-moderation-list');

  const linkRows = page.locator('.admin-mod-row').filter({ has: page.locator('.link-row') });
  const linkCountBefore = await linkRows.count();
  if (linkCountBefore > 0) ok(`shared link が ${linkCountBefore} 件表示`);
  else fail('shared link が 0 件');

  // 1 件目を「管理者削除」
  if (linkCountBefore > 0) {
    const firstLinkTitle = await linkRows.first().locator('.link-title').textContent();
    await linkRows.first().locator('button:has-text("管理者削除")').click();
    await page.waitForTimeout(300);
    await page.locator('.modal-confirm button:has-text("削除する")').click();
    await page.waitForTimeout(2000);
    const linkCountAfter = await page.locator('.admin-mod-row').filter({ has: page.locator('.link-row') }).count();
    if (linkCountAfter === linkCountBefore - 1) ok(`link 削除成功（"${firstLinkTitle}" / 残 ${linkCountAfter} 件）`);
    else fail(`link 削除後の件数異常: ${linkCountAfter} (期待 ${linkCountBefore - 1})`);
  }

  // 直近の管理操作セクションを確認
  await page.waitForTimeout(500);
  const logsSection = page.locator('.admin-logs');
  if (await logsSection.count() > 0) {
    const logRows = logsSection.locator('.admin-row');
    const logCount = await logRows.count();
    if (logCount > 0) ok(`admin_logs に ${logCount} 件記録`);
    else fail('admin_logs が空（セクションは存在）');
  } else {
    fail('admin_logs セクションが見つからない');
  }

  await shot('05b-moderation-after-delete');

  // ============================================
  // STEP 6: ログアウト → matsuoka でログイン → Sidebar / /admin
  // ============================================
  step('6. matsuoka（一般）でログイン → ガード確認');
  await logout();
  await login('matsuoka.m@example.ac.jp', 'testtest');
  await shot('06a-home-as-matsuoka');

  const sidebarAdminAsM = page.locator('.sidebar a:has-text("管理")');
  if (await sidebarAdminAsM.count() === 0) ok('Sidebar に「管理」リンク非表示（一般ユーザー）');
  else fail('一般ユーザーに「管理」リンクが見えてしまう');

  // 直叩き
  await page.goto('http://localhost:3200/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  const warning = page.locator('text=管理者権限が必要');
  if (await warning.count() > 0) ok('/admin 直叩き → 警告表示');
  else fail('/admin 直叩きで警告が出ない');

  await shot('06b-admin-guarded');
} catch (err) {
  console.error('FATAL:', err.message);
  await shot('99-fatal').catch(() => {});
} finally {
  // サマリ
  console.log('\n===== SUMMARY =====');
  const okCount = results.filter((r) => r.status === 'OK').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`OK: ${okCount} / FAIL: ${failCount} / TOTAL: ${results.length}`);
  if (failCount > 0) {
    console.log('\n--- FAILURES ---');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  ✗ ${r.label} — ${r.detail}`));
  }
  if (consoleErrors.length > 0) {
    console.log('\n--- CONSOLE ERRORS ---');
    consoleErrors.forEach((e) => console.log('  ', e));
  }
  if (pageErrors.length > 0) {
    console.log('\n--- PAGE ERRORS ---');
    pageErrors.forEach((e) => console.log('  ', e));
  }
  writeFileSync(`${ARTIFACTS}/results.json`, JSON.stringify({ results, consoleErrors, pageErrors }, null, 2));
  console.log(`\nArtifacts: ${ARTIFACTS}`);
  await browser.close();
  process.exit(failCount > 0 ? 1 : 0);
}
