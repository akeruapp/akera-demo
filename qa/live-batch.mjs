// Live check for the nav / custom crew / contact batch.
// Usage: BASE=https://akeru.app node qa/live-batch.mjs   (passcode read from AKERU_DEMO_PASSCODE, never printed)
import { chromium, webkit } from 'playwright'
import fs from 'node:fs'
const BASE = (process.env.BASE ?? 'https://akeru.app').replace(/\/$/, '')
const DEMO = BASE + '/demo'
const OUT = process.env.OUT ?? 'qa/out-live'
const PREFIX = process.env.PREFIX ?? '27-live'
const PASSCODE = process.env.AKERU_DEMO_PASSCODE
if (!PASSCODE) { console.log('FAIL  AKERU_DEMO_PASSCODE not set'); process.exit(1) }
fs.mkdirSync(OUT, { recursive: true })
let pass = 0, fail = 0
const ok = (n, c, d = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`) }
const h1 = async (p) => (await p.locator('main h1, h1').first().innerText()).trim()
const settle = (p, ms = 600) => p.waitForTimeout(ms)
const SAMPLE = /C7-?GATE|Gate C Crew|Denver/i
async function unlock(p) {
  if (await p.locator('.gate').count()) {
    await p.getByLabel('Passcode').fill(PASSCODE)
    await p.getByRole('button', { name: 'Open the preview' }).click()
    await p.locator('.gate').waitFor({ state: 'detached', timeout: 6000 }).catch(() => {}); await settle(p)
  }
}
const ctxFor = (br, w, bn) => br.newContext({ viewport: { width: w, height: w < 600 ? 844 : 800 }, deviceScaleFactor: w < 600 ? 2 : 1, hasTouch: w < 600, isMobile: bn === 'webkit' && w < 600 })

const cr = await chromium.launch(), wk = await webkit.launch()
for (const [bn, br] of [['chromium', cr], ['webkit', wk]]) {
  for (const w of [390, 1280]) {
    const tag = `(${bn})@${w}`
    const ctx = await ctxFor(br, w, bn); const p = await ctx.newPage()
    const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
    // landing public
    await p.goto(BASE + '/'); await settle(p)
    ok(`landing public ${tag}`, (await p.locator('.gate').count()) === 0 && (await p.locator('.landing__teaser').innerText()) === 'Lock it now. Open it together.' && (await p.locator('a[href*="/demo"]').count()) === 0 && (await p.locator('meta[name="robots"]').count()) === 0)
    // gate
    await p.goto(DEMO + '/'); await settle(p)
    ok(`/demo gated ${tag}`, (await h1(p)) === 'Enter passcode' && (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
    await unlock(p)
    ok(`/demo opens after passcode ${tag}`, (await p.locator('.welcome').count()) === 1)
    // nav + footer, no More menu, no demo-home template entries
    const nav = await p.evaluate(() => ({
      menu: document.querySelectorAll('.navmenu, [data-testid="nav-more"], [aria-haspopup], .topnav button').length,
      top: [...document.querySelectorAll('.welcome__bar .topnav a')].map((a) => a.innerText.trim() + '>' + a.getAttribute('href')),
      foot: [...document.querySelectorAll('footer a[href="/demo/faq"], footer a[href="/demo/soon"]')].map((a) => a.getAttribute('href')),
      home: document.querySelectorAll('[data-testid^="home-"], .homepick').length + (document.body.innerText.includes('Create your own') ? 1 : 0),
    }))
    ok(`home: no More menu, top nav = Crew stats only ${tag}`, nav.menu === 0 && nav.top.join() === 'Crew stats>/demo/stats', JSON.stringify(nav))
    ok(`home: footer has FAQ + Coming soon ${tag}`, nav.foot.join() === '/demo/faq,/demo/soon', nav.foot.join())
    ok(`home: no template pick/create entries on the demo home ${tag}`, nav.home === 0)
    if (bn === 'chromium') await p.screenshot({ path: `${OUT}/${PREFIX}-home-nav-${w}.png` })
    const act = (l) => (w < 600 ? l.tap() : l.click())
    await act(p.getByTestId('nav-stats')); await settle(p, 900)
    ok(`Crew stats link opens the full /demo/stats page ${tag}`, new URL(p.url()).pathname === '/demo/stats' && (await h1(p)) === 'Crew stats' && (await p.locator('[data-testid="sec-badges"], .badgegrid').count()) > 0 && (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
    if (bn === 'chromium') {
      await p.screenshot({ path: `${OUT}/${PREFIX}-nav-stats-${w}.png`, clip: { x: 0, y: 0, width: w, height: 140 } })
      await p.locator('.appfoot').scrollIntoViewIfNeeded(); await settle(p, 300)
      await p.screenshot({ path: `${OUT}/${PREFIX}-footer-${w}.png` })
    }
    for (const [id, path, title] of [['foot-faq', '/demo/faq', 'Questions, answered'], ['foot-soon', '/demo/soon', 'Coming soon']]) {
      await p.goto(DEMO + '/stats'); await settle(p)
      const l = p.locator('.appfoot').getByTestId(id); await l.scrollIntoViewIfNeeded(); await act(l); await settle(p, 900)
      ok(`footer ${id} opens the full ${path} page ${tag}`, new URL(p.url()).pathname === path && (await h1(p)) === title && (await p.locator('meta[name="robots"]').getAttribute('content')) === 'noindex')
    }
    const mail = await p.getByTestId('feedback').getAttribute('href')
    ok(`Coming soon contact is mailto:contact@akeru.app ${tag}`, mail.startsWith('mailto:contact@akeru.app?'), mail.split('?')[0])
    // templates still under Choose what to lock
    // new crew flow
    await p.goto(DEMO + '/crew'); await settle(p)
    await p.getByTestId('crew-name').fill('vvv'); await act(p.getByRole('button', { name: 'Create crew' })); await p.getByTestId('crew-code-pill').waitFor()
    const code = await p.getByTestId('crew-code-pill').innerText()
    const main = await p.locator('main').innerText()
    ok(`new crew: vvv + generated ${code}, no Denver blurb, creator only ${tag}`, (await p.locator('.crewcard__name').innerText()) === 'vvv' && /^VVV-[A-Z2-9]{4}$/.test(code) && !SAMPLE.test(main) && (await p.locator('[data-testid="crew-members"] .members__row').count()) === 1)
    if (bn === 'chromium') await p.screenshot({ path: `${OUT}/${PREFIX}-crew-vvv-${w}.png`, fullPage: true })
    await act(p.getByTestId('invite-entry')); await settle(p, 1200)
    const link = `${BASE}/j/${code}?n=vvv`
    ok(`invite: akeru.app/j/${code}, copy code ${code}, Text link carries it ${tag}`, (await p.getByTestId('invite-link').innerText()) === `akeru.app/j/${code}` && (await p.getByTestId('copy-code').innerText()).trim() === code && decodeURIComponent((await p.getByTestId('share-sms').getAttribute('href')).split('body=')[1]).endsWith(link) && !SAMPLE.test(await p.locator('main').innerText()))
    await settle(p, 3000)
    ok(`invite: demo simulates friends joining ${tag}`, (await p.getByTestId('who-count').innerText()).startsWith('5 of 5'))
    if (bn === 'chromium') await p.screenshot({ path: `${OUT}/${PREFIX}-invite-vvv-${w}.png`, fullPage: true })
    await p.goto(`${DEMO}/j/${code}`); await settle(p)
    ok(`/demo/j/${code}: already in vvv ${tag}`, (await h1(p)) === 'You’re already in vvv')
    // friend opens the link in a fresh tab
    const fctx = await ctxFor(br, w, bn); const f = await fctx.newPage()
    await f.goto(link); await settle(f); await unlock(f)
    ok(`friend: /j/${code} opens “Join vvv” ${tag}`, new URL(f.url()).pathname === `/demo/j/${code}` && (await h1(f)) === 'Join vvv' && (await f.getByTestId('join-code').innerText()) === code && !SAMPLE.test(await f.locator('body').innerText()))
    if (bn === 'chromium') await f.screenshot({ path: `${OUT}/${PREFIX}-join-vvv-${w}.png`, fullPage: true })
    await act(f.getByTestId('join')); await settle(f, 900)
    await act(f.getByTestId('pick-jake')); await act(f.getByTestId('first-lock')); await settle(f, 2500)
    ok(`friend: first lock sealed in vvv with ${code} ${tag}`, (await h1(f)).includes('vvv') && (await f.getByTestId('crew-line').innerText()).includes(code))
    await fctx.close()
    // creator: templates (pick/create still here) → lock → locked → reveal
    await p.goto(DEMO + '/templates'); await settle(p)
    ok(`templates: still lists templates + Create your own, for vvv ${tag}`, (await p.locator('label.tpl').count()) >= 6 && (await p.getByTestId('create-own').count()) === 1 && (await p.locator('main .kicker').first().textContent()).includes('vvv'), `${await p.locator('label.tpl').count()} ${await p.getByTestId('create-own').count()} ${await p.locator('main .kicker').first().innerText()}`)
    await act(p.getByRole('button', { name: /^Use / })); await settle(p, 900)
    ok(`lock: vvv + ${code} ${tag}`, (await p.getByTestId('crew-line').innerText()).includes(code))
    await act(p.getByRole('button', { name: 'Lock my call' })); await settle(p, 900)
    ok(`locked: vvv + ${code} ${tag}`, (await p.getByTestId('crew-line').innerText()).includes(code) && !SAMPLE.test(await p.locator('main').innerText()))
    if (bn === 'chromium') await p.screenshot({ path: `${OUT}/${PREFIX}-locked-vvv-${w}.png`, fullPage: true })
    await act(p.getByRole('button', { name: /Simulate unlock|Open now/ })); await settle(p, 900)
    const skip = p.getByRole('button', { name: 'Skip animation' }); if (await skip.count()) await act(skip).catch(() => {})
    await settle(p, 900)
    await act(p.getByRole('button', { name: 'See everyone’s calls' })); await settle(p, 900)
    ok(`reveal: vvv + ${code} ${tag}`, new URL(p.url()).pathname === '/demo/reveal' && (await p.getByTestId('crew-line').innerText()).includes(code))
    if (bn === 'chromium') await p.screenshot({ path: `${OUT}/${PREFIX}-reveal-vvv-${w}.png` })
    ok(`no page errors ${tag}`, errs.length === 0, errs.join(' | '))
    await ctx.close()
  }
}
await cr.close(); await wk.close()
console.log(`\n${pass}/${pass + fail} live checks passed`)
process.exit(fail ? 1 : 0)
