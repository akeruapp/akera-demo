# Akeru demo (aketa-demo)

A mobile-first, **static clickable demo** of the Akeru flow, the way a prototype would walk through it.
It is not the native app (that is planned for iOS/Android via Expo). There is no backend, no AI or API
calls, no accounts, no analytics and no secrets. Every name, crew, flight and result is sample data.

> **Akeru** (開ける, "to open"). Friends lock predictions, dares and moments that unlock when real life
> delivers. When it opens, everyone shouts **"Aketa!"** (it opened!). *Lock it. Live it. Relive it.*

## Preview locally

```bash
npm install
npm run dev          # http://localhost:5173/
# or a production build:
npm run build && npm run preview   # http://localhost:4173/
```

For the phone view, open the browser dev tools' device toolbar at 390 px wide.

## Site structure

- `/` is a minimal **coming-soon landing** (logo, teaser, "akeru.app · coming soon"). It has no link to the demo.
- `/demo/...` is the clickable demo. Every `/demo` route, including deep links, shows a **passcode gate**
  first. Only the SHA-256 hash of the passcode is in the source (`src/gate.ts`); the input is hashed with
  `crypto.subtle` and compared. Unlocking lasts for the browser tab (`sessionStorage`). This is a light
  client-side gate for a static demo, not real access control.
- `/demo` pages get `<meta name="robots" content="noindex">` (set by the router); the landing does not.

All demo routes below live under `/demo` (for example `/demo/r/x7k2`).

## The flow

| Step | Route | What happens |
| --- | --- | --- |
| 1 Welcome | `/demo/` | Brand moment, start the demo or jump to a shared reveal |
| 2 Crew | `/crew` | Start a crew (prefilled "Gate C Crew") or join with demo code **C7-GATE** (case and dash optional) |
| 3 Template | `/templates` | First to land buys dinner (default), Match prediction, Charity run finish time, Sealed table note, Reunion time capsule, Road trip: who calls the first stop? |
| 4 Lock | `/lock` | Maya Thompson makes her call; the other four are already sealed |
| 5 Locked | `/locked` | Countdown plus an illustrative partner condition, and a secondary **Simulate unlock** demo control |
| 6 Aketa! | `/aketa` | The reveal animation, held on its end state (instant under `prefers-reduced-motion`) |
| 7 Reveal card | `/reveal` | Everyone's calls, the result, and the opt-in share prompt |
| 8 Shared page | `/r/x7k2` | Public reveal card with **Run it with your crew** |
| Partner example | `/partner/run` | A fictional race-timing app (**Fieldstone Timing**) showing Sam's 10K result and the Akeru button “🔒 Lock a dare with your crew for the next run” |
| Partner, ready | `/partner/run?aketa=ready` | Same page with the “Your crew’s Aketa is ready” banner, linking to `/r/r10k` |
| For partners | `/partners` | How a partner connects: one button, one yes/no signal |

Positive by design: roasts are friendly, and the roasted friend holds the share key. On the dinner, match and road trip
reveals, **Share** stays disabled until the "I'm laughing too" switch is on (in the demo, Maya taps it on
Jake's or Chris's behalf, and it is labeled as a demo control). No money, no betting language, no shaming.

Shared routes: `/r/x7k2` (dinner, the canned reveal from the deck), plus `/r/m4h2` (match), `/r/r10k` (run)
`/r/n5t3` (table note), `/r/c4ps` (reunion time capsule) and `/r/m0ab` (road trip). Direct loads always show the canned reveal; arriving from the flow shows your own call.

### Partner example

`/partner/run` is a mock results page from **Fieldstone Timing**, a fictional race-timing app (not a real
brand), labeled "Partner example" at the top. Its Akeru button seeds the demo crew (Gate C Crew) and the
charity run template, so a visitor arriving with no prior state lands on a prefilled `/lock` with the condition
"Unlocks when everyone finishes". The partner only sends a yes/no signal and never sees what anyone wrote.

### More demo screens

All behind the passcode gate, all `noindex`, none linked from the landing at `/`.

| Screen | Route | Notes |
|---|---|---|
| Create your own template | `/demo/create` | From the “Create your own” card on `/demo/templates`. Four steps (question, answer type, unlock, fun bit + name/emoji), preview, optional “Publish for other crews” (lists it in this tab’s templates). Custom templates run the normal lock → reveal → share flow and get a `/demo/r/u-xxxx` card. Stored in `sessionStorage` only. |
| Invite your crew | `/demo/invite` | From the crew screen. Shows `akeru.app/j/C7-GATE`, a QR code drawn locally (qrcode-generator, no network), copy link/code, native share when available, Text (`sms:`) and WhatsApp (`wa.me`) links. Nothing is sent. |
| Join landing | `/demo/j/C7-GATE`, `/j/C7-GATE` | One-tap Join, no sign-up. Unknown codes get a friendly error. Members already in the crew aren’t asked to join again. |
| First lock | `/demo/first` | Where Join goes: “Who’s late to the gate?”, one tap to pick, one tap to lock, sealed state with countdown and the real “Locked in Ns” time. |
| Crew stats | `/demo/stats` | Called-it numbers, 8 inline-SVG badges (earned / not yet), opt-in badge share card, crew wall, memories timeline linking to the reveal cards. |
| Profiles | `/demo/u/maya`, `jake`, `chris`, `sam`, `riley` | Linked from avatars on the crew, invite, stats and reveal screens. Positive stats only. |
| Past runs | on every `/demo/r/...` card and `/demo/reveal` | 2–3 earlier runs, who called it, and “Run it with your crew”. |
| FAQ | `/demo/faq` | Accessible accordion. |
| Coming soon | `/demo/soon` | Planned / Exploring cards; the feedback button is only a `mailto:` link. |

The app top bar has a “More” menu (Crew stats, FAQ, Coming soon); the welcome footer links FAQ and Coming soon.

### Demo limitations (deliberate)

- Locking a dare from the partner page uses the charity run template; its reveal is the canned Riverside 10K
  reveal (50:12), not a separate "next run" result.

- State lives in `sessionStorage`. A refresh mid-flow keeps your place in this tab; a new tab or a deep link
  to a mid-flow step without state sends you back to the start. `/r/*` always works on direct load.
- Partner signals ("Landing confirmed via flight partner" etc.) are illustrative labels, not integrations.
- Nothing is posted or copied when you share; the shared page is an in-app route.
- Deep links rely on the `404.html` SPA fallback on GitHub Pages (Vite's dev and preview servers handle them natively).

## Hosting

Landing: https://akeru.app/ · Demo (passcode): https://akeru.app/demo/

Deployed by GitHub Actions (`.github/workflows/pages.yml`) on every push to `main`, on the akeru.app custom
domain (the workflow writes `dist/CNAME`). Vite `base` is `'/'`, and `dist/index.html` is copied to
`dist/404.html` so deep links such as `/demo/r/x7k2` load directly. (GitHub Pages serves those deep links with
an HTTP 404 status while rendering the app; that is expected for an SPA on Pages.)

## Logo

`src/assets/akeru-mark.svg` is the Akeru mark: a lowercase "a" with a keyhole counter and a four-point
sparkle, amber on a transparent background (the navy tile is only for icons), redrawn as geometric SVG from
the chosen concept. `public/favicon.svg` is the mark on a navy rounded tile, and `public/apple-touch-icon.png`
is the lockup with the cream "akeru" wordmark (regenerate with `node qa/make-icons.mjs`).

## Stack

Vite, Vue 3, TypeScript, Vue Router (history mode). Custom CSS with the deck's tokens:
ink navy `#121A2C`, amber `#F4A35C`, cream `#F4EEE6`; Poppins SemiBold titles, DM Sans body,
Noto Serif JP for 開ける. Fonts are self-hosted via Fontsource (no font CDN requests).
The four-point sparkle is recreated from the deck's `SPARKLE` path.

## QA

`qa/qa.mjs` is a Playwright walk-through (390 px and 1280 px, all four templates, create and join,
direct `/r/x7k2`, back navigation, keyboard, reduced motion, overflow, tap targets, image framing and contrast).

```bash
npm run build && npm run preview &
npx playwright install chromium
npm run qa            # screenshots and results.json in qa/out/ (gate tests read AKERU_DEMO_PASSCODE)
BASE=https://akeru.app node qa/live.mjs   # quick live check
```

## Photo credits

All photos are from [Pexels](https://www.pexels.com) under the free Pexels License, resized and stored in
`public/photos/` (not hotlinked). `https://www.pexels.com/photo/<id>/`

| File | Subject | Photographer |
| --- | --- | --- |
| pexels-23495578.jpg | Friends on a couch watching TV (welcome) | Vitaly Gariev |
| pexels-19094921.jpg | Friends laughing at dinner | The OurWhisky Foundation |
| pexels-6555015.jpg | Dinner toast | cottonbro studio |
| pexels-4173209.jpg | Two travelers in an airport airbridge | Gustavo Fring |
| pexels-7234395.jpg | Friends with popcorn, movie night | Pavel Danilyuk |
| pexels-35261923.jpg | Runner celebrating at a city race finish | Cristian Camilo Estrada |
| pexels-17979347.jpg | Runner with arms raised at a finish | Pexels LATAM |
| pexels-40150787.jpg | Antique key in a wooden door lock | Waskyria Miranda |
| pexels-5329529.jpg | Travel crew on a van road trip | cottonbro studio |
| pexels-34089572.jpg | Volunteer handing water to a runner | K |

## License

Code: MIT (see `LICENSE`). Photos remain under the Pexels License.
