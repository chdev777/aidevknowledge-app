// 一時的な検証スクリプト：主要フローを E2E で確認
//
// 検証フロー（順番）:
// 1. kimura でログイン
// 2. /links?compose=link で URL を共有（タイトル + コメント）
// 3. 作成された詳細ページに遷移している
// 4. 詳細ページでお気に入り ON / OFF / ON
// 5. 詳細ページでコメント投稿
// 6. /me に遷移して「お気に入り」タブで作成 link が見える
// 7. /me の自分の URL タブで visibility を private に切替 → /links から消える
// 8. /me の「下書き」タブを表示（中身があれば一覧、なければ EmptyState）
//
// 使い方: node tools/scripts/verify-flows.mjs
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const ARTIFACTS = 'C:/Users/ipc_administrator/AppData/Local/Temp/flows-verify';
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
  await page.screenshot({ path: `${ARTIFACTS}/${name}.png`, fullPage: true });
}

const TS = Date.now();
const TEST_TITLE = `E2E動作確認 ${TS}`;
const TEST_URL = `https://example.com/e2e-${TS}`;
const TEST_COMMENT = `flow テストコメント ${TS}`;

try {
  // ============================================
  // STEP 0: 既存 link l1（c4 コメント有り）でコメントが表示されることを先に確認
  // ============================================
  step('0. 既存 link l1 で seed コメント c4 が見えること');
  await login('kimura.r@example.ac.jp', 'testtest');
  // Firestore のリクエストをキャプチャ
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('firestore') && url.includes('Listen')) {
      console.log(`  [net] ${resp.status()} ${url.slice(0, 80)}`);
    }
  });
  await page.goto('http://localhost:3200/links/l1', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);
  const seedCommentCount = await page.locator('.comment-item').count();
  if (seedCommentCount > 0) ok(`既存 link で seed コメント表示 (${seedCommentCount} 件)`);
  else fail(`既存 link で seed コメントが見えない (count=${seedCommentCount})`);
  // 詳細: 該当ページの console.log とエラーをまとめてダンプ
  console.log(`  [debug] /links/l1 console errors so far:`);
  consoleErrors.slice(-10).forEach((e) => console.log('     ', e.slice(0, 200)));

  // ============================================
  // STEP 1-2: kimura でログイン → compose で link 投稿
  // ============================================
  step('1-2. compose で link 投稿');

  await page.goto('http://localhost:3200/links?compose=link', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  await page.waitForSelector('.compose-modal', { timeout: 10000 });
  await page.waitForTimeout(500);
  await shot('01-compose-open');

  // form 内の input/textarea を順に埋める
  const formScope = page.locator('.compose-form');
  await formScope.locator('input[type="url"]').fill(TEST_URL);
  await formScope.locator('input[type="url"]').blur();
  await formScope.locator('input').nth(1).fill(TEST_TITLE); // title (2 番目の input は textarea ではなく title input)

  // 共有を選択：visibility-radio フィールドセット内の "共有" ラベルをクリック
  await formScope.locator('.visibility-radio label:has-text("共有")').click();

  // 共有コメント
  await formScope.locator('textarea').nth(1).fill(`E2E自動テスト by kimura ${TS}`);

  await shot('02-compose-filled');
  // 「投稿」ボタンを押す
  await formScope.locator('button[type="submit"]').click();

  // 詳細ページに遷移するまで待つ
  await page.waitForURL(/\/links\/[A-Za-z0-9]+/, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot('03-link-detail');

  const linkUrl = page.url();
  const linkId = linkUrl.match(/\/links\/([^/?]+)/)?.[1];
  if (linkId) ok(`link 作成 → 詳細ページ遷移成功`, linkId);
  else fail('link 作成後の URL から id 取得できず', linkUrl);

  // タイトルが表示されているか
  const titleVisible = await page.locator(`text=${TEST_TITLE}`).count();
  if (titleVisible > 0) ok('詳細ページにタイトル表示');
  else fail(`詳細にタイトルが見つからない (${TEST_TITLE})`);

  // ============================================
  // STEP 3: お気に入り ON
  // ============================================
  step('3. お気に入り ON / OFF / ON');
  const favBtn = page.locator('button:has-text("お気に入り")').first();
  await favBtn.click();
  await page.waitForTimeout(800);
  const favPressed1 = await page.locator('button:has-text("お気に入り済")').count();
  if (favPressed1 > 0) ok('お気に入り ON 成功');
  else fail('お気に入り ON 失敗');

  // OFF
  await page.locator('button:has-text("お気に入り済")').first().click();
  await page.waitForTimeout(800);
  const favPressed2 = await page.locator('button:has-text("お気に入り済")').count();
  if (favPressed2 === 0) ok('お気に入り OFF 成功');
  else fail('お気に入り OFF 失敗');

  // 再度 ON（後続テスト用）
  await page.locator('button:has-text("お気に入り")').first().click();
  await page.waitForTimeout(800);

  // ============================================
  // STEP 4: コメント投稿
  // ============================================
  step('4. コメント投稿');
  await page.locator('.comment-composer textarea').fill(TEST_COMMENT);
  await page.locator('.comment-composer button[type="submit"]:has-text("投稿")').click();
  // 投稿成功で textarea がクリアされるのを待つ
  await page.waitForFunction(
    () => (document.querySelector('.comment-composer textarea')?.value ?? 'x') === '',
    null,
    { timeout: 10000 },
  );
  // 投稿後すぐの状態でコメントリスト確認（refetch が同タブで反映されるはず）
  await page.waitForTimeout(2500);
  let commentVisible = await page.locator('.comment-item').filter({ hasText: TEST_COMMENT }).count();
  if (commentVisible === 0) {
    // フォールバック: ページをリロードしてもう一度
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    commentVisible = await page.locator('.comment-item').filter({ hasText: TEST_COMMENT }).count();
  }
  if (commentVisible > 0) ok('コメント投稿成功');
  else {
    const allComments = await page.locator('.comment-item').count();
    const empty = await page.locator('text=まだコメントはありません').count();
    fail(`コメント投稿後に見えない (.comment-item=${allComments}, EmptyState=${empty}, url=${page.url()})`);
  }

  await shot('04-after-comment');

  // ============================================
  // STEP 5: MyPage お気に入りタブ
  // ============================================
  step('5. MyPage お気に入りタブで対象 link が表示');
  await page.goto('http://localhost:3200/me', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);

  const favTab = page.locator('.me-tab:has-text("お気に入り")');
  await favTab.click();
  await page.waitForTimeout(1500);
  await shot('05-me-favorites');

  const favTitleSeen = await page.locator(`.link-title:has-text("${TEST_TITLE}")`).count();
  if (favTitleSeen > 0) ok('お気に入りタブに対象 link 表示');
  else fail(`お気に入りタブに ${TEST_TITLE} が見えない`);

  // 件数バッジ
  const favBadgeText = (await favTab.textContent()) ?? '';
  if (/お気に入り\s*\d+/.test(favBadgeText)) ok(`お気に入りタブに件数バッジ表示`, favBadgeText.trim());

  // ============================================
  // STEP 6: 下書きタブ表示確認
  // ============================================
  step('6. 下書きタブ表示');
  await page.locator('.me-tab:has-text("下書き")').click();
  await page.waitForTimeout(800);

  // 下書きタブが描画される（EmptyState または rows のどちらか）
  const draftEmpty = await page.locator('text=下書きはありません').count();
  const draftRows = await page.locator('.me-row').count();
  if (draftEmpty > 0 || draftRows > 0) ok(`下書きタブ表示 (empty=${draftEmpty}, rows=${draftRows})`);
  else fail('下書きタブで EmptyState も rows も見えない');
  await shot('06-me-drafts');

  // ============================================
  // STEP 7: 自分のURLタブ → visibility を private に
  // ============================================
  step('7. 自分のURLタブで visibility 切替（shared → private）');
  await page.locator('.me-tab:has-text("自分のURL")').click();
  await page.waitForTimeout(800);

  // 対象 link の row を探す
  const myRow = page.locator('.me-row').filter({ hasText: TEST_TITLE });
  const rowFound = await myRow.count();
  if (rowFound !== 1) fail(`自分のURL タブで対象 link 行が ${rowFound} 件`);
  else ok('自分のURL タブに対象 link 表示');

  if (rowFound === 1) {
    // 「非公開にする」ボタンを押す（VisibilityToggle）
    const toggleBtn = myRow.locator('button:has-text("非公開にする"), button:has-text("非公開"), button[aria-label*="非公開"]');
    if ((await toggleBtn.count()) > 0) {
      await toggleBtn.first().click();
      await page.waitForTimeout(300);
      // confirm dialog 受諾
      const confirm = page.locator('.modal-confirm button:has-text("非公開にする")');
      if ((await confirm.count()) > 0) {
        await confirm.click();
      }
      await page.waitForTimeout(1500);

      // 確認: /links 一覧に出てこない
      await page.goto('http://localhost:3200/links', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(800);
      const visibleInList = await page.locator(`.link-title:has-text("${TEST_TITLE}")`).count();
      if (visibleInList === 0) ok('private 切替後に /links 一覧から消えた');
      else fail('private 切替後も /links 一覧に表示されている');
    } else {
      fail('「非公開にする」ボタンが見つからない');
    }
  }

  await shot('07-after-private');
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
    consoleErrors.forEach((e) => console.log('  ', e.slice(0, 200)));
  }
  writeFileSync(`${ARTIFACTS}/results.json`, JSON.stringify({ results, consoleErrors }, null, 2));
  console.log(`\nArtifacts: ${ARTIFACTS}`);
  await browser.close();
  process.exit(failCount > 0 ? 1 : 0);
}
