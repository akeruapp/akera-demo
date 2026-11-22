// Local QA walk-through with Playwright. Usage: npm run build && npm run preview, then npm run qa
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:4173'
const OUT = process.env.OUT ?? 'qa/out'
fs.mkdirSync(OUT, { recursive: true })
const results = []
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`) }

const browser = await chromium.launch()

async function page(width, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 800 },
    deviceScaleFactor: width < 600 ? 2 : 1,
    hasTouch: width < 600,
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
  })
  const p = await ctx.newPage()
  p.errors = []
  p.external = []
  p.on('pageerror', (e) => p.errors.push(String(e)))
  p.on('console', (m) => { if (m.type() === 'error') p.errors.push(m.text()) })
  p.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) p.external.push(r.url()) })
  return p
}

async function audit(p, label) {
  const r = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const overflow = document.documentElement.scrollWidth - vw
    const small = []
    for (const el of document.querySelectorAll('button, a, input, textarea, label.chip, label.tpl, label.switch')) {
      const s = getComputedStyle(el)
      if (s.visibility === 'hidden' || s.display === 'none' || el.closest('[aria-hidden="true"]')) continue
      if (el.matches('input.visually-hidden, input.switch__input')) continue
      const b = el.getBoundingClientRect()
      if (b.width === 0) continue
      const inline = el.classList.contains('linkbtn')
      if ((b.height < 44 && !inline) || (inline && b.height < 24)) small.push(`${el.tagName.toLowerCase()}.${el.className} ${Math.round(b.width)}x${Math.round(b.height)}`)
    }
    // text clipping: elements whose content overflows horizontally
    const clipped = []
    for (const el of document.querySelectorAll('h1, h2, p, span, button, a')) {
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible' && !el.classList.contains('visually-hidden')) clipped.push(el.className || el.tagName)
      const b = el.getBoundingClientRect()
      if (b.width && (b.right > vw + 1 || b.left < -1) && !el.closest('.shared__orbit, .screen__orbit, .aketa__art, .visually-hidden')) clipped.push('offscreen:' + (el.className || el.tagName) + ':' + (el.textContent || '').slice(0, 20))
    }
    // images in frames: each <img> must not exceed its parent box
    const imgs = []
    for (const img of document.querySelectorAll('img')) {
      const b = img.getBoundingClientRect(), pb = img.parentElement.getBoundingClientRect()
      if (!img.complete || img.naturalWidth === 0) imgs.push('not-loaded:' + img.src)
      if (getComputedStyle(img.parentElement).overflow === 'hidden') continue
      if (b.width > pb.width + 1) imgs.push('overflow:' + img.src)
    }
    return { overflow, small, clipped: [...new Set(clipped)].slice(0, 8), imgs }
  })
  ok(`${label}: no horizontal overflow`, r.overflow <= 0, r.overflow > 0 ? `${r.overflow}px` : '')
  ok(`${label}: tap targets >=44px`, r.small.length === 0, r.small.join('; '))
  ok(`${label}: no clipped/offscreen text`, r.clipped.length === 0, r.clipped.join('; '))
  ok(`${label}: photos loaded and framed`, r.imgs.length === 0, r.imgs.join('; '))
}

const nav = async (p, pat) => { await p.waitForURL(pat); await p.waitForTimeout(320) }
// Phone-realistic shots: the viewport at the top of the screen, plus a second shot
// scrolled to the bottom when the screen is taller than the viewport.
const shot = async (p, name, full = true) => {
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(350)
  await p.screenshot({ path: `${OUT}/${name}.png` })
  if (!full) return
  const tall = await p.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 40)
  if (tall) {
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await p.waitForTimeout(250)
    await p.screenshot({ path: `${OUT}/${name}-scrolled.png` })
    await p.evaluate(() => window.scrollTo(0, 0))
  }
}

// ---------- default dinner path at both widths ----------
for (const w of [390, 1280]) {
  const p = await page(w)
  const tag = `${w}`
  await p.goto(BASE + '/')
  await p.evaluate(() => document.fonts.ready)
  await shot(p, `01-welcome-${tag}`, false)
  await audit(p, `welcome@${w}`)
  await p.getByRole('button', { name: 'Start the demo' }).click()
  await nav(p, '**/crew')
  await shot(p, `02a-crew-create-${tag}`)
  await audit(p, `crew@${w}`)
  await p.getByRole('button', { name: 'Create crew' }).click()
  await p.getByRole('list', { name: 'Crew members' }).waitFor()
  ok(`crew create@${w}: five members shown`, (await p.locator('.members__row').count()) === 5)
  await shot(p, `02b-crew-created-${tag}`)
  await p.getByRole('button', { name: 'Choose what to lock' }).click()
  await nav(p, '**/templates')
  ok(`templates@${w}: dinner is default`, await p.locator('input[value="dinner"]').isChecked())
  await shot(p, `03-templates-${tag}`)
  await audit(p, `templates@${w}`)
  await p.getByRole('button', { name: /Use “First to land/ }).click()
  await nav(p, '**/lock')
  await p.locator('label.chip', { hasText: 'Jake' }).click()
  await shot(p, `04-lock-${tag}`)
  await audit(p, `lock@${w}`)
  await p.getByRole('button', { name: 'Lock my call' }).click()
  await nav(p, '**/locked')
  const c1 = await p.locator('.countdown__clock').innerText()
  await p.waitForTimeout(1300)
  const c2 = await p.locator('.countdown__clock').innerText()
  ok(`locked@${w}: countdown ticks`, c1 !== c2, `${c1.replace(/\n/g, '')} -> ${c2.replace(/\n/g, '')}`)
  ok(`locked@${w}: condition label`, (await p.locator('.condition__text').innerText()) === 'Landing confirmed via flight partner')
  await shot(p, `05-locked-${tag}`)
  await audit(p, `locked@${w}`)
  await p.getByRole('button', { name: 'Simulate unlock' }).click()
  await nav(p, '**/aketa')
  await p.waitForTimeout(1350)
  await p.screenshot({ path: `${OUT}/06a-aketa-burst-${tag}.png` })
  ok(`aketa@${w}: animation in progress (phase-2)`, await p.locator('.aketa.phase-2').count() === 1)
  await p.locator('.aketa.phase-3').waitFor({ timeout: 4000 })
  await p.waitForTimeout(600)
  await shot(p, `06b-aketa-end-${tag}`, false)
  ok(`aketa@${w}: CTA focused at end`, await p.evaluate(() => document.activeElement?.textContent?.includes('See everyone')))
  await audit(p, `aketa@${w}`)
  await p.getByRole('button', { name: 'See everyone’s calls' }).click()
  await nav(p, '**/reveal')
  const share = p.getByRole('button', { name: 'Share reveal card' })
  ok(`reveal@${w}: share disabled before consent`, await share.isDisabled())
  ok(`reveal@${w}: five calls shown`, (await p.locator('.calls__row').count()) === 5)
  await shot(p, `07a-reveal-card-consent-off-${tag}`)
  await audit(p, `reveal@${w}`)
  await p.locator('label.switch').click()
  ok(`reveal@${w}: share enabled after consent`, await share.isEnabled())
  await shot(p, `07b-reveal-card-consent-on-${tag}`)
  await share.click()
  await nav(p, '**/r/x7k2?from=crew')
  ok(`shared@${w}: lands on /r/x7k2 with demo note`, await p.locator('.shared__note').isVisible())
  ok(`shared@${w}: no private crew chrome (no back/steps)`, (await p.locator('.topbar').count()) === 0)
  await shot(p, `08a-shared-from-flow-${tag}`)
  // browser back returns to the reveal card
  await p.goBack(); await nav(p, '**/reveal')
  ok(`back@${w}: browser back from shared -> reveal`, true)
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, '**/aketa')
  ok(`back@${w}: in-app back reveal -> aketa (held end state, no replay)`, await p.locator('.aketa.phase-3').count() === 1)
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, '**/locked')
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, '**/lock')
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, '**/templates')
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, '**/crew')
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, BASE + '/')
  ok(`back@${w}: in-app back walks to welcome`, true)
  ok(`errors@${w}: no console/page errors`, p.errors.length === 0, p.errors.join(' | '))
  ok(`network@${w}: no external requests`, p.external.length === 0, p.external.slice(0, 3).join(' '))
  await p.context().close()
}

// ---------- direct load /r/x7k2 ----------
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(BASE + '/r/x7k2')
  await p.evaluate(() => document.fonts.ready)
  ok(`direct /r/x7k2@${w}: canned reveal`, (await p.locator('h1').innerText()) === 'Dinner’s on Jake')
  ok(`direct /r/x7k2@${w}: roast consent shown`, await p.getByText('Jake is laughing too').isVisible())
  await shot(p, `08b-shared-direct-${w}`)
  await audit(p, `shared@${w}`)
  await p.getByRole('button', { name: 'Run it with your crew' }).click()
  await nav(p, '**/crew')
  ok(`run it@${w}: restarts at crew step`, true)
  await p.getByRole('button', { name: 'Create crew' }).click()
  await p.getByRole('button', { name: 'Choose what to lock' }).click()
  ok(`run it@${w}: template preselected (dinner)`, await p.locator('input[value="dinner"]').isChecked())
  ok(`errors direct@${w}`, p.errors.length === 0, p.errors.join(' | '))
  await p.context().close()
}

// ---------- join path ----------
{
  const p = await page(390)
  await p.goto(BASE + '/')
  await p.getByRole('button', { name: 'Start the demo' }).click()
  await p.getByRole('tab', { name: 'Join with a code' }).click()
  await p.getByLabel('Crew code').fill('ZZ-NOPE')
  await p.getByRole('button', { name: 'Join crew' }).click()
  ok('join: wrong code shows helpful error', (await p.locator('#join-msg').innerText()).includes('C7-GATE'))
  await shot(p, '02c-crew-join-error-390')
  await p.getByLabel('Crew code').fill('c7gate')
  await p.getByRole('button', { name: 'Join crew' }).click()
  ok('join: c7gate (lowercase, no dash) accepted', await p.getByText('You’re in').isVisible())
  ok('join: lands in Gate C Crew', (await p.locator('.crewcard__name').innerText()) === 'Gate C Crew')
  await shot(p, '02d-crew-joined-390')
  await p.context().close()
}
{
  const p = await page(1280)
  await p.goto(BASE + '/crew')
  await p.getByRole('tab', { name: 'Join with a code' }).click()
  await p.getByRole('button', { name: 'C7-GATE' }).click()
  await p.getByRole('button', { name: 'Join crew' }).click()
  ok('join@1280: demo code shortcut works', await p.getByText('You’re in').isVisible())
  await shot(p, '02d-crew-joined-1280')
  await p.context().close()
}

// ---------- all four templates ----------
const expect = {
  match: { cond: 'Final whistle via sports partner', h1: /nailed it/, roast: 'chris' },
  run: { cond: 'Official finish via event partner', h1: /Sam ran 50:12/ },
  note: { cond: 'All seats filled via table check-in', h1: /Five notes for Riley/ },
}
for (const [id, e] of Object.entries(expect)) {
  for (const w of [390, 1280]) {
    const p = await page(w, { reduced: true })
    await p.goto(BASE + '/crew')
    await p.getByRole('button', { name: 'Create crew' }).click()
    await p.getByRole('button', { name: 'Choose what to lock' }).click()
    await p.locator(`label.tpl:has(input[value="${id}"])`).click()
    await p.getByRole('button', { name: /^Use / }).click()
    await nav(p, '**/lock')
    if (id === 'match') { await p.getByRole('button', { name: 'One more goal for Comets' }).click() }
    if (id === 'run') { await p.getByRole('button', { name: '15 seconds faster' }).click() }
    if (id === 'note') { await p.locator('.suggest__btn').nth(1).click() }
    if (w === 390) await shot(p, `04-lock-${id}-390`)
    await audit(p, `lock ${id}@${w}`)
    await p.getByRole('button', { name: 'Lock my call' }).click()
    await nav(p, '**/locked')
    ok(`${id}@${w}: locked condition "${e.cond}"`, (await p.locator('.condition__text').innerText()) === e.cond)
    if (w === 390) await shot(p, `05-locked-${id}-390`)
    await p.getByRole('button', { name: 'Simulate unlock' }).click()
    await nav(p, '**/aketa')
    await p.getByRole('button', { name: 'See everyone’s calls' }).click()
    await nav(p, '**/reveal')
    ok(`${id}@${w}: reveal headline`, e.h1.test(await p.locator('h1').innerText()), await p.locator('h1').innerText())
    const share = p.getByRole('button', { name: 'Share reveal card' })
    if (e.roast) {
      ok(`${id}@${w}: roast gates share`, await share.isDisabled())
      await p.locator('label.switch').click()
    }
    ok(`${id}@${w}: share enabled`, await share.isEnabled())
    if (w === 390) await shot(p, `07-reveal-${id}-390`)
    await audit(p, `reveal ${id}@${w}`)
    await share.click()
    await nav(p, '**/r/**')
    ok(`${id}@${w}: shared route ${new URL(p.url()).pathname}`, (await p.locator('h1').count()) === 1)
    if (w === 390) await shot(p, `08-shared-${id}-390`)
    ok(`errors ${id}@${w}`, p.errors.length === 0, p.errors.join(' | '))
    await p.context().close()
  }
}

// ---------- reduced motion ----------
for (const w of [390, 1280]) {
  const p = await page(w, { reduced: true })
  await p.goto(BASE + '/crew')
  await p.getByRole('button', { name: 'Create crew' }).click()
  await p.getByRole('button', { name: 'Choose what to lock' }).click()
  await p.getByRole('button', { name: /^Use / }).click()
  await p.getByRole('button', { name: 'Lock my call' }).click()
  await nav(p, '**/locked')
  await p.getByRole('button', { name: 'Simulate unlock' }).click()
  await nav(p, '**/aketa')
  await p.waitForTimeout(100)
  const st = await p.evaluate(() => ({
    phase3: !!document.querySelector('.aketa.phase-3'),
    word: getComputedStyle(document.querySelector('.aketa__word')).opacity,
    cta: getComputedStyle(document.querySelector('.aketa__foot .btn--primary')).opacity,
    skip: !!document.querySelector('.aketa__skip'),
  }))
  ok(`reduced motion@${w}: end state immediately (word + CTA visible within 100ms, no skip button)`, st.phase3 && st.word === '1' && st.cta === '1' && !st.skip, JSON.stringify(st))
  await p.screenshot({ path: `${OUT}/06c-aketa-reduced-motion-${w}.png` })
  await p.context().close()
}

// ---------- keyboard ----------
{
  const p = await page(1280)
  await p.goto(BASE + '/')
  const seen = []
  for (let i = 0; i < 6; i++) {
    await p.keyboard.press('Tab')
    const st = await p.evaluate(() => {
      const a = document.activeElement
      const s = getComputedStyle(a)
      return { t: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 30), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 }
    })
    seen.push(st)
    if (st.t.startsWith('Start the demo')) break
  }
  const start = seen.find((s) => s.t.startsWith('Start the demo'))
  ok('keyboard: Tab reaches "Start the demo" with visible outline', !!start && start.outline, JSON.stringify(seen.map((s) => s.t)))
  await p.screenshot({ path: `${OUT}/kbd-focus-welcome-1280.png` })
  await p.keyboard.press('Enter')
  await nav(p, '**/crew')
  // Tab until Create crew, press Enter
  let found = false
  for (let i = 0; i < 12 && !found; i++) { await p.keyboard.press('Tab'); found = await p.evaluate(() => document.activeElement?.textContent?.trim() === 'Create crew') }
  ok('keyboard: reach Create crew', found)
  await p.screenshot({ path: `${OUT}/kbd-focus-create-1280.png` })
  await p.keyboard.press('Enter')
  found = false
  for (let i = 0; i < 20 && !found; i++) { await p.keyboard.press('Tab'); found = await p.evaluate(() => document.activeElement?.textContent?.trim() === 'Choose what to lock') }
  ok('keyboard: reach Choose what to lock', found)
  await p.keyboard.press('Enter'); await nav(p, '**/templates')
  // radio group: Tab into it, arrow down selects next template
  found = false
  for (let i = 0; i < 6 && !found; i++) { await p.keyboard.press('Tab'); found = await p.evaluate(() => document.activeElement?.getAttribute('name') === 'tpl') }
  await p.keyboard.press('ArrowDown')
  ok('keyboard: arrow keys move template selection', found && await p.locator('input[value="match"]').isChecked())
  await p.screenshot({ path: `${OUT}/kbd-focus-templates-1280.png` })
  // continue to the lock and use the keyboard to lock
  await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); await nav(p, '**/lock')
  found = false
  for (let i = 0; i < 20 && !found; i++) { await p.keyboard.press('Tab'); found = await p.evaluate(() => document.activeElement?.textContent?.trim().endsWith('Lock my call')) }
  ok('keyboard: reach Lock my call', found)
  await p.keyboard.press('Enter'); await nav(p, '**/locked')
  found = false
  for (let i = 0; i < 20 && !found; i++) { await p.keyboard.press('Tab'); found = await p.evaluate(() => document.activeElement?.textContent?.includes('Simulate unlock')) }
  ok('keyboard: reach Simulate unlock', found)
  await p.keyboard.press('Enter'); await nav(p, '**/aketa')
  await p.locator('.aketa.phase-3').waitFor()
  await p.keyboard.press('Enter'); await nav(p, '**/reveal')
  ok('keyboard: Enter on focused CTA after animation opens reveal', true)
  found = false
  for (let i = 0; i < 30 && !found; i++) { await p.keyboard.press('Tab'); found = await p.evaluate(() => document.activeElement?.getAttribute('role') === 'switch') }
  await p.keyboard.press('Space')
  ok('keyboard: Space toggles “I’m laughing too” switch', found && await p.getByRole('button', { name: 'Share reveal card' }).isEnabled())
  await p.screenshot({ path: `${OUT}/kbd-focus-consent-1280.png` })
  await p.context().close()
}

// ---------- contrast (token pairs + text over photos) ----------
const lum = (hex) => { const c = hex.match(/\w\w/g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
const pairs = [
  ['cream on ink', '#F4EEE6', '#121A2C', 4.5], ['amber on ink', '#F4A35C', '#121A2C', 4.5], ['ink on amber (CTA)', '#121A2C', '#F4A35C', 4.5],
  ['cream-2 on ink', '#CFC8C0', '#121A2C', 4.5], ['cream-3 on ink', '#A9A39D', '#121A2C', 4.5], ['cream-3 on ink-2', '#A9A39D', '#18223A', 4.5],
  ['cream-3 on ink-3', '#A9A39D', '#212C47', 4.5], ['amber on ink-3', '#F4A35C', '#212C47', 4.5], ['cream-3 on disabled', '#A9A39D', '#2C3650', 3],
  ['input border on ink-2', '#7A7B82', '#18223A', 3], ['error on ink', '#FFB4A0', '#121A2C', 4.5],
]
for (const [n, a, b, min] of pairs) ok(`contrast ${n}`, cr(a, b) >= min, cr(a, b).toFixed(2) + ':1')

// text over the welcome photo: sample the darkest-case background behind each text block
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(BASE + '/')
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(300)
  const boxes = await p.evaluate(() => [...document.querySelectorAll('.welcome__kicker, .welcome__title, .welcome__tagline, .welcome__line, .welcome__hint, .welcome__credit, .demo-tag')].map((el) => {
    const b = el.getBoundingClientRect(); return { cls: el.className, x: b.x, y: b.y, w: b.width, h: b.height, color: getComputedStyle(el).color }
  }))
  await p.addStyleTag({ content: '.welcome__body *, .welcome__credit, .welcome__bar * { color: transparent !important; } .sparkle, .btn { visibility: hidden !important; }' })
  await p.waitForTimeout(100)
  const buf = await p.screenshot()
  fs.writeFileSync(`${OUT}/_bg-${w}.png`, buf)
  const worst = await p.evaluate(async ({ b64, boxes, dpr }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const L = (r, gg, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b) }
    return boxes.map((bx) => {
      const d = g.getImageData(Math.max(0, bx.x * dpr), Math.max(0, bx.y * dpr), Math.max(1, bx.w * dpr), Math.max(1, bx.h * dpr)).data
      let max = 0; const ls = []
      for (let i = 0; i < d.length; i += 16) { const l = L(d[i], d[i + 1], d[i + 2]); ls.push(l) }
      ls.sort((a, b) => a - b); max = ls[Math.floor(ls.length * 0.98)] // 98th percentile brightest pixel
      const m = bx.color.match(/\d+/g).map(Number); const tl = L(m[0], m[1], m[2])
      return { cls: bx.cls.split(' ')[0], ratio: +((Math.max(tl, max) + 0.05) / (Math.min(tl, max) + 0.05)).toFixed(2) }
    })
  }, { b64: buf.toString('base64'), boxes, dpr: w < 600 ? 2 : 1 })
  for (const x of worst) ok(`photo contrast@${w} ${x.cls}`, x.ratio >= (x.cls.includes('title') ? 3 : 4.5), `${x.ratio}:1 (vs 98th-pct brightest bg pixel)`)
  await p.context().close()
}

await browser.close()
const failed = results.filter((r) => !r.pass)
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2))
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
