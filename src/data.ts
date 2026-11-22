// All demo data. Static, invented, clearly sample content.

export type MemberId = 'maya' | 'jake' | 'chris' | 'sam' | 'riley'

export interface Member {
  id: MemberId
  name: string
  first: string
  initials: string
  hue: number // avatar tint, degrees
}

export const MEMBERS: Member[] = [
  { id: 'maya', name: 'Maya Thompson', first: 'Maya', initials: 'MT', hue: 28 },
  { id: 'jake', name: 'Jake Miller', first: 'Jake', initials: 'JM', hue: 205 },
  { id: 'chris', name: 'Chris Alvarez', first: 'Chris', initials: 'CA', hue: 160 },
  { id: 'sam', name: 'Sam Bennett', first: 'Sam', initials: 'SB', hue: 330 },
  { id: 'riley', name: 'Riley Brooks', first: 'Riley', initials: 'RB', hue: 265 },
]

export const member = (id: MemberId): Member => MEMBERS.find((m) => m.id === id)!

export const CREW = {
  name: 'Gate C Crew',
  code: 'C7-GATE',
  blurb: 'Five friends, four cities, one long weekend in Denver.',
}

export type BuiltinId = 'dinner' | 'match' | 'run' | 'note' | 'reunion' | 'roadtrip'
export type TemplateId = BuiltinId | `u-${string}`

export interface Photo {
  src: string
  alt: string
  credit: string
  focus?: string // object-position for tight crops
}

const P = (id: string, alt: string, credit: string, focus?: string): Photo => ({
  focus,
  src: `${import.meta.env.BASE_URL}photos/pexels-${id}.jpg`,
  alt,
  credit,
})

export const PHOTOS = {
  couch: P('23495578', 'Five friends on a couch, leaning in toward a TV', 'Vitaly Gariev'),
  dinnerLaugh: P('19094921', 'Friends laughing together at a dinner table', 'The OurWhisky Foundation'),
  toast: P('6555015', 'Friends raising glasses in a candlelit dinner toast', 'cottonbro studio'),
  airport: P('4173209', 'Two travelers walking through an airport airbridge', 'Gustavo Fring'),
  popcorn: P('7234395', 'Friends with popcorn reacting during a movie night', 'Pavel Danilyuk'),
  finish: P('35261923', 'A runner celebrating with arms raised at a city race finish', 'Cristian Camilo Estrada'),
  finish2: P('17979347', 'A runner with arms raised at an outdoor finish', 'Pexels LATAM'),
  key: P('40150787', 'An antique key in a wooden door lock', 'Waskyria Miranda'),
  van: P('5329529', 'A travel crew waving from the roof of a red van', 'cottonbro studio', 'center 58%'),
  run: P('34089572', 'A volunteer handing water to a runner during a city race', 'K'),
}

export type CallKind = 'pick' | 'score' | 'time' | 'note' | 'number' | 'yesno' | 'clock'

export interface CrewCall {
  by: MemberId
  call: string // display text of the call
  aside?: string // short quote they added
  value?: number // used for scoring
}

export interface Template {
  id: TemplateId
  name: string
  tagline: string
  kind: CallKind
  question: string
  hint: string
  condition: string // illustrative partner signal
  waitingFor: string // countdown label
  countdownSec: number
  metAt: string // what the reveal says
  photo: Photo // lock + locked screens
  revealPhoto: Photo
  others: CrewCall[]
  defaultCall: string
  picks?: { value: string; label: string }[]
  opensOn?: string // short form for the template list
  noteLabel?: string // note kind: what the note is
  sealedUntil?: string // note kind: helper text under the textarea
  suggestions?: string[] // note kind: one-tap ideas
  // custom templates (built in /demo/create)
  slug?: string
  emoji?: string
  published?: boolean
  hostOpens?: boolean // unlock = host taps "Open now"
  formatCall?: (v: string) => string
  reveal?: (myCall: string) => Reveal
}

export const TEMPLATES: Template[] = [
  {
    id: 'dinner',
    name: 'First to land buys dinner',
    tagline: 'Four flights into Denver. Whoever touches down first picks up the check.',
    kind: 'pick',
    question: 'Who lands first?',
    hint: 'Everyone is flying in Friday. First wheels down buys the crew dinner.',
    condition: 'Landing confirmed via flight partner',
    waitingFor: 'Last flight lands in',
    countdownSec: 2 * 3600 + 14 * 60 + 38,
    metAt: 'All five flights landed · 7:42 PM',
    photo: PHOTOS.airport,
    revealPhoto: PHOTOS.toast,
    defaultCall: 'jake',
    picks: [
      { value: 'jake', label: 'Jake' },
      { value: 'chris', label: 'Chris' },
      { value: 'sam', label: 'Sam' },
      { value: 'riley', label: 'Riley' },
      { value: 'maya', label: 'Me' },
    ],
    others: [
      { by: 'jake', call: 'Riley', aside: 'I booked the scenic route. Not my check.' },
      { by: 'chris', call: 'Sam', aside: 'She always gets the tailwind.' },
      { by: 'sam', call: 'Jake', aside: 'Watch him try to dodge it.' },
      { by: 'riley', call: 'Chris', aside: 'Red-eye energy.' },
    ],
  },
  {
    id: 'match',
    name: 'Match prediction',
    tagline: 'Call the final score before kickoff. The whistle opens every call at once.',
    kind: 'score',
    question: 'Hawks vs. Comets: final score?',
    hint: 'Saturday watch party at Chris’s place. Calls lock at kickoff.',
    condition: 'Final whistle via sports partner',
    waitingFor: 'Final whistle in about',
    countdownSec: 1 * 3600 + 52 * 60 + 10,
    metAt: 'Full time · Hawks 2, Comets 1',
    photo: PHOTOS.popcorn,
    revealPhoto: PHOTOS.couch,
    defaultCall: '2-1',
    others: [
      { by: 'jake', call: 'Hawks 2–1', aside: 'Late winner. Trust me.' },
      { by: 'chris', call: 'Hawks 4–0', aside: 'It’s going to be a rout.' },
      { by: 'sam', call: '1–1 draw', aside: 'And I’ll be smug about it.' },
      { by: 'riley', call: 'Comets 2–0', aside: 'Someone has to believe.' },
    ],
  },
  {
    id: 'run',
    name: 'Charity run finish time',
    tagline: 'Guess a friend’s finish time. The official clock opens the guesses.',
    kind: 'time',
    question: 'Sam’s Riverside 10K finish time?',
    hint: 'Sam is running for the food bank on Sunday. Closest guess carries her medal home.',
    condition: 'Official finish via event partner',
    waitingFor: 'Race starts in',
    countdownSec: 14 * 3600 + 6 * 60 + 2,
    metAt: 'Official finish · 50:12',
    photo: PHOTOS.run,
    revealPhoto: PHOTOS.finish,
    defaultCall: '51:00',
    others: [
      { by: 'jake', call: '58:00', aside: 'Leaving room for a coffee stop.', value: 58 * 60 },
      { by: 'chris', call: '52:30', aside: 'She has been up at 5 AM all month.', value: 52 * 60 + 30 },
      { by: 'riley', call: '49:45', aside: 'Sub-50. I believe.', value: 49 * 60 + 45 },
      { by: 'sam', call: 'Goal: under 52', aside: 'Runner’s note, sealed with the rest.' },
    ],
  },
  {
    id: 'note',
    name: 'Sealed table note',
    tagline: 'Write a note now. It opens when every seat at the table is filled.',
    kind: 'note',
    question: 'A note for Riley’s birthday dinner',
    hint: 'Nobody reads a word until all five of you check in at the table.',
    condition: 'All seats filled via table check-in',
    waitingFor: 'Dinner starts in',
    countdownSec: 5 * 3600 + 28 * 60 + 44,
    metAt: 'Five of five seated · 7:31 PM',
    photo: PHOTOS.key,
    revealPhoto: PHOTOS.dinnerLaugh,
    defaultCall: 'Riley, you made this city feel like home my first year here. Happy birthday.',
    noteLabel: 'Your note for Riley',
    sealedUntil: 'sealed until every seat is filled',
    others: [
      { by: 'jake', call: 'Thirty looks good on you. Thirty-one will look even better when you finally return my jacket.' },
      { by: 'chris', call: 'You are the reason this crew has a group chat. Thank you for every plan you made happen.' },
      { by: 'sam', call: 'Next year we run the 10K together. I already signed you up. (Kidding. Mostly.)' },
      { by: 'riley', call: 'Sealed by Riley: “I knew you’d all show up.”' },
    ],
  },
  {
    id: 'reunion',
    name: 'Reunion time capsule',
    tagline: 'Seal what you think everyone will be up to. It opens when the whole crew walks into the reunion.',
    kind: 'note',
    question: 'Where will we all be?',
    hint: 'Ballwin High, ten years on. Seal a prediction or a note about your old classmates. It opens when all five of you check in.',
    condition: 'All 5 checked in at Ballwin High reunion',
    opensOn: 'everyone checks in at the reunion',
    waitingFor: 'Reunion doors open in',
    countdownSec: 3 * 3600 + 41 * 60 + 9,
    metAt: 'All 5 checked in at Ballwin High reunion · 7:15 PM',
    photo: PHOTOS.couch,
    revealPhoto: PHOTOS.dinnerLaugh,
    defaultCall: 'Riley is the one who organized this reunion. Of course Riley organized this reunion.',
    noteLabel: 'Your time capsule note',
    sealedUntil: 'sealed until all five check in',
    suggestions: [
      'Riley is the one who organized this reunion. Of course Riley organized this reunion.',
      'Chris still knows everyone’s coffee order. Probably runs the best café in town.',
      'Ten years from now we’ll still be in the same group chat. Calling it.',
    ],
    others: [
      { by: 'jake', call: 'Sam runs marathons now and still talks everyone into “just one more mile.”' },
      { by: 'chris', call: 'Maya lives somewhere with mountains and sends the best postcards.' },
      { by: 'sam', call: 'Jake finally learned to cook. Tacos, apparently. Lots of tacos.' },
      { by: 'riley', call: 'Chris is the one we all call for advice. Same as junior year.' },
    ],
  },
  {
    id: 'roadtrip',
    name: 'Road trip: who calls the first stop?',
    tagline: 'Call who asks to pull over first. It opens when the crew rolls into town.',
    kind: 'pick',
    question: 'Who calls the first stop?',
    hint: 'Denver to Moab, one van, five friends. Whoever asks to pull over first gets named on the card.',
    condition: 'Arrival confirmed via maps partner',
    opensOn: 'arrival in Moab',
    waitingFor: 'ETA to Moab',
    countdownSec: 5 * 3600 + 48 * 60 + 20,
    metAt: 'Arrived in Moab · 4:26 PM',
    photo: PHOTOS.van,
    revealPhoto: PHOTOS.van,
    defaultCall: 'chris',
    picks: [
      { value: 'jake', label: 'Jake' },
      { value: 'chris', label: 'Chris' },
      { value: 'sam', label: 'Sam' },
      { value: 'riley', label: 'Riley' },
      { value: 'maya', label: 'Me' },
    ],
    others: [
      { by: 'jake', call: 'Chris', aside: 'Snack emergency by mile 20. Guaranteed.' },
      { by: 'chris', call: 'Riley', aside: 'She will want every scenic overlook.' },
      { by: 'sam', call: 'Jake', aside: 'Gas-station jerky is his love language.' },
      { by: 'riley', call: 'Sam', aside: 'Hydration is a lifestyle.' },
    ],
  },
]

export const PARTNER = {
  name: 'Fieldstone Timing',
  condition: 'Unlocks when everyone finishes',
  question: 'Sam’s next 10K finish time?',
  hint: 'Locked from Fieldstone Timing for the crew’s next run. It opens when everyone running has crossed the line.',
  locked: 'Everyone finishes via Fieldstone Timing',
}

// Custom templates live in src/custom.ts and register a lookup here (avoids an import cycle).
let customLookup: (id: string) => Template | undefined = () => undefined
let customSlugLookup: (slug: string) => TemplateId | null = () => null
export function registerCustomLookup(byId: typeof customLookup, bySlug: typeof customSlugLookup) {
  customLookup = byId
  customSlugLookup = bySlug
}
export const findTemplate = (id: string): Template | undefined => TEMPLATES.find((t) => t.id === id) ?? customLookup(id)
export const template = (id: TemplateId): Template => findTemplate(id) ?? TEMPLATES[0]

export const NOTE_SUGGESTIONS = [
  'Riley, you made this city feel like home my first year here. Happy birthday.',
  'To the friend who always saves me a seat. Here’s to thirty.',
  'You plan everything, so tonight we planned you. Love you, Riley.',
]

// ---------- reveal ----------

export interface RevealRow {
  by: MemberId
  call: string
  aside?: string
  badge?: string
  highlight?: boolean
}

export interface Reveal {
  kicker: string
  headline: string
  summary: string
  rows: RevealRow[]
  roast?: { target: MemberId; text: string; consequence: string }
  funBit?: { label: string; text: string }
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export const parseTime = (v: string): number => {
  const [m, s] = v.split(':').map((n) => parseInt(n, 10))
  return (m || 0) * 60 + (s || 0)
}

export function buildReveal(t: Template, myCall: string): Reveal {
  if (t.reveal) return t.reveal(myCall)
  if (t.id === 'dinner') {
    const pickName = myCall === 'maya' ? 'Me' : member(myCall as MemberId).first
    const calledIt = myCall === 'jake'
    const landings: Record<MemberId, string> = {
      jake: '6:48 PM', riley: '7:05 PM', chris: '7:20 PM', sam: '7:31 PM', maya: '7:42 PM',
    }
    const rows: RevealRow[] = [
      { by: 'maya', call: pickName, aside: `Landed ${landings.maya}`, badge: calledIt ? 'Called it' : undefined, highlight: calledIt },
      ...t.others.map((o) => ({
        by: o.by, call: o.call, aside: `“${o.aside}” · Landed ${landings[o.by]}`,
        badge: o.call === 'Jake' ? 'Called it' : undefined, highlight: o.call === 'Jake',
      })),
    ]
    return {
      kicker: 'Wheels down',
      headline: 'Dinner’s on Jake',
      summary: calledIt
        ? 'Jake touched down 22 minutes early at 6:48 PM. You and Sam both saw it coming.'
        : 'Jake touched down 22 minutes early at 6:48 PM. Sam saw it coming. You picked ' + pickName + '.',
      rows,
      roast: {
        target: 'jake',
        text: 'Jake booked the “scenic route” to dodge the check. His flight landed first, 22 minutes early.',
        consequence: 'Dinner’s on Jake. Tacos, apparently.',
      },
    }
  }
  if (t.id === 'match') {
    const [h, c] = myCall.split('-').map((n) => parseInt(n, 10))
    const mine = h === c ? `${h}–${c} draw` : h > c ? `Hawks ${h}–${c}` : `Comets ${c}–${h}`
    const exact = h === 2 && c === 1
    const result = h > c
    const rows: RevealRow[] = [
      { by: 'maya', call: mine, badge: exact ? 'Exact score' : result ? 'Right winner' : undefined, highlight: exact },
      ...t.others.map((o) => ({
        by: o.by, call: o.call, aside: `“${o.aside}”`,
        badge: o.by === 'jake' ? 'Exact score' : o.by === 'chris' ? 'Right winner' : undefined,
        highlight: o.by === 'jake',
      })),
    ]
    return {
      kicker: 'Full time',
      headline: exact ? 'You and Jake nailed it' : 'Jake nailed it',
      summary: 'Hawks 2, Comets 1, with a winner in the 88th minute. ' + (exact ? 'Two exact calls in the crew.' : 'One exact call in the crew.'),
      rows,
      roast: {
        target: 'chris',
        text: 'Chris promised a 4–0 rout and spent the last ten minutes hiding behind a cushion.',
        consequence: 'Chris picks the snacks for the next watch party.',
      },
    }
  }
  if (t.id === 'run') {
    const actual = 50 * 60 + 12
    const my = parseTime(myCall)
    const guesses = [
      { by: 'maya' as MemberId, v: my },
      ...t.others.filter((o) => o.value).map((o) => ({ by: o.by, v: o.value! })),
    ]
    const best = guesses.reduce((a, b) => (Math.abs(b.v - actual) < Math.abs(a.v - actual) ? b : a))
    const off = (v: number) => {
      const d = Math.abs(v - actual)
      return d === 0 ? 'Spot on' : `${fmtTime(d)} ${v > actual ? 'slow' : 'fast'}`
    }
    const rows: RevealRow[] = [
      { by: 'maya', call: fmtTime(my), aside: off(my), badge: best.by === 'maya' ? 'Closest' : undefined, highlight: best.by === 'maya' },
      ...t.others.map((o) => ({
        by: o.by, call: o.call,
        aside: o.value ? `“${o.aside}” · ${off(o.value)}` : 'Beat her goal by 1:48',
        badge: o.by === best.by ? 'Closest' : o.by === 'sam' ? 'Runner' : undefined,
        highlight: o.by === best.by,
      })),
    ]
    return {
      kicker: 'Official finish',
      headline: 'Sam ran 50:12',
      summary: `A personal best, for the food bank. Closest guess: ${best.by === 'maya' ? 'you' : member(best.by).first}, who carries the medal home.`,
      rows,
    }
  }
  if (t.id === 'roadtrip') {
    const pickName = myCall === 'maya' ? 'Me' : member(myCall as MemberId).first
    const calledIt = myCall === 'chris'
    return {
      kicker: 'Rolled into Moab',
      headline: 'Chris called the first stop',
      summary: 'Mile 12, a gas station outside Grand Junction, and a “snack emergency.” '
        + (calledIt ? 'You and Jake saw it coming.' : `Jake saw it coming. You picked ${pickName}.`),
      rows: [
        { by: 'maya', call: pickName, badge: calledIt ? 'Called it' : undefined, highlight: calledIt },
        ...t.others.map((o) => ({
          by: o.by, call: o.call, aside: `“${o.aside}”`,
          badge: o.call === 'Chris' ? 'Called it' : undefined, highlight: o.call === 'Chris',
        })),
      ],
      roast: {
        target: 'chris',
        text: 'Chris swore he’d make it to Moab without a single stop. He asked to pull over at mile 12 for a “snack emergency.”',
        consequence: 'Chris is on playlist duty for the drive home.',
      },
    }
  }
  if (t.id === 'reunion') {
    return {
      kicker: 'Everyone’s here',
      headline: 'Ten years, five predictions',
      summary: 'Sealed before the reunion, opened at Ballwin High. Three came true, and yes, Riley really did organize the whole night.',
      rows: [
        { by: 'maya', call: myCall.trim() || t.defaultCall },
        ...t.others.map((o) => ({ by: o.by, call: o.call })),
      ],
    }
  }
  // note
  const rows: RevealRow[] = [
    { by: 'maya', call: myCall.trim() || NOTE_SUGGESTIONS[0] },
    ...t.others.map((o) => ({ by: o.by, call: o.call })),
  ]
  return {
    kicker: 'Every seat filled',
    headline: 'Five notes for Riley',
    summary: 'Sealed this morning, opened at the table. Riley read every one out loud.',
    rows,
  }
}

// The canned public reveal at /r/x7k2 (the default dinner path, consent given).
export const SHARE_SLUGS: Record<BuiltinId, string> = {
  dinner: 'x7k2',
  match: 'm4h2',
  run: 'r10k',
  note: 'n5t3',
  reunion: 'c4ps',
  roadtrip: 'm0ab',
}

export const templateForSlug = (slug: string): TemplateId | null =>
  (Object.keys(SHARE_SLUGS) as BuiltinId[]).find((k) => SHARE_SLUGS[k] === slug) ?? customSlugLookup(slug)

export const slugFor = (t: Template): string => t.slug ?? SHARE_SLUGS[t.id as BuiltinId]
