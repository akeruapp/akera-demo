// Renders public/apple-touch-icon.png (lockup on navy) from src/assets/akeru-mark.svg. Run: node qa/make-icons.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
fs.mkdirSync('qa/out', { recursive: true })
const mark = fs.readFileSync('src/assets/akeru-mark.svg', 'utf8').replace(/width="96" height="96"/, 'width="100%" height="100%"')
const font = 'data:font/woff2;base64,' + fs.readFileSync('node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2').toString('base64')
const html = (lockup) => `<html><head><style>@font-face{font-family:P;src:url(${font});font-weight:600}
html,body{margin:0;background:transparent}
.t{width:180px;height:180px;background:#121A2C;display:flex;flex-direction:column;align-items:center;justify-content:center}
.m{width:${lockup ? 104 : 136}px;height:${lockup ? 104 : 136}px}.w{font:600 34px/1 P;color:#F4EEE6;letter-spacing:-.02em;margin-top:6px}</style></head>
<body><div class="t"><div class="m">${mark}</div>${lockup ? '<div class="w">akeru</div>' : ''}</div></body></html>`
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 180, height: 180 } })
await p.setContent(html(true)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200)
await p.screenshot({ path: 'public/apple-touch-icon.png', omitBackground: true })
await p.setViewportSize({ width: 512, height: 512 })
await p.setContent(html(true).replace('width:180px;height:180px', 'width:180px;height:180px;transform:scale(2.844);transform-origin:0 0'))
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200)
await p.screenshot({ path: process.env.ICON_512 ?? 'qa/out/akeru-app-icon-512.png' })
await b.close()
