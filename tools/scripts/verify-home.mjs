// 一時的な検証スクリプト：ホームページレンダリング確認
import { chromium } from 'playwright'

const TARGET_TEXTS = {
  sidebar: [
    'ナレッジハブ', 'ワークスペース', '整理', 'あなた',
    'URL共有', 'Q&A', '検証メモ', '作成アプリ',
    'プロジェクト', 'タグ', 'お気に入り', 'マイページ', '設定',
  ],
  topbar: ['+検証メモ', 'URLを共有'],
  hero: ['AI · APP · DEV KNOWLEDGE HUB', '流さない、蓄積する。'],
  metrics: ['共有URL', '未回答', '検証メモ', '作成アプリ'],
  headings: ['ナレッジフロー'],
}

const consoleErrors = []
const pageErrors = []

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await context.newPage()

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => pageErrors.push(err.message))

try {
  // 1. ログインページへ
  await page.goto('http://localhost:3200/login', { waitUntil: 'networkidle', timeout: 30000 })
  await page.fill('input[type="email"]', 'sato.k@example.ac.jp')
  await page.fill('input[type="password"]', 'testtest')
  await page.click('button[type="submit"]')

  // 2. ホームへリダイレクト待ち
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '', { timeout: 15000 })
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  // SPAのレンダリング完了用に少し待機
  await page.waitForTimeout(2000)

  // 3. 各テキスト存在確認
  const results = {}
  for (const [section, texts] of Object.entries(TARGET_TEXTS)) {
    results[section] = {}
    for (const text of texts) {
      const count = await page.locator(`text=${text}`).count()
      results[section][text] = count > 0 ? 'yes' : 'no'
    }
  }

  // 4. スクリーンショット
  const screenshotPath = 'C:/Users/ipc_administrator/AppData/Local/Temp/home-actual.png'
  await page.screenshot({ path: screenshotPath, fullPage: true })

  console.log('=== RESULTS ===')
  console.log(JSON.stringify(results, null, 2))
  console.log('=== CONSOLE ERRORS ===')
  console.log(consoleErrors.length === 0 ? '(none)' : consoleErrors.join('\n---\n'))
  console.log('=== PAGE ERRORS ===')
  console.log(pageErrors.length === 0 ? '(none)' : pageErrors.join('\n---\n'))
  console.log('=== SCREENSHOT ===')
  console.log(screenshotPath)
  console.log('=== CURRENT URL ===')
  console.log(page.url())
} catch (error) {
  console.error('FATAL:', error.message)
  try {
    await page.screenshot({ path: 'C:/Users/ipc_administrator/AppData/Local/Temp/home-actual.png', fullPage: true })
    console.log('Screenshot saved despite error')
  } catch {}
  console.log('=== CURRENT URL ===')
  console.log(page.url())
  console.log('=== CONSOLE ERRORS ===')
  console.log(consoleErrors.join('\n---\n'))
  console.log('=== PAGE ERRORS ===')
  console.log(pageErrors.join('\n---\n'))
} finally {
  await browser.close()
}
