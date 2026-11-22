# Akeru demo (aketa-demo)

A mobile-first, **static clickable demo** of the Akeru flow, the way a prototype would walk through it.
It is not the native app (that is planned for iOS/Android via Expo). There is no backend, no AI or API
calls, no accounts, no analytics and no secrets. Every name, crew, flight and result is sample data.

> **Akeru** (開ける, "to open"). Friends lock predictions, dares and moments that unlock when real life
> delivers. When it opens, everyone shouts **"Aketa!"** (it opened!). *Lock it. Live it. Relive it.*

## Preview locally

```bash
npm install
npm run dev          # http://localhost:5173
# or a production build:
npm run build && npm run preview   # http://localhost:4173
```

For the phone view, open the browser dev tools' device toolbar at 390 px wide.

## The flow

| Step | Route | What happens |
| --- | --- | --- |
| 1 Welcome | `/` | Brand moment, start the demo or jump to a shared reveal |
| 2 Crew | `/crew` | Start a crew (prefilled "Gate C Crew") or join with demo code **C7-GATE** (case and dash optional) |
| 3 Template | `/templates` | First to land buys dinner (default), Match prediction, Charity run finish time, Sealed table note |
| 4 Lock | `/lock` | Maya Thompson makes her call; the other four are already sealed |
| 5 Locked | `/locked` | Countdown plus an illustrative partner condition, and a secondary **Simulate unlock** demo control |
| 6 Aketa! | `/aketa` | The reveal animation, held on its end state (instant under `prefers-reduced-motion`) |
| 7 Reveal card | `/reveal` | Everyone's calls, the result, and the opt-in share prompt |
| 8 Shared page | `/r/x7k2` | Public reveal card with **Run it with your crew** |

Positive by design: roasts are friendly, and the roasted friend holds the share key. On the dinner and match
reveals, **Share** stays disabled until the "I'm laughing too" switch is on (in the demo, Maya taps it on
Jake's or Chris's behalf, and it is labeled as a demo control). No money, no betting language, no shaming.

Shared routes: `/r/x7k2` (dinner, the canned reveal from the deck), plus `/r/m4h2` (match), `/r/r10k` (run)
and `/r/n5t3` (table note). Direct loads always show the canned reveal; arriving from the flow shows your own call.

### Demo limitations (deliberate)

- State lives in `sessionStorage`. A refresh mid-flow keeps your place in this tab; a new tab or a deep link
  to a mid-flow step without state sends you back to the start. `/r/*` always works on direct load.
- Partner signals ("Landing confirmed via flight partner" etc.) are illustrative labels, not integrations.
- Nothing is posted or copied when you share; the shared page is an in-app route.
- Static hosting needs an SPA fallback to `index.html` for deep links (Vite's dev and preview servers do this).

## Hosting status

The GitHub repository is **private** and **GitHub Pages is intentionally not enabled**. Nothing is deployed.

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
npm run qa            # screenshots and results.json in qa/out/
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
