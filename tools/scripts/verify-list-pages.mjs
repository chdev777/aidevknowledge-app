import { chromium } from 'playwright'

const BASE = 'http://localhost:3200'
const PAGES = [
  { key: 'links', url: '/links', eyebrow: '01 · LINKS', newRow: '.link-row', oldRow: '.row-link' },
  { key: 'qa',    url: '/qa',    eyebrow: '02 · QUESTIONS', newRow: '.qa-row', oldRow: '.row-link' },
  { key: 'notes', url: '/notes', eyebrow: '03 · NOTES', newRow: '.row', oldRow: '.row-link' },
  { key: 'apps',  url: '/apps',  eyebrow: '04 · APPS', newRow: '.row', oldRow: '.row-link' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const main = async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  const consoleByPage = {}
  let currentKey = 'login'
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleByPage[currentKey] = consoleByPage[currentKey] || []
      consoleByPage[currentKey].push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    consoleByPage[currentKey] = consoleByPage[currentKey] || []
    consoleByPage[currentKey].push(`[pageerror] ${err.message}`)
  })

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"], input[name="email"]', 'sato.k@example.ac.jp')
  await page.fill('input[type="password"], input[name="password"]', 'testtest')
  await Promise.all([
    page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 15000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ])
  await sleep(800)
  console.log('After login URL:', page.url())

  const results = []
  for (const p of PAGES) {
    currentKey = p.key
    await page.goto(`${BASE}${p.url}`, { waitUntil: 'networkidle' }).catch(() => null)
    await sleep(1200)

    const data = await page.evaluate((cfg) => {
      const eyebrowEl = document.querySelector('.page-eyebrow')
      const eyebrowText = eyebrowEl ? eyebrowEl.textContent.trim() : null
      const eyebrowFound = eyebrowText ? eyebrowText.includes(cfg.eyebrow) : false
      const filterChips = document.querySelectorAll('.filter-chip').length
      const filterBar = document.querySelectorAll('.filter-bar').length
      const newRows = document.querySelectorAll(cfg.newRow).length
      const oldRows = document.querySelectorAll(cfg.oldRow).length
      const oldRowList = document.querySelectorAll('.row-list').length
      const oldRowItem = document.querySelectorAll('.row-item').length
      const oldListToolbar = document.querySelectorAll('.list-toolbar').length
      const selectEls = document.querySelectorAll('select').length
      // page-specific signals
      const linkThumb = document.querySelectorAll('.link-thumb').length
      const qaCount = document.querySelectorAll('.qa-count').length
      const appIcon = document.querySelectorAll('.app-icon').length
      const purposeBoldCount = Array.from(document.querySelectorAll('b')).filter((b) => b.textContent.trim().startsWith('目的')).length
      return { eyebrowText, eyebrowFound, filterChips, filterBar, newRows, oldRows, oldRowList, oldRowItem, oldListToolbar, selectEls, linkThumb, qaCount, appIcon, purposeBoldCount }
    }, p)

    await page.screenshot({ path: `/tmp/verify-${p.key}.png`, fullPage: false })
    results.push({ ...p, ...data })
  }

  console.log('\n=== RESULTS ===')
  console.log(JSON.stringify(results, null, 2))
  console.log('\n=== CONSOLE ERRORS ===')
  console.log(JSON.stringify(consoleByPage, null, 2))

  await browser.close()
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
