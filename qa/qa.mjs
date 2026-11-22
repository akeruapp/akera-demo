// Local QA walk-through with Playwright. Usage: npm run build && npm run preview, then npm run qa
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = (process.env.BASE ?? 'http://localhost:4173').replace(/\/$/, '')
const DEMO = BASE + '/demo'
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
  // Flow tests start unlocked; the passcode gate itself is tested separately with the real code.
  if (!opts.locked) await ctx.addInitScript(() => { try { sessionStorage.setItem('akeru.demo.unlocked', '1') } catch {} })
  const p = await ctx.newPage()
  p.errors = []
  p.external = []
  p.on('pageerror', (e) => p.errors.push(String(e)))
  p.on('console', (m) => { if (m.type() === 'error') p.errors.push(m.text()) })
  p.on('request', (r) => { if (!r.url().startsWith(new URL(BASE).origin) && !r.url().startsWith('data:')) p.external.push(r.url()) })
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
      if ((b.height < 43.5 && !inline) || (inline && b.height < 24)) small.push(`${el.tagName.toLowerCase()}.${el.className} ${Math.round(b.width)}x${Math.round(b.height)}`)
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

const nav = async (p, pat) => { await p.waitForURL(pat); await p.waitForTimeout(520) } // leave + enter transitions, then focus moves to the heading
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
  await p.goto(DEMO + '/')
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
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, DEMO + '/')
  ok(`back@${w}: in-app back walks to welcome`, true)
  ok(`errors@${w}: no console/page errors`, p.errors.length === 0, p.errors.join(' | '))
  ok(`network@${w}: no external requests`, p.external.length === 0, p.external.slice(0, 3).join(' '))
  await p.context().close()
}

// ---------- direct load /r/x7k2 ----------
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(DEMO + '/r/x7k2')
  await p.evaluate(() => document.fonts.ready)
  ok(`direct /r/x7k2@${w}: canned reveal`, (await p.locator('h1').innerText()) === 'Dinner’s on Jake')
  ok(`direct /r/x7k2@${w}: roast consent shown`, await p.getByText('Jake is laughing too').isVisible())
  await shot(p, `08b-shared-direct-${w}`)
  await audit(p, `shared@${w}`)
  await p.getByRole('button', { name: 'Run it with your crew' }).click()
  await nav(p, '**/demo/lock')
  ok(`run it@${w}: starts the lock flow for dinner with Gate C Crew`, await p.evaluate(() => { const v = JSON.parse(sessionStorage.getItem('akeru.demo.v1')); return v.templateId === 'dinner' && v.crewName === 'Gate C Crew' && v.crew && !v.lockedAt }))
  ok(`errors direct@${w}`, p.errors.length === 0, p.errors.join(' | '))
  await p.context().close()
}

// ---------- join path ----------
{
  const p = await page(390)
  await p.goto(DEMO + '/')
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
  await p.goto(DEMO + '/crew')
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
  reunion: { cond: 'All 5 checked in at Ballwin High reunion', h1: /Ten years, five predictions/, slug: 'c4ps', named: true },
  roadtrip: { cond: 'Arrival confirmed via maps partner', h1: /Chris called the first stop/, roast: 'chris', slug: 'm0ab', named: true },
}
const nm = (id, e, step, w, legacy) => (e.named ? `11-template-${id}-${step}-${w}` : legacy)
for (const [id, e] of Object.entries(expect)) {
  for (const w of [390, 1280]) {
    const p = await page(w, { reduced: !e.named })
    const want = (legacy) => e.named || w === 390
    await p.goto(DEMO + '/crew')
    await p.getByRole('button', { name: 'Create crew' }).click()
    await p.getByRole('button', { name: 'Choose what to lock' }).click()
    await nav(p, '**/templates')
    await p.locator(`label.tpl:has(input[value="${id}"])`).click()
    ok(`${id}@${w}: listed and selectable on templates`, await p.locator(`input[value="${id}"]`).isChecked())
    if (e.named) {
      await p.locator(`label.tpl:has(input[value="${id}"])`).scrollIntoViewIfNeeded()
      await p.waitForTimeout(250)
      await p.screenshot({ path: `${OUT}/${nm(id, e, 'templates-selected', w)}.png` })
    }
    await p.getByRole('button', { name: /^Use / }).click()
    await nav(p, '**/lock')
    if (id === 'match') { await p.getByRole('button', { name: 'One more goal for Comets' }).click() }
    if (id === 'run') { await p.getByRole('button', { name: '15 seconds faster' }).click() }
    if (id === 'note' || id === 'reunion') { await p.locator('.suggest__btn').nth(1).click() }
    if (id === 'roadtrip') { await p.locator('label.chip', { hasText: 'Chris' }).click() }
    if (want()) await shot(p, nm(id, e, 'lock', w, `04-lock-${id}-390`))
    await audit(p, `lock ${id}@${w}`)
    await p.getByRole('button', { name: 'Lock my call' }).click()
    await nav(p, '**/locked')
    ok(`${id}@${w}: locked condition "${e.cond}"`, (await p.locator('.condition__text').innerText()) === e.cond)
    const c1 = await p.locator('.countdown__clock').innerText(); await p.waitForTimeout(1100)
    ok(`${id}@${w}: countdown ticks`, c1 !== await p.locator('.countdown__clock').innerText())
    if (want()) await shot(p, nm(id, e, 'locked', w, `05-locked-${id}-390`))
    await audit(p, `locked ${id}@${w}`)
    await p.getByRole('button', { name: 'Simulate unlock' }).click()
    await nav(p, '**/aketa')
    await p.locator('.aketa.phase-3').waitFor({ timeout: 5000 })
    await p.getByRole('button', { name: 'See everyone’s calls' }).click()
    await nav(p, '**/reveal')
    ok(`${id}@${w}: reveal headline`, e.h1.test(await p.locator('h1').innerText()), await p.locator('h1').innerText())
    ok(`${id}@${w}: five calls on reveal`, (await p.locator('.calls__row').count()) === 5)
    const share = p.getByRole('button', { name: 'Share reveal card' })
    if (e.roast) {
      ok(`${id}@${w}: roast gates share`, await share.isDisabled())
      if (e.named) await shot(p, nm(id, e, 'reveal-consent-off', w))
      await p.locator('label.switch').click()
    }
    ok(`${id}@${w}: share enabled`, await share.isEnabled())
    if (want()) await shot(p, nm(id, e, 'reveal', w, `07-reveal-${id}-390`))
    await audit(p, `reveal ${id}@${w}`)
    await share.click()
    await nav(p, '**/r/**')
    ok(`${id}@${w}: shared route ${new URL(p.url()).pathname}`, (await p.locator('h1').count()) === 1 && (!e.slug || new URL(p.url()).pathname.endsWith(`/r/${e.slug}`)))
    if (want()) await shot(p, nm(id, e, 'shared', w, `08-shared-${id}-390`))
    if (e.slug) {
      const q = await page(w)
      await q.goto(`${DEMO}/r/${e.slug}`)
      ok(`${id}@${w}: direct load /r/${e.slug}`, e.h1.test(await q.locator('h1').innerText()))
      if (e.roast) ok(`${id}@${w}: direct shared shows consent`, await q.getByText('Chris is laughing too').isVisible())
      await audit(q, `shared direct ${id}@${w}`)
      if (e.named) await shot(q, nm(id, e, 'shared-direct', w))
      ok(`errors shared direct ${id}@${w}`, q.errors.length === 0, q.errors.join(' | '))
      await q.context().close()
    }
    ok(`errors ${id}@${w}`, p.errors.length === 0, p.errors.join(' | '))
    await p.context().close()
  }
}

// ---------- partner example (/partner/run) ----------
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(DEMO + '/partner/run')
  await p.evaluate(() => document.fonts.ready)
  ok(`partner@${w}: labeled partner example`, await p.getByText('Partner example', { exact: true }).isVisible())
  ok(`partner@${w}: fictional name Fieldstone Timing`, (await p.locator('.partner__brand').innerText()).includes('Fieldstone'))
  ok(`partner@${w}: finished + time 50:12`, (await p.locator('.partner__status').innerText()).includes('Finished') && (await p.locator('.partner__time').innerText()) === '50:12')
  const cta = p.getByRole('button', { name: '🔒 Lock a dare with your crew for the next run' })
  ok(`partner@${w}: Aketa CTA with exact label`, await cta.isVisible())
  ok(`partner@${w}: yes/no footnote`, (await p.locator('.partner__foot').innerText()).includes('yes/no') && (await p.locator('.partner__foot').innerText()).includes('never sees what anyone'))
  ok(`partner@${w}: no ready banner in default state`, (await p.locator('[data-testid="aketa-ready"]').count()) === 0)
  await audit(p, `partner@${w}`)
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/09-partner-run-${w}.png`, fullPage: true })
  // CTA from a clean session: lands on a prefilled lock screen (no redirect to welcome)
  await cta.click()
  await nav(p, '**/lock')
  ok(`partner@${w}: CTA lands on /lock`, new URL(p.url()).pathname.endsWith('/lock'))
  const st = await p.evaluate(() => JSON.parse(sessionStorage.getItem('akeru.demo.v1')))
  ok(`partner@${w}: run template + Gate C Crew seeded`, st.templateId === 'run' && st.crew && st.crewName === 'Gate C Crew' && st.fromPartner === true, JSON.stringify(st))
  ok(`partner@${w}: condition "Unlocks when everyone finishes"`, (await p.locator('[data-testid="lock-condition"]').innerText()).includes('Unlocks when everyone finishes'))
  ok(`partner@${w}: run question on lock`, (await p.locator('h1').innerText()).includes('10K'))
  await audit(p, `partner lock@${w}`)
  await shot(p, `09-partner-lock-${w}`)
  await p.getByRole('button', { name: 'Lock my call' }).click()
  await nav(p, '**/locked')
  ok(`partner@${w}: locked shows partner condition`, (await p.locator('.condition__text').innerText()) === 'Everyone finishes via Fieldstone Timing')
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, '**/lock')
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, '**/partner/run')
  ok(`partner@${w}: back from lock returns to partner page`, true)
  // ready state
  await p.goto(DEMO + '/partner/run?aketa=ready')
  const banner = p.locator('[data-testid="aketa-ready"]')
  ok(`partner ready@${w}: banner visible`, await banner.isVisible() && (await banner.innerText()).includes('Your crew’s Aketa is ready'))
  ok(`partner ready@${w}: banner links to /r/r10k`, (await banner.getAttribute('href')).endsWith('/r/r10k'))
  await audit(p, `partner ready@${w}`)
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/09-partner-ready-${w}.png`, fullPage: true })
  await banner.click(); await nav(p, '**/r/r10k')
  ok(`partner ready@${w}: banner opens run reveal`, /Sam ran 50:12/.test(await p.locator('h1').innerText()))
  ok(`errors partner@${w}`, p.errors.length === 0, p.errors.join(' | '))
  ok(`network partner@${w}: no external requests`, p.external.length === 0)
  await p.context().close()
}
// entry links
{
  const p = await page(390)
  await p.goto(DEMO + '/')
  await p.getByRole('link', { name: 'See it from a partner app' }).click()
  await nav(p, '**/partner/run')
  ok('entry: welcome link opens /partner/run', new URL(p.url()).pathname.endsWith('/partner/run'))
  await p.goto(DEMO + '/crew')
  await p.getByRole('button', { name: 'Create crew' }).click()
  await p.getByRole('button', { name: 'Choose what to lock' }).click(); await nav(p, '**/templates')
  ok('entry: templates link points at /partner/run', (await p.getByRole('link', { name: 'See it from a partner app' }).getAttribute('href')).endsWith('/partner/run'))
  // picking a template after a partner entry clears the partner condition
  await p.goto(DEMO + '/partner/run')
  await p.getByRole('button', { name: /Lock a dare/ }).click(); await nav(p, '**/lock')
  await p.getByRole('button', { name: 'Back' }).click(); await nav(p, '**/partner/run')
  await p.goto(DEMO + '/templates'); await nav(p, '**/templates')
  await p.locator('label.tpl:has(input[value="dinner"])').click()
  await p.getByRole('button', { name: /^Use / }).click(); await nav(p, '**/lock')
  ok('partner condition cleared after switching template', (await p.locator('[data-testid="lock-condition"]').count()) === 0)
  await p.context().close()
}
// ---------- landing + passcode gate ----------
const PASSCODE = process.env.AKERU_DEMO_PASSCODE
for (const w of [390, 1280]) {
  const p = await page(w, { locked: true })
  await p.goto(BASE + '/')
  await p.evaluate(() => document.fonts.ready)
  ok(`landing@${w}: open without passcode`, (await p.locator('.landing__word').innerText()) === 'akeru' && (await p.locator('.gate').count()) === 0)
  ok(`landing@${w}: teaser + akeru.app coming soon`, (await p.locator('.landing__teaser').innerText()) === 'Lock it now. Open it together.' && (await p.getByText('Open it together when it happens').count()) === 0 && (await p.locator('.landing__soon').innerText()).includes('akeru.app'))
  ok(`landing@${w}: no links at all (so no link to the demo)`, (await p.locator('a[href]').count()) === 0)
  ok(`landing@${w}: no noindex`, (await p.locator('meta[name="robots"]').count()) === 0)
  await audit(p, `landing@${w}`)
  await p.waitForTimeout(500)
  await p.screenshot({ path: `${OUT}/13-landing-${w}.png` })
  await p.screenshot({ path: `${OUT}/19-landing-tagline-${w}.png` })
  ok(`landing@${w}: tagline sits between wordmark and coming soon`, await p.evaluate(() => { const y = (s) => document.querySelector(s).getBoundingClientRect().top; return y('.landing__word') < y('.landing__teaser') && y('.landing__teaser') < y('.landing__soon') }))
  ok(`landing@${w}: no FAQ/invite/demo text`, !/faq|invite|template|partner|demo/i.test(await p.locator('body').innerText()))
  await p.goto(DEMO + '/r/x7k2')
  await p.waitForTimeout(300)
  ok(`gate@${w}: /demo deep link shows the gate first`, (await p.locator('h1').innerText()) === 'Enter passcode' && new URL(p.url()).pathname.endsWith('/demo/r/x7k2'))
  ok(`gate@${w}: noindex on /demo`, (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  await audit(p, `gate@${w}`)
  await p.waitForTimeout(500)
  await p.screenshot({ path: `${OUT}/13-gate-${w}.png` })
  await p.getByLabel('Passcode').fill('definitely-wrong-000')
  await p.getByRole('button', { name: 'Open the preview' }).click()
  await p.waitForTimeout(300)
  ok(`gate@${w}: wrong code shows friendly error`, (await p.locator('#gate-msg').innerText()).includes('didn’t open') && (await p.getByLabel('Passcode').inputValue()) === '')
  ok(`gate@${w}: still gated after wrong code`, (await p.locator('.gate').count()) === 1)
  await p.screenshot({ path: `${OUT}/13-gate-error-${w}.png` })
  if (!PASSCODE) {
    ok(`gate@${w}: correct code unlocks`, false, 'passcode env var not set')
  } else {
    await p.getByLabel('Passcode').fill(PASSCODE)
    await p.getByRole('button', { name: 'Open the preview' }).click()
    await p.locator('.gate').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {})
    await p.waitForTimeout(300)
    ok(`gate@${w}: correct code unlocks the intended deep link`, (await p.locator('h1').innerText()) === 'Dinner’s on Jake' && new URL(p.url()).pathname.endsWith('/demo/r/x7k2'))
    await p.goto(DEMO + '/partner/run'); await p.waitForTimeout(300)
    ok(`gate@${w}: later /demo load in the same tab stays unlocked`, (await p.locator('.gate').count()) === 0 && (await p.locator('.partner__time').innerText()) === '50:12')
    await p.goto(DEMO + '/'); await p.waitForTimeout(300)
    ok(`gate@${w}: /demo/ welcome unlocked`, (await p.locator('.welcome').count()) === 1)
    const tab2 = await p.context().newPage()
    await tab2.goto(DEMO + '/partner/run'); await tab2.waitForTimeout(300)
    ok(`gate@${w}: a new tab asks again (sessionStorage)`, (await tab2.locator('h1').innerText()) === 'Enter passcode')
    await tab2.close()
  }
  ok(`errors gate@${w}`, p.errors.length === 0, p.errors.length ? 'page errors' : '')
  await p.context().close()
}

// logo: mark in header + welcome, icons served
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(DEMO + '/')
  await p.evaluate(() => document.fonts.ready)
  ok(`logo@${w}: welcome shows the mark (header + hero)`, (await p.locator('.welcome svg.mark').count()) === 2)
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/_logo-welcome-${w}.png` })
  await p.goto(DEMO + '/crew'); await p.waitForTimeout(400)
  ok(`logo@${w}: app header shows mark + akeru`, (await p.locator('.topbar .wordmark svg.mark').count()) === 1 && (await p.locator('.topbar .wordmark').innerText()).trim() === 'akeru')
  await p.screenshot({ path: `${OUT}/_logo-header-${w}.png`, clip: { x: 0, y: 0, width: w, height: 80 } })
  for (const u of ['/favicon.svg', '/apple-touch-icon.png']) {
    const r = await p.request.get(BASE + u)
    ok(`logo: ${u} served`, r.status() === 200 && (u.endsWith('svg') ? (await r.text()).includes('#121A2C') : true))
  }
  ok(`logo: index links apple-touch-icon`, (await p.locator('link[rel="apple-touch-icon"]').count()) === 1)
  await p.context().close()
}

// /partners integrate page
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(DEMO + '/partners')
  ok(`/partners@${w}: loads`, (await p.locator('h1').innerText()) === 'Akeru inside your app')
  await audit(p, `/partners@${w}`)
  await shot(p, `10-partners-${w}`)
  await p.getByRole('link', { name: 'See it from a partner app' }).click(); await nav(p, '**/partner/run')
  ok(`/partners@${w}: CTA opens partner example`, true)
  ok(`errors /partners@${w}`, p.errors.length === 0, p.errors.join(' | '))
  await p.context().close()
}

// ---------- reduced motion ----------
for (const w of [390, 1280]) {
  const p = await page(w, { reduced: true })
  await p.goto(DEMO + '/crew')
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
  await p.goto(DEMO + '/')
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
  found = false
  for (let i = 0; i < 4 && !found; i++) { await p.keyboard.press('Tab'); found = await p.evaluate(() => document.activeElement?.textContent?.trim().startsWith('Use')) }
  ok('keyboard: reach Use template button', found)
  await p.keyboard.press('Enter'); await nav(p, '**/lock')
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
  await p.goto(DEMO + '/')
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(300)
  const boxes = await p.evaluate(() => [...document.querySelectorAll('.welcome__kicker, .welcome__title, .welcome__tagline, .welcome__line, .welcome__hint, .welcome__credit, .demo-tag, .welcome__partner')].map((el) => {
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

// ---------- create your own template (builder) ----------
for (const w of [390, 1280]) {
  const p = await page(w)
  const err = (id) => p.locator(`#${id}`).innerText()
  await p.goto(DEMO + '/crew')
  await p.getByRole('button', { name: 'Create crew' }).click()
  await p.getByRole('button', { name: 'Choose what to lock' }).click(); await nav(p, '**/templates')
  const card = p.getByTestId('create-own')
  await card.scrollIntoViewIfNeeded()
  ok(`create@${w}: “Create your own” card on templates`, await card.isVisible())
  await p.screenshot({ path: `${OUT}/15-create-entry-${w}.png` })
  await card.click(); await nav(p, '**/demo/create')
  ok(`create@${w}: step 1 title`, (await p.locator('h1').innerText()) === 'Ask your question')
  ok(`create@${w}: noindex`, (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  await p.getByRole('button', { name: 'Next' }).click()
  ok(`create@${w}: empty question blocked`, (await err('q-msg')).includes('Write the question') && (await p.locator('h1').innerText()) === 'Ask your question')
  ok(`create@${w}: focus moves to the invalid field`, await p.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'q'))
  await shot(p, `15-create-step1-error-${w}`, false)
  await audit(p, `create step1@${w}`)
  await p.getByTestId('q').fill('Who cries first at the wedding?')
  await p.getByRole('button', { name: 'Next' }).click()
  ok(`create@${w}: step 2`, (await p.locator('h1').innerText()) === 'How does everyone answer?')
  await p.getByRole('button', { name: 'Next' }).click()
  ok(`create@${w}: no answer type blocked`, (await err('a-msg')).includes('Pick how'))
  await p.locator('label.opt', { hasText: 'Pick a crew member' }).click()
  await shot(p, `15-create-step2-${w}`, false)
  await audit(p, `create step2@${w}`)
  await p.getByRole('button', { name: 'Next' }).click()
  ok(`create@${w}: step 3`, (await p.locator('h1').innerText()) === 'When does it open?')
  await p.locator('label.opt', { hasText: 'A date and time' }).click()
  await p.getByRole('textbox', { name: 'Opens on' }).fill('2020-01-01T20:00')
  await p.getByRole('button', { name: 'Next' }).click()
  ok(`create@${w}: past date blocked`, (await err('w-msg')).includes('future'))
  await p.locator('label.opt', { hasText: 'Everyone checks in' }).click()
  await p.getByRole('button', { name: 'Next' }).click()
  ok(`create@${w}: empty place blocked`, (await err('p-msg')).includes('Add the place'))
  await p.getByTestId('place').fill('Rosa’s Cantina')
  await shot(p, `15-create-step3-${w}`, false)
  await audit(p, `create step3@${w}`)
  await p.getByRole('button', { name: 'Next' }).click()
  ok(`create@${w}: step 4`, (await p.locator('h1').innerText()) === 'Add a fun bit and a name')
  await p.locator('label.chip', { hasText: 'A stake' }).click()
  await p.getByTestId('fun').fill('Loser pays $20')
  await p.getByTestId('name').fill('Wedding tears')
  await p.getByRole('button', { name: 'Preview' }).click()
  ok(`create@${w}: money stake rejected`, (await err('f-msg')).includes('no money'))
  await shot(p, `15-create-step4-money-error-${w}`, false)
  await p.locator('label.chip', { hasText: 'A roast line' }).click()
  await p.locator('label.chip', { hasText: 'Jake' }).click()
  await p.getByTestId('fun').fill('Jake swore he wouldn’t cry. He brought tissues.')
  await p.getByTestId('name').fill('')
  await p.getByRole('button', { name: 'Preview' }).click()
  ok(`create@${w}: empty name blocked`, (await err('n-msg')).includes('Give your template a name'))
  await p.getByTestId('name').fill('Wedding tears')
  await p.locator('label.emoji', { has: p.locator('input[value="💍"]') }).click()
  await shot(p, `15-create-step4-${w}`, false)
  await audit(p, `create step4@${w}`)
  await p.getByRole('button', { name: 'Preview' }).click()
  const prev = p.getByTestId('preview')
  ok(`create@${w}: preview shows name, question, answer, opens, roast`, (await prev.innerText()).includes('Wedding tears') && (await prev.innerText()).includes('Who cries first') && (await prev.innerText()).includes('Pick a crew member') && (await prev.innerText()).includes('Rosa’s Cantina') && (await prev.innerText()).includes('He brought tissues'))
  const pub = p.locator('[data-testid="publish"] input')
  ok(`create@${w}: publish toggle defaults off`, !(await pub.isChecked()))
  await shot(p, `15-create-preview-${w}`)
  await audit(p, `create preview@${w}`)
  await p.getByTestId('publish').click()
  ok(`create@${w}: publish toggles on`, await pub.isChecked())
  await p.getByRole('button', { name: 'Use with Gate C Crew' }).click(); await nav(p, '**/lock')
  ok(`create@${w}: lock screen shows the custom question`, (await p.locator('h1').innerText()).includes('Who cries first'))
  await p.locator('label.chip', { hasText: 'Riley' }).click()
  await shot(p, `15-create-lock-${w}`)
  await audit(p, `create lock@${w}`)
  await p.getByRole('button', { name: 'Lock my call' }).click(); await nav(p, '**/locked')
  ok(`create@${w}: locked shows the check-in condition`, (await p.locator('.condition__text').innerText()) === 'All 5 checked in at Rosa’s Cantina')
  await shot(p, `15-create-locked-${w}`)
  await audit(p, `create locked@${w}`)
  await p.getByRole('button', { name: 'Simulate unlock' }).click(); await nav(p, '**/aketa')
  await p.locator('.aketa.phase-3').waitFor({ timeout: 5000 })
  await p.getByRole('button', { name: 'See everyone’s calls' }).click(); await nav(p, '**/reveal')
  ok(`create@${w}: reveal headline from custom logic`, (await p.locator('h1').innerText()).includes('It was Riley'))
  ok(`create@${w}: reveal shows 5 calls + roast`, (await p.locator('.calls__row').count()) === 5 && (await p.locator('.roast').innerText()).includes('He brought tissues'))
  await shot(p, `15-create-reveal-${w}`)
  await audit(p, `create reveal@${w}`)
  await p.locator('label.switch').click()
  await p.getByRole('button', { name: 'Share reveal card' }).click(); await nav(p, /\/demo\/r\/u-/)
  ok(`create@${w}: shared page for the custom template`, (await p.locator('h1').innerText()).includes('It was Riley'))
  await shot(p, `15-create-shared-${w}`)
  await audit(p, `create shared@${w}`)
  await p.goto(DEMO + '/templates'); await p.waitForTimeout(400)
  const mine = p.locator('label.tpl', { hasText: 'Wedding tears' })
  ok(`create@${w}: published template shows in the list`, (await mine.count()) === 1 && /your crew’s/i.test(await mine.innerText()))
  await shot(p, `15-create-published-${w}`, false)
  await audit(p, `create published@${w}`)
  // a second one: number + host opens, no publish
  await card.click(); await nav(p, '**/demo/create')
  await p.getByTestId('q').fill('How many toasts before dessert?')
  await p.getByRole('button', { name: 'Next' }).click()
  await p.locator('label.opt', { hasText: 'Number' }).click(); await p.getByRole('button', { name: 'Next' }).click()
  await p.locator('label.opt', { hasText: 'Open now' }).click(); await p.getByRole('button', { name: 'Next' }).click()
  await p.locator('label.chip', { hasText: 'A dare' }).click()
  await p.getByTestId('fun').fill('Closest-wrong gives the next toast')
  await p.getByTestId('name').fill('Toast count')
  await p.getByRole('button', { name: 'Preview' }).click()
  await p.getByRole('button', { name: 'Use with Gate C Crew' }).click(); await nav(p, '**/lock')
  await p.getByRole('button', { name: 'One more' }).click()
  ok(`create@${w}: number stepper works`, (await p.locator('.numpick__input').inputValue()) === '5')
  await p.getByRole('button', { name: 'Lock my call' }).click(); await nav(p, '**/locked')
  ok(`create@${w}: host “Open now” replaces simulate`, (await p.getByRole('button', { name: 'Open now' }).count()) === 1 && (await p.locator('.countdown').count()) === 0)
  await shot(p, `15-create-hostopen-${w}`, false)
  await p.getByRole('button', { name: 'Open now' }).click(); await nav(p, '**/aketa')
  await p.locator('.aketa.phase-3').waitFor({ timeout: 5000 })
  await p.getByRole('button', { name: 'See everyone’s calls' }).click(); await nav(p, '**/reveal')
  ok(`create@${w}: number reveal marks spot-on + dare`, (await p.locator('.calls__row', { hasText: 'Spot on' }).count()) >= 1 && (await p.locator('.funbit').innerText()).includes('next toast'))
  await audit(p, `create number reveal@${w}`)
  await p.goto(DEMO + '/templates'); await p.waitForTimeout(400)
  ok(`create@${w}: unpublished template not listed`, (await p.locator('label.tpl', { hasText: 'Toast count' }).count()) === 0)
  ok(`errors create@${w}`, p.errors.length === 0, p.errors.join(' | '))
  ok(`network create@${w}: no external requests`, p.external.length === 0, p.external.slice(0, 3).join(' '))
  await p.context().close()
}
// builder keyboard: Tab to the card, Enter, type, Enter-able radios via arrows
{
  const p = await page(390)
  await p.goto(DEMO + '/crew')
  await p.getByRole('button', { name: 'Create crew' }).click()
  await p.goto(DEMO + '/templates'); await p.waitForTimeout(400)
  await p.getByTestId('create-own').focus()
  const ring = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
  ok('create keyboard: card has a visible focus ring', ring === 'solid')
  await p.keyboard.press('Enter'); await nav(p, '**/demo/create')
  await p.waitForFunction(() => document.activeElement?.tagName === 'H1')
  await p.keyboard.press('Tab'); await p.keyboard.type('Who is late to brunch?')
  ok('create keyboard: Tab from title reaches the question', (await p.getByTestId('q').inputValue()) === 'Who is late to brunch?')
  await p.getByRole('button', { name: 'Next' }).focus(); await p.keyboard.press('Enter')
  await p.waitForTimeout(200)
  await p.locator('input[name="answer"]').first().focus(); await p.keyboard.press('Space')
  await p.keyboard.press('ArrowDown')
  ok('create keyboard: arrow keys move through answer types', await p.locator('input[value="number"]').isChecked())
  await p.context().close()
}

// ---------- invite your crew + join landing ----------
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(DEMO + '/crew')
  await p.getByRole('button', { name: 'Create crew' }).click()
  const entry = p.getByTestId('invite-entry')
  ok(`invite@${w}: entry on the crew screen`, await entry.isVisible())
  await shot(p, `16-invite-crew-entry-${w}`)
  await entry.click(); await nav(p, '**/demo/invite')
  ok(`invite@${w}: title`, (await p.locator('h1').innerText()) === 'Invite your crew')
  ok(`invite@${w}: noindex`, (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  ok(`invite@${w}: shows akeru.app/j/C7-GATE`, (await p.getByTestId('invite-link').innerText()) === 'akeru.app/j/C7-GATE')
  const expectUrl = BASE + '/j/C7-GATE'
  ok(`invite@${w}: QR is an inline SVG`, (await p.locator('[data-testid="qr"] > svg:not(.mark) > path').count()) === 1)
  // decode the QR from a screenshot, locally
  const { PNG } = await import('pngjs'); const jsQR = (await import('jsqr')).default
  const qrBuf = await p.getByTestId('qr').screenshot()
  const png = PNG.sync.read(qrBuf)
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
  ok(`invite@${w}: QR decodes to the working join link`, decoded?.data === expectUrl, decoded?.data ?? 'no decode')
  const sms = await p.getByTestId('share-sms').getAttribute('href')
  const wa = await p.getByTestId('share-whatsapp').getAttribute('href')
  const msg = `Join our crew on Akeru, we’re locking calls for Friday 🔒 ${expectUrl}`
  ok(`invite@${w}: Text href is sms: with message + link`, sms.startsWith('sms:') && decodeURIComponent(sms.split('body=')[1]) === msg, sms)
  ok(`invite@${w}: WhatsApp href is wa.me with message + link`, wa.startsWith('https://wa.me/?text=') && decodeURIComponent(wa.split('text=')[1]) === msg)
  ok(`invite@${w}: WhatsApp opens in a new tab safely`, (await p.getByTestId('share-whatsapp').getAttribute('rel')).includes('noopener'))
  const hasShare = await p.evaluate(() => typeof navigator.share === 'function')
  ok(`invite@${w}: native Share button only when navigator.share exists`, (await p.getByTestId('native-share').count()) === (hasShare ? 1 : 0), `navigator.share ${hasShare ? 'present' : 'absent'}`)
  // who's in: animates from 1 to 5
  const c0 = await p.getByTestId('who-count').innerText()
  await shot(p, `16-invite-screen-${w}`)
  await audit(p, `invite@${w}`)
  await p.waitForFunction(() => document.querySelector('[data-testid="who-count"]')?.textContent?.startsWith('5 of 5'), null, { timeout: 6000 })
  const names = await p.getByTestId('whos-in').innerText()
  ok(`invite@${w}: who’s in animates up to 5 of 5`, c0 !== '5 of 5 in' && ['Maya', 'Jake', 'Chris', 'Sam', 'Riley'].every((n) => names.includes(n)), `${c0} -> 5 of 5 in`)
  // copy link + code (clipboard granted for the check)
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })
  await p.getByTestId('copy-link').click()
  await p.waitForFunction(() => document.querySelector('[data-testid="toast"]')?.textContent?.trim(), null, { timeout: 2000 }).catch(() => {})
  ok(`invite@${w}: copy link confirms`, (await p.getByTestId('toast').innerText()) === 'Link copied')
  ok(`invite@${w}: clipboard has the working link`, (await p.evaluate(() => navigator.clipboard.readText())) === expectUrl)
  await p.getByTestId('qr').scrollIntoViewIfNeeded()
  await p.getByTestId('share-whatsapp').scrollIntoViewIfNeeded()
  await p.waitForTimeout(150)
  await p.screenshot({ path: `${OUT}/16-invite-qr-share-${w}.png` })
  await p.getByTestId('copy-code').click()
  await p.waitForFunction(() => document.querySelector('[data-testid="toast"]')?.textContent?.includes('Code'), null, { timeout: 2000 }).catch(() => {})
  ok(`invite@${w}: copy code confirms`, (await p.getByTestId('toast').innerText()) === 'Code C7-GATE copied' && (await p.evaluate(() => navigator.clipboard.readText())) === 'C7-GATE')
  await shot(p, `16-invite-done-${w}`)
  await audit(p, `invite done@${w}`)
  ok(`errors invite@${w}`, p.errors.length === 0, p.errors.join(' | '))
  ok(`network invite@${w}: no external requests (QR built locally)`, p.external.length === 0, p.external.slice(0, 3).join(' '))
  await p.context().close()

  // join landing as a new person (fresh tab, not in a crew)
  const j = await page(w)
  await j.goto(DEMO + '/j/C7-GATE'); await j.evaluate(() => document.fonts.ready); await j.waitForTimeout(300)
  ok(`join@${w}: Join Gate C Crew + inviter`, (await j.locator('h1').innerText()) === 'Join Gate C Crew' && (await j.locator('.lede').innerText()).includes('Maya Thompson invited you'))
  ok(`join@${w}: crew avatars`, (await j.locator('.join__faces li').count()) === 5)
  ok(`join@${w}: noindex`, (await j.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  await shot(j, `16-invite-join-landing-${w}`)
  await audit(j, `join@${w}`)
  const t0 = Date.now()
  await j.getByTestId('join').click(); await nav(j, '**/demo/first')
  ok(`firstlock@${w}: Join goes straight to the first lock (no crew/template/sign-up step)`, (await j.locator('h1').innerText()) === 'Who’s late to the gate?' && (await j.locator('input:not([type=radio]), textarea').count()) === 0)
  ok(`firstlock@${w}: noindex`, (await j.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  ok(`firstlock@${w}: five avatars to pick, Lock disabled until a pick`, (await j.locator('.facepick__opt').count()) === 5 && await j.getByTestId('first-lock').isDisabled())
  await shot(j, `17-firstlock-pick-${w}`)
  await audit(j, `firstlock pick@${w}`)
  await j.getByTestId('pick-jake').click()                       // tap 1
  ok(`firstlock@${w}: pick selects Jake`, await j.locator('input[value="jake"]').isChecked() && await j.getByTestId('first-lock').isEnabled())
  await shot(j, `17-firstlock-picked-${w}`)
  const took = (Date.now() - t0) / 1000
  await j.getByTestId('first-lock').click()                      // tap 2
  await j.waitForTimeout(200)
  ok(`firstlock@${w}: seal animation playing (motion allowed)`, (await j.locator('.seal--closing').count()) === 1)
  await j.screenshot({ path: `${OUT}/17-firstlock-sealing-${w}.png` })
  await j.locator('.seal--done').waitFor({ timeout: 3000 })
  const el = await j.getByTestId('elapsed').innerText()
  ok(`firstlock@${w}: elapsed hint shows real seconds`, /^Locked in \d+s$/i.test(el) && Math.abs(parseInt(el.match(/\d+/)[0]) - took) <= 2, `${el} (test measured ${took.toFixed(1)}s from Join to the Lock tap, incl. screenshots; 2 taps after arriving)`)
  ok(`firstlock@${w}: “You’re in, it opens when…” line`, (await j.locator('h1').innerText()).startsWith('You’re in. It opens when all five of you'))
  const k1 = await j.getByTestId('fl-countdown').innerText(); await j.waitForTimeout(1200)
  ok(`firstlock@${w}: countdown ticks`, k1 !== (await j.getByTestId('fl-countdown').innerText()))
  await shot(j, `17-firstlock-sealed-${w}`)
  await audit(j, `firstlock sealed@${w}`)
  await j.getByTestId('to-crew').click(); await nav(j, '**/demo/crew')
  ok(`firstlock@${w}: link into the crew; crew shows the locked first call`, (await j.locator('.crewcard .kicker').textContent()).trim() === 'You’re in' && (await j.locator('.crewcard__name').innerText()) === 'Gate C Crew' && (await j.getByTestId('crew-firstlock').count()) === 1)
  ok(`firstlock@${w}: invite still reachable from crew`, await j.getByTestId('invite-entry').isVisible())
  await shot(j, `17-firstlock-crew-${w}`)
  await shot(j, `16-invite-after-join-${w}`)
  await audit(j, `after join@${w}`)
  await j.goto(DEMO + '/j/C7-GATE'); await j.waitForTimeout(300)
  ok(`join@${w}: already a member is not asked to join again`, (await j.locator('h1').innerText()).includes('already in') && (await j.getByTestId('join').count()) === 0)
  ok(`firstlock@${w}: repeat join link does not re-trap a locked member`, (await j.getByTestId('see-first').count()) === 1 && !new URL(j.url()).pathname.endsWith('/first'))
  await j.goto(BASE + '/j/C7-GATE'); await j.waitForTimeout(300)
  ok(`firstlock@${w}: /j/ alias for a locked member also lands on already-in`, (await j.locator('h1').innerText()).includes('already in'))
  await shot(j, `16-invite-already-in-${w}`, false)
  await j.getByTestId('go-crew').click(); await nav(j, '**/demo/crew')
  ok(`join@${w}: already-in continues to the crew`, true)
  await j.goto(BASE + '/j/c7-gate'); await j.waitForTimeout(300)
  ok(`join@${w}: /j/ pretty link reaches the same join page`, new URL(j.url()).pathname === '/demo/j/c7-gate' && (await j.locator('h1').innerText()).includes('Gate C Crew'))
  await j.goto(DEMO + '/j/NOPE-42'); await j.waitForTimeout(300)
  ok(`join@${w}: unknown code shows friendly error`, (await j.getByTestId('join-error').innerText()) === 'This invite doesn’t open anything' && (await j.locator('.lede').innerText()).includes('NOPE-42'))
  ok(`join@${w}: error has a way back`, (await j.getByRole('link', { name: 'Enter a code instead' }).count()) === 1 && (await j.getByRole('link', { name: 'Back to the demo' }).count()) === 1)
  await shot(j, `16-invite-unknown-code-${w}`, false)
  await audit(j, `join error@${w}`)
  await j.getByRole('link', { name: 'Enter a code instead' }).click(); await nav(j, '**/demo/crew')
  ok(`join@${w}: error CTA returns to crew`, true)
  ok(`errors join@${w}`, j.errors.length === 0, j.errors.join(' | '))
  ok(`network join@${w}: no external requests`, j.external.length === 0)
  await j.context().close()
}
// invite + join behind the gate
for (const w of [390, 1280]) {
  const p = await page(w, { locked: true })
  for (const path of ['/j/C7-GATE', '/demo/j/C7-GATE', '/demo/invite']) {
    await p.goto(BASE + path); await p.waitForTimeout(300)
    ok(`gate@${w}: ${path} shows the gate first`, (await p.locator('h1').innerText()) === 'Enter passcode' && (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  }
  await p.goto(BASE + '/j/C7-GATE'); await p.waitForTimeout(300)
  if (!PASSCODE) ok(`gate@${w}: /j/ after unlock`, false, 'passcode env var not set')
  else {
    await p.getByLabel('Passcode').fill(PASSCODE)
    await p.getByRole('button', { name: 'Open the preview' }).click()
    await p.locator('.gate').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {})
    await p.waitForTimeout(300)
    ok(`gate@${w}: /j/C7-GATE unlocks onto the join page`, (await p.locator('h1').innerText()) === 'Join Gate C Crew')
  }
  await p.goto(BASE + '/'); await p.waitForTimeout(300)
  ok(`landing@${w}: still no links (no invite/demo links)`, (await p.locator('a[href]').count()) === 0)
  await p.context().close()
}
// reduced motion: who's in shows the final state at once
for (const w of [390, 1280]) {
  const p = await page(w, { reduced: true })
  await p.goto(DEMO + '/crew')
  await p.getByRole('button', { name: 'Create crew' }).click()
  await p.getByTestId('invite-entry').click(); await nav(p, '**/demo/invite')
  ok(`reduced motion invite@${w}: who’s in is final immediately`, (await p.getByTestId('who-count').innerText()) === '5 of 5 in' && (await p.locator('.whosin__row.is-in').count()) === 4)
  await p.context().close()
}
// first lock: reduced motion shows the sealed final state at once; gate still applies
for (const w of [390, 1280]) {
  const p = await page(w, { reduced: true })
  await p.goto(DEMO + '/j/C7-GATE'); await p.waitForTimeout(300)
  await p.getByTestId('join').click(); await nav(p, '**/demo/first')
  await p.getByTestId('pick-sam').click(); await p.getByTestId('first-lock').click(); await p.waitForTimeout(60)
  ok(`firstlock reduced motion@${w}: final sealed state immediately`, (await p.locator('.seal--done').count()) === 1 && (await p.locator('.seal--closing').count()) === 0)
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.seal__lock')).animationName)
  ok(`firstlock reduced motion@${w}: no seal animation`, anim === 'none', anim)
  await p.screenshot({ path: `${OUT}/17-firstlock-reduced-motion-${w}.png` })
  await p.context().close()
  const g = await page(w, { locked: true })
  await g.goto(DEMO + '/first'); await g.waitForTimeout(300)
  ok(`firstlock gate@${w}: /demo/first is gated`, (await g.locator('h1').innerText()) === 'Enter passcode')
  await g.context().close()
}

// ---------- FAQ ----------
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(DEMO + '/'); await p.waitForTimeout(300)
  ok(`faq@${w}: welcome nav + footer link to /demo/faq`, (await p.getByTestId('nav-faq').getAttribute('href')) === '/demo/faq' && (await p.getByTestId('foot-faq').getAttribute('href')) === '/demo/faq')
  await p.getByTestId('foot-faq').click(); await nav(p, '**/demo/faq')
  ok(`faq@${w}: footer link opens the FAQ`, (await p.locator('h1').innerText()) === 'Questions, answered')
  ok(`faq@${w}: app top bar has an FAQ link`, (await p.locator('.topbar [data-testid="nav-faq"]').getAttribute('href')) === '/demo/faq')
  ok(`faq@${w}: noindex`, (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  const qs = await p.locator('.faq__btn').allInnerTexts()
  const want = ['What is Akeru?', 'What’s a lock?', 'What can unlock it?', 'Who sees my locks?', 'Can a reveal be shared?', 'Is there betting or money?', 'What are templates, and can I make my own?', 'How do I invite friends?', 'What do partners see?', 'What does Akeru mean?', 'Is there an app?']
  ok(`faq@${w}: all 11 questions in order`, JSON.stringify(qs.map((x) => x.trim())) === JSON.stringify(want), qs.length + ' found')
  ok(`faq@${w}: all collapsed, aria-expanded=false + aria-controls`, (await p.locator('.faq__btn[aria-expanded="false"][aria-controls]').count()) === 11 && (await p.locator('.faq__panel:visible').evaluateAll((e) => e.filter((x) => getComputedStyle(x).visibility === 'visible').length)) === 0)
  await shot(p, `18-faq-collapsed-${w}`)
  await audit(p, `faq@${w}`)
  const b5 = p.locator('#faq-q-4')
  await b5.click(); await p.waitForTimeout(350)
  ok(`faq@${w}: click expands`, (await b5.getAttribute('aria-expanded')) === 'true' && await p.locator('#faq-a-4').isVisible() && (await p.locator('#faq-a-4').innerText()).includes('I’m laughing too'))
  await b5.scrollIntoViewIfNeeded()
  await p.screenshot({ path: `${OUT}/18-faq-expanded-${w}.png` })
  await p.locator('#faq-q-9').click(); await p.waitForTimeout(350)
  ok(`faq@${w}: meaning answer has 開ける and 開けた`, (await p.locator('#faq-a-9').innerText()).includes('開ける') && (await p.locator('#faq-a-9').innerText()).includes('開けた'))
  await p.locator('#faq-q-9').scrollIntoViewIfNeeded()
  await p.screenshot({ path: `${OUT}/18-faq-expanded-meaning-${w}.png` })
  await audit(p, `faq expanded@${w}`)
  await b5.click(); await p.waitForTimeout(350)
  ok(`faq@${w}: click collapses`, (await b5.getAttribute('aria-expanded')) === 'false' && !(await p.locator('#faq-a-4').isVisible()))
  const all = await p.locator('body').innerText()
  ok(`faq@${w}: no dates, prices or user numbers`, !/\b20\d\d\b|\$|€|£|\bfree\b|\bprice|\busers\b|\bmillion|\bQ[1-4]\b/i.test(all.split('Questions, answered')[1] ?? all))
  ok(`errors faq@${w}`, p.errors.length === 0, p.errors.join(' | '))
  await p.context().close()
}
{
  const p = await page(390)
  await p.goto(DEMO + '/faq'); await p.waitForTimeout(300)
  await p.locator('#faq-q-0').focus()
  await p.keyboard.press('Enter'); await p.waitForTimeout(300)
  ok('faq keyboard: Enter opens', (await p.locator('#faq-q-0').getAttribute('aria-expanded')) === 'true')
  await p.keyboard.press('Space'); await p.waitForTimeout(300)
  ok('faq keyboard: Space closes', (await p.locator('#faq-q-0').getAttribute('aria-expanded')) === 'false')
  await p.keyboard.press('ArrowDown')
  ok('faq keyboard: ArrowDown moves to the next question', await p.evaluate(() => document.activeElement?.id === 'faq-q-1'))
  await p.keyboard.press('End')
  ok('faq keyboard: End jumps to the last', await p.evaluate(() => document.activeElement?.id === 'faq-q-10'))
  await p.keyboard.press('ArrowDown')
  ok('faq keyboard: ArrowDown wraps to the first', await p.evaluate(() => document.activeElement?.id === 'faq-q-0'))
  ok('faq keyboard: visible focus ring', await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle === 'solid'))
  await p.keyboard.press('Tab')
  ok('faq keyboard: collapsed answers are not in the Tab order trap (next Tab is the next question)', await p.evaluate(() => document.activeElement?.id === 'faq-q-1'))
  await p.screenshot({ path: `${OUT}/18-faq-keyboard-390.png` })
  await p.context().close()
  const r = await page(1280, { reduced: true })
  await r.goto(DEMO + '/faq'); await r.waitForTimeout(300)
  ok('faq reduced motion: no accordion transition', await r.evaluate(() => getComputedStyle(document.querySelector('.faq__panel')).transitionDuration.split(',').every((x) => parseFloat(x) < 0.01)))
  await r.context().close()
  const g = await page(390, { locked: true })
  await g.goto(DEMO + '/faq'); await g.waitForTimeout(300)
  ok('faq gate: /demo/faq shows the gate first', (await g.locator('h1').innerText()) === 'Enter passcode')
  await g.goto(BASE + '/'); await g.waitForTimeout(300)
  ok('faq: absent from the public landing', (await g.locator('a[href*="faq"]').count()) === 0 && !/faq/i.test(await g.locator('body').innerText()))
  await g.context().close()
}


// ---------- crew stats ----------
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(DEMO + '/crew')
  await p.getByRole('button', { name: 'Create crew' }).click()
  await p.getByTestId('crew-stats').click(); await nav(p, '**/demo/stats')
  ok(`stats@${w}: opens from the crew screen`, (await p.locator('h1').innerText()) === 'Crew stats')
  ok(`stats@${w}: noindex`, (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  for (const sec of ['called', 'badges', 'wall', 'memories']) ok(`stats@${w}: section ${sec} renders`, await p.getByTestId(`sec-${sec}`).isVisible())
  ok(`stats@${w}: called-it shows hits, rate, streak with badges`, (await p.locator('[data-testid="sec-called"] .statcard .bdg').count()) === 3 && /7[\s\S]*58%[\s\S]*3/.test(await p.getByTestId('sec-called').innerText()))
  const earned = await p.locator('.badgegrid .badgecell.is-earned').count(), locked = await p.locator('.badgegrid .badgecell.is-locked').count()
  ok(`stats@${w}: badges show earned and locked states`, earned >= 3 && locked >= 2 && earned + locked === 8, `${earned} earned, ${locked} locked`)
  const svgs = await p.locator('.badgegrid .bdg > svg').evaluateAll((els) => els.map((e) => e.querySelector('g')?.innerHTML))
  ok(`stats@${w}: eight distinct inline SVG badges`, new Set(svgs).size === 8)
  ok(`stats@${w}: earned badge shimmers (motion allowed)`, await p.evaluate(() => getComputedStyle(document.querySelector('.bdg.is-on'), '::after').animationName === 'shimmer'))
  await shot(p, `20-stats-top-${w}`, false)
  await audit(p, `stats@${w}`)
  await p.getByTestId('sec-badges').scrollIntoViewIfNeeded(); await p.waitForTimeout(150)
  await p.screenshot({ path: `${OUT}/20-stats-badges-${w}.png` })
  // opt-in share card
  const btn = p.getByTestId('badge-share-btn')
  ok(`stats@${w}: badge share off until opt-in`, await btn.isDisabled() && !(await p.locator('[data-testid="badge-optin"] input').isChecked()))
  await p.getByTestId('badge-share').scrollIntoViewIfNeeded()
  await p.screenshot({ path: `${OUT}/20-stats-share-off-${w}.png` })
  await p.getByTestId('badge-optin').click()
  ok(`stats@${w}: opt-in enables Make share card`, await btn.isEnabled())
  await btn.click()
  ok(`stats@${w}: card ready, nothing posted`, (await p.locator('#bs-state').innerText()).includes('nothing was posted') && (await p.locator('.badgecard.is-ready').count()) === 1)
  await p.getByTestId('badge-share').scrollIntoViewIfNeeded(); await p.waitForTimeout(150)
  await p.screenshot({ path: `${OUT}/20-stats-share-card-${w}.png` })
  await p.getByTestId('sec-wall').scrollIntoViewIfNeeded(); await p.waitForTimeout(150)
  await p.screenshot({ path: `${OUT}/20-stats-crew-wall-${w}.png` })
  await p.getByTestId('sec-memories').scrollIntoViewIfNeeded(); await p.waitForTimeout(150)
  await p.screenshot({ path: `${OUT}/20-stats-memories-${w}.png` })
  const body = await p.locator('main, .screen').first().innerText()
  ok(`stats@${w}: no shaming or money copy`, !/last place|worst|loser|shame|\$|money won|cash|bet\b/i.test(body.replace('No money, ever.', '')))
  const hrefs = await p.locator('[data-testid^="mem-"]').evaluateAll((a) => a.map((x) => x.getAttribute('href')))
  ok(`stats@${w}: memories link to the six reveal routes`, JSON.stringify(hrefs) === JSON.stringify(['/demo/r/x7k2', '/demo/r/c4ps', '/demo/r/r10k', '/demo/r/m0ab', '/demo/r/m4h2', '/demo/r/n5t3']), hrefs.join(' '))
  await p.getByTestId('mem-reunion').click(); await nav(p, '**/demo/r/c4ps')
  ok(`stats@${w}: memory link opens the reveal`, (await p.locator('h1').innerText()) === 'Ten years, five predictions')
  await p.goBack(); await nav(p, '**/demo/stats')
  await p.locator('[data-testid="sec-wall"] [data-testid="av-sam"]').click(); await nav(p, '**/demo/u/sam')
  ok(`stats@${w}: crew-wall avatar opens Sam’s profile`, (await p.locator('h1').innerText()) === 'Sam Bennett')
  ok(`errors stats@${w}`, p.errors.length === 0, p.errors.join(' | '))
  ok(`network stats@${w}: no external requests (icons inline)`, p.external.length === 0, p.external.slice(0, 3).join(' '))
  await p.context().close()
}
{
  const p = await page(390)
  await p.goto(DEMO + '/crew'); await p.waitForTimeout(300)
  await p.getByTestId('nav-more').click()
  ok('nav: More menu opens with Stats, FAQ, Coming soon', (await p.getByTestId('nav-more').getAttribute('aria-expanded')) === 'true' && await p.getByTestId('nav-stats').isVisible() && await p.getByTestId('nav-soon').isVisible())
  await p.screenshot({ path: `${OUT}/20-stats-nav-menu-390.png` })
  await p.getByTestId('nav-stats').click(); await nav(p, '**/demo/stats')
  ok('stats: opens from the demo nav', (await p.locator('h1').innerText()) === 'Crew stats')
  await p.getByTestId('nav-more').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(100)
  ok('nav keyboard: Enter opens, focus on first item', await p.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'nav-stats'))
  await p.keyboard.press('ArrowDown')
  ok('nav keyboard: ArrowDown moves to FAQ', await p.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'nav-faq'))
  await p.keyboard.press('Escape')
  ok('nav keyboard: Escape closes and returns focus', (await p.getByTestId('nav-more').getAttribute('aria-expanded')) === 'false' && await p.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'nav-more'))
  let hit = false
  for (let i = 0; i < 40 && !hit; i++) { await p.keyboard.press('Tab'); hit = await p.evaluate(() => document.activeElement?.closest('[data-testid="badge-optin"]') !== null) }
  await p.keyboard.press('Space')
  ok('stats keyboard: Tab reaches the opt-in switch, Space turns it on', hit && await p.getByTestId('badge-share-btn').isEnabled())
  await p.context().close()
  const r = await page(1280, { reduced: true })
  await r.goto(DEMO + '/stats'); await r.waitForTimeout(300)
  ok('stats reduced motion: no badge shimmer', await r.evaluate(() => { const s = getComputedStyle(document.querySelector('.bdg.is-on'), '::after'); return s.animationName === 'none' || s.display === 'none' }))
  await r.context().close()
  const g = await page(390, { locked: true })
  for (const path of ['/demo/stats', '/demo/u/maya', '/demo/soon']) {
    await g.goto(BASE + path); await g.waitForTimeout(300)
    ok(`gate: ${path} shows the gate first + noindex`, (await g.locator('h1').innerText()) === 'Enter passcode' && (await g.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  }
  await g.goto(BASE + '/'); await g.waitForTimeout(300)
  ok('landing: no stats, profile, soon or FAQ links/text', (await g.locator('a[href]').count()) === 0 && !/stats|profile|coming soon page|faq|badge/i.test((await g.locator('body').innerText()).replace('coming soon', '')))
  await g.context().close()
}

// ---------- profiles ----------
const PEOPLE = { maya: 'Maya Thompson', jake: 'Jake Miller', chris: 'Chris Alvarez', sam: 'Sam Bennett', riley: 'Riley Brooks' }
for (const w of [390, 1280]) {
  const p = await page(w)
  for (const [slug, name] of Object.entries(PEOPLE)) {
    await p.goto(DEMO + '/u/' + slug); await p.waitForTimeout(300)
    const txt = await p.locator('.screen__main').innerText()
    ok(`profile ${slug}@${w}: loads with title badge, stats, badges, reveals`, (await p.locator('h1').innerText()) === name && (await p.getByTestId('title-badge').count()) === 1 && /calls made/i.test(txt) && /called it/i.test(txt) && /current streak/i.test(txt) && /best streak/i.test(txt) && (await p.locator('.badgecell.is-earned').count()) >= 2 && (await p.locator('.badgecell.is-locked').count()) >= 1 && (await p.locator('[data-testid^="prof-rev-"]').count()) === 3)
    ok(`profile ${slug}@${w}: positive only`, !/worst|last place|loser|roast/i.test(txt))
    if (slug === 'maya' || slug === 'sam') {
      await shot(p, `21-profile-${slug}-${w}`)
      await audit(p, `profile ${slug}@${w}`)
    }
  }
  await p.goto(DEMO + '/u/maya'); await p.waitForTimeout(300)
  ok(`profile@${w}: noindex`, (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  await p.getByTestId('prof-rev-reunion').click(); await nav(p, '**/demo/r/c4ps')
  ok(`profile@${w}: recent reveal link opens the reveal`, (await p.locator('h1').innerText()) === 'Ten years, five predictions')
  // avatar links from the shared reveal and the crew screen
  await p.goto(DEMO + '/r/x7k2'); await p.waitForTimeout(300)
  await p.locator('.pubcalls [data-testid="av-jake"]').click(); await nav(p, '**/demo/u/jake')
  ok(`profile@${w}: reveal avatar reaches Jake`, (await p.locator('h1').innerText()) === 'Jake Miller')
  await p.goto(DEMO + '/crew'); await p.getByRole('button', { name: 'Create crew' }).click()
  await p.locator('.members [data-testid="av-riley"]').click(); await nav(p, '**/demo/u/riley')
  ok(`profile@${w}: crew avatar reaches Riley`, (await p.locator('h1').innerText()) === 'Riley Brooks')
  await p.goto(DEMO + '/u/nobody'); await p.waitForTimeout(300)
  ok(`profile@${w}: unknown slug shows friendly error + way back`, (await p.getByTestId('prof-missing').innerText()).includes('No one by that name') && (await p.getByRole('link', { name: 'Back to the crew' }).count()) === 1)
  await shot(p, `21-profile-unknown-${w}`, false)
  await audit(p, `profile unknown@${w}`)
  ok(`errors profile@${w}`, p.errors.length === 0, p.errors.join(' | '))
  await p.context().close()
}
{
  const p = await page(390)
  await p.goto(DEMO + '/r/x7k2'); await p.waitForTimeout(300)
  await p.locator('.pubcalls [data-testid="av-chris"]').focus()
  ok('profile keyboard: avatar link has a visible focus ring', await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle === 'solid'))
  await p.keyboard.press('Enter'); await nav(p, '**/demo/u/chris')
  ok('profile keyboard: Enter on avatar opens the profile', (await p.locator('h1').innerText()) === 'Chris Alvarez')
  await p.context().close()
}

// ---------- past runs strip on reveal pages ----------
for (const w of [390, 1280]) {
  const p = await page(w)
  for (const [slug, tid, name] of [['x7k2', 'dinner', 'dinner'], ['c4ps', 'reunion', 'reunion'], ['r10k', 'run', 'run']]) {
    await p.goto(DEMO + '/r/' + slug); await p.waitForTimeout(300)
    const strip = p.getByTestId('past-runs')
    const n = await strip.locator('.pastruns__item').count()
    ok(`past runs /r/${slug}@${w}: 2–3 earlier runs with who called it`, n >= 2 && n <= 3 && (await strip.innerText()).includes('called it'))
    ok(`past runs /r/${slug}@${w}: positive only`, !/missed|wrong|worst|loser/i.test(await strip.innerText()))
    await strip.scrollIntoViewIfNeeded(); await p.waitForTimeout(150)
    if (slug !== 'r10k') await p.screenshot({ path: `${OUT}/22-past-runs-${name}-${w}.png` })
    await audit(p, `past runs ${slug}@${w}`)
    if (slug === 'c4ps') {
      await strip.getByTestId('run-it').click(); await nav(p, '**/demo/lock')
      ok(`past runs@${w}: Run it with your crew starts the reunion lock with Gate C Crew`, await p.evaluate(() => { const v = JSON.parse(sessionStorage.getItem('akeru.demo.v1')); return v.templateId === 'reunion' && v.crewName === 'Gate C Crew' }))
    }
  }
  ok(`errors past runs@${w}`, p.errors.length === 0, p.errors.join(' | '))
  await p.context().close()
}
{
  const p = await page(390)
  await p.goto(DEMO + '/r/m0ab'); await p.waitForTimeout(300)
  let hit = false
  for (let i = 0; i < 40 && !hit; i++) { await p.keyboard.press('Tab'); hit = await p.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'run-it') }
  ok('past runs keyboard: Tab reaches Run it with your crew', hit)
  await p.keyboard.press('Enter'); await nav(p, '**/demo/lock')
  ok('past runs keyboard: Enter starts the road trip lock', await p.evaluate(() => JSON.parse(sessionStorage.getItem('akeru.demo.v1')).templateId === 'roadtrip'))
  await p.context().close()
}

// ---------- coming soon ----------
const PLANNED = ['Native iOS and Android apps', 'A template results history', 'Push reminders before an unlock', 'A group-chat share for opt-in reveal cards']
const EXPLORING = ['A photo or voice note lock', 'A time capsule lock months out', 'Live event unlocks from partners', 'A seasonal badge set', 'Cause crews', 'A crew yearbook', 'Calendar-linked unlocks', 'Multi-language crews']
for (const w of [390, 1280]) {
  const p = await page(w)
  await p.goto(DEMO + '/'); await p.waitForTimeout(300)
  ok(`soon@${w}: welcome footer links to /demo/soon`, (await p.getByTestId('foot-soon').getAttribute('href')) === '/demo/soon')
  await audit(p, `welcome footer@${w}`)
  await p.getByTestId('foot-soon').click(); await nav(p, '**/demo/soon')
  ok(`soon@${w}: footer link opens Coming soon`, (await p.locator('h1').innerText()) === 'Coming soon')
  ok(`soon@${w}: noindex`, (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
  const pl = await p.getByTestId('soon-planned').innerText(), ex = await p.getByTestId('soon-exploring').innerText()
  ok(`soon@${w}: Planned has all 4 items`, PLANNED.every((x) => pl.includes(x)) && (await p.locator('[data-testid="soon-planned"] .soon__card').count()) === 4)
  ok(`soon@${w}: Exploring has all 8 items`, EXPLORING.every((x) => ex.includes(x)) && (await p.locator('[data-testid="soon-exploring"] .soon__card').count()) === 8)
  ok(`soon@${w}: each card has its own inline SVG icon`, (await p.locator('.soon__icon svg').count()) === 12 && new Set(await p.locator('.soon__icon svg').evaluateAll((e) => e.map((x) => x.innerHTML))).size === 12)
  const txt = await p.locator('.screen__main').innerText()
  ok(`soon@${w}: feedback note, no dates/prices/user counts`, /shaped by crew feedback/i.test(txt) && !/\b(20\d\d|Q[1-4]|january|february|march|april|june|july|august|september|october|november|december|next month|this year)\b|\$|€|users|free/i.test(txt))
  const fb = p.getByTestId('feedback')
  ok(`soon@${w}: feedback button is a mailto (sends nothing itself)`, (await fb.getAttribute('href')).startsWith('mailto:') && !(await fb.getAttribute('href')).includes('@'))
  await shot(p, `23-soon-${w}`)
  await audit(p, `soon@${w}`)
  await p.getByTestId('nav-more').click(); await p.getByTestId('nav-soon').click(); await p.waitForTimeout(300)
  ok(`soon@${w}: reachable from the demo nav`, (await p.locator('h1').innerText()) === 'Coming soon')
  ok(`errors soon@${w}`, p.errors.length === 0, p.errors.join(' | '))
  ok(`network soon@${w}: no external requests`, p.external.length === 0)
  await p.context().close()
}
{
  const p = await page(390)
  await p.goto(DEMO + '/soon'); await p.waitForTimeout(300)
  let hit = false
  for (let i = 0; i < 20 && !hit; i++) { await p.keyboard.press('Tab'); hit = await p.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'feedback') }
  ok('soon keyboard: Tab reaches the feedback button with visible focus', hit && await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle === 'solid'))
  await p.context().close()
}

// keyboard: crew -> invite -> copy, share links reachable with Tab
{
  const p = await page(390)
  await p.goto(DEMO + '/crew')
  await p.getByRole('button', { name: 'Create crew' }).click()
  await p.getByTestId('invite-entry').focus(); await p.keyboard.press('Enter'); await nav(p, '**/demo/invite')
  ok('invite keyboard: Enter on the entry opens invite, focus on title', await p.waitForFunction(() => document.activeElement?.tagName === 'H1', null, { timeout: 2000 }).then(() => true, () => false))
  const seen = []
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press('Tab')
    seen.push(await p.evaluate(() => { const a = document.activeElement; return (a?.getAttribute('data-testid') || a?.textContent || '').trim() + '|' + getComputedStyle(a).outlineStyle }))
  }
  const ids = seen.map((s) => s.split('|')[0])
  ok('invite keyboard: copy, code, Text, WhatsApp all reachable', ['copy-link', 'copy-code', 'share-sms', 'share-whatsapp'].every((x) => ids.includes(x)), ids.join(', '))
  ok('invite keyboard: visible focus on each', seen.filter((s) => ['copy-link', 'copy-code', 'share-sms', 'share-whatsapp'].includes(s.split('|')[0])).every((s) => s.endsWith('solid')))
  await p.goto(DEMO + '/j/C7-GATE'); await p.waitForTimeout(300)
  const p2 = await page(390); await p2.goto(DEMO + '/j/C7-GATE'); await p2.waitForTimeout(300)
  await p2.keyboard.press('Tab')
  ok('join keyboard: first Tab reaches Join', await p2.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'join'))
  await p2.keyboard.press('Enter'); await nav(p2, '**/demo/first')
  ok('join keyboard: Enter joins and opens first lock', (await p2.locator('h1').innerText()) === 'Who’s late to the gate?')
  let hit = false
  for (let i = 0; i < 10 && !hit; i++) { await p2.keyboard.press('Tab'); hit = await p2.evaluate(() => document.activeElement?.getAttribute('name') === 'first') }
  await p2.keyboard.press('ArrowRight'); await p2.keyboard.press('Space')
  const ring = await p2.evaluate(() => getComputedStyle(document.activeElement.closest('label')).outlineStyle)
  ok('firstlock keyboard: Tab into the picks, arrows pick, visible focus', hit && (await p2.locator('input[name="first"]:checked').count()) === 1 && ring === 'solid')
  hit = false
  for (let i = 0; i < 10 && !hit; i++) { await p2.keyboard.press('Tab'); hit = await p2.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'first-lock') }
  await p2.keyboard.press('Enter'); await p2.waitForTimeout(1400)
  ok('firstlock keyboard: Enter on Lock seals, focus on the sealed heading', hit && await p2.evaluate(() => document.activeElement?.tagName === 'H1' && document.activeElement.textContent.startsWith('You’re in')))
  hit = false
  for (let i = 0; i < 10 && !hit; i++) { await p2.keyboard.press('Tab'); hit = await p2.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'to-crew') }
  await p2.keyboard.press('Enter'); await nav(p2, '**/demo/crew')
  ok('firstlock keyboard: link into the crew', hit)
  await p.context().close(); await p2.context().close()
}

await browser.close()
const failed = results.filter((r) => !r.pass)
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2))
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
