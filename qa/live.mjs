// Quick live check against the deployed site.
// Usage: BASE=https://macshivadi.github.io/aketa-demo node qa/live.mjs   (passcode read from AKERU_DEMO_PASSCODE, never printed)
import { chromium } from 'playwright'
import fs from 'node:fs'
const BASE = (process.env.BASE ?? 'https://macshivadi.github.io/aketa-demo').replace(/\/$/, '')
const DEMO = BASE + '/demo'
const OUT = process.env.OUT ?? 'qa/out-live'
const PASSCODE = process.env.AKERU_DEMO_PASSCODE
fs.mkdirSync(OUT, { recursive: true })
let pass = 0, fail = 0
const ok = (n, c, d = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`) }
const h1 = async (p) => (await p.locator('h1').first().innerText()).trim()
const settle = (p) => p.waitForTimeout(500)

const demoRoutes = [
  ['demo', '/', async (p) => (await p.locator('.welcome').count()) === 1 && (await h1(p)).includes('Akeru')],
  ['x7k2', '/r/x7k2', async (p) => (await h1(p)) === 'Dinner’s on Jake'],
  ['partner', '/partner/run', async (p) => (await p.locator('.partner__time').innerText()) === '50:12' && (await p.locator('[data-testid="aketa-ready"]').count()) === 0],
  ['partner-ready', '/partner/run?aketa=ready', async (p) => (await p.locator('[data-testid="aketa-ready"]').innerText()).includes('Your crew’s Aketa is ready')],
  ['partners', '/partners', async (p) => (await h1(p)) === 'Akeru inside your app'],
  ['reunion', '/r/c4ps', async (p) => (await h1(p)).includes('Ten years')],
  ['roadtrip', '/r/m0ab', async (p) => (await h1(p)).includes('Chris called the first stop')],
]
const shots = { demo: '13-live-demo', x7k2: '13-live-x7k2', partner: '13-live-partner' }

const b = await chromium.launch()
for (const w of [390, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 600 ? 844 : 800 }, deviceScaleFactor: w < 600 ? 2 : 1 })
  const p = await ctx.newPage()
  const errors = [], bad = []
  p.on('pageerror', (e) => errors.push(String(e)))
  p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE) && !r.request().isNavigationRequest()) bad.push(`${r.status()} ${r.url()}`) })

  // landing
  let resp = await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await settle(p)
  const landingOk = async () => (await p.locator('.landing__word').innerText()) === 'akeru' && (await p.locator('.landing__soon').innerText()).includes('akeru.app')
  ok(`landing@${w}: renders (HTTP ${resp.status()})`, resp.status() === 200 && await landingOk())
  ok(`landing@${w}: no link to the demo (no links at all)`, (await p.locator('a[href]').count()) === 0 && !(await p.content()).includes('/demo"'))
  ok(`landing@${w}: no noindex`, (await p.locator('meta[name="robots"]').count()) === 0)
  ok(`landing@${w}: no gate`, (await p.locator('.gate').count()) === 0)
  await p.screenshot({ path: `${OUT}/13-live-landing-${w}.png` })
  await p.reload({ waitUntil: 'networkidle' }); await settle(p)
  ok(`landing@${w}: renders after refresh`, await landingOk())

  // gate on a deep link
  await p.goto(DEMO + '/partner/run', { waitUntil: 'networkidle' }); await settle(p)
  ok(`gate@${w}: /demo/partner/run deep link shows the gate`, (await h1(p)) === 'Enter passcode' && new URL(p.url()).pathname.endsWith('/demo/partner/run'))
  ok(`gate@${w}: noindex on /demo`, (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  await p.screenshot({ path: `${OUT}/13-gate-${w}.png` })
  await p.getByLabel('Passcode').fill('definitely-wrong-000')
  await p.getByRole('button', { name: 'Open the preview' }).click(); await settle(p)
  ok(`gate@${w}: wrong code shows friendly error`, (await p.locator('#gate-msg').innerText()).includes('didn’t open'))
  if (!PASSCODE) { ok(`gate@${w}: unlock`, false, 'passcode env var not set'); await ctx.close(); continue }
  await p.getByLabel('Passcode').fill(PASSCODE)
  await p.getByRole('button', { name: 'Open the preview' }).click()
  await p.locator('.gate').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {}); await settle(p)
  ok(`gate@${w}: correct code opens the intended deep link`, (await p.locator('.partner__time').count()) === 1 && new URL(p.url()).pathname.endsWith('/demo/partner/run'))

  for (const [name, path, check] of demoRoutes) {
    resp = await p.goto(DEMO + path, { waitUntil: 'networkidle' }); await settle(p)
    ok(`${name}@${w}: direct load renders, stays unlocked (HTTP ${resp.status()})`, (await p.locator('.gate').count()) === 0 && await check(p))
    ok(`${name}@${w}: noindex`, (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
    const imgs = await p.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src))
    ok(`${name}@${w}: images loaded`, imgs.length === 0, imgs.join(' '))
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    ok(`${name}@${w}: no horizontal overflow`, ov <= 0, ov > 0 ? `${ov}px` : '')
    if (shots[name]) await p.screenshot({ path: `${OUT}/${shots[name]}-${w}.png`, fullPage: name === 'partner' })
    await p.reload({ waitUntil: 'networkidle' }); await settle(p)
    ok(`${name}@${w}: renders after refresh`, (await p.locator('.gate').count()) === 0 && await check(p))
  }

  // partner button -> prefilled lock
  await p.goto(DEMO + '/partner/run', { waitUntil: 'networkidle' }); await settle(p)
  await p.getByRole('button', { name: '🔒 Lock a dare with your crew for the next run' }).click()
  await p.waitForURL('**/demo/lock'); await settle(p)
  ok(`partner lock@${w}: prefilled lock with "Unlocks when everyone finishes"`, (await p.locator('[data-testid="lock-condition"]').innerText()).includes('Unlocks when everyone finishes') && (await h1(p)).includes('10K'))
  await p.reload({ waitUntil: 'networkidle' }); await settle(p)
  ok(`partner lock@${w}: refresh keeps the prefilled lock`, (await p.locator('[data-testid="lock-condition"]').count()) === 1)
  await p.goto(DEMO + '/partner/run?aketa=ready', { waitUntil: 'networkidle' }); await settle(p)
  await p.locator('[data-testid="aketa-ready"]').click(); await p.waitForURL('**/demo/r/r10k'); await settle(p)
  ok(`partner ready@${w}: banner opens /demo/r/r10k`, (await h1(p)).includes('Sam ran 50:12'))

  for (const u of ['/favicon.svg', '/apple-touch-icon.png']) {
    const r = await p.request.get(BASE + u)
    ok(`${u}@${w}: loads`, r.status() === 200, String(r.status()))
  }
  ok(`no failed sub-requests@${w}`, bad.length === 0, bad.slice(0, 3).join(' | '))
  ok(`no page errors@${w}`, errors.length === 0, errors.length ? 'page errors' : '')
  await ctx.close()
}
await b.close()
console.log(`\n${pass}/${pass + fail} live checks passed`)
process.exit(fail ? 1 : 0)
