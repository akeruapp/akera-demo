// "Create your own" templates: stored per tab in sessionStorage, turned into regular Templates
// so the existing lock -> locked -> Aketa! -> reveal -> share flow works unchanged.
import { reactive, watch } from 'vue'
import { MEMBERS, PHOTOS, member, registerCustomLookup } from './data'
import type { CrewCall, MemberId, Photo, Reveal, RevealRow, Template, TemplateId } from './data'

export type AnswerType = 'member' | 'number' | 'yesno' | 'time' | 'note'
export type UnlockType = 'datetime' | 'checkin' | 'partner' | 'opennow'
export type PartnerKind = 'match' | 'run' | 'flight'
export type FunKind = 'none' | 'stake' | 'dare' | 'roast'

export interface CustomSpec {
  id: `u-${string}`
  question: string
  answer: AnswerType
  unlock: UnlockType
  when: string // datetime-local value
  place: string
  partner: PartnerKind
  fun: FunKind
  funText: string
  roastTarget: MemberId
  name: string
  emoji: string
  publish: boolean
}

export type Draft = Omit<CustomSpec, 'id' | 'answer' | 'unlock'> & { answer: AnswerType | null; unlock: UnlockType | null; step: number }

export const ANSWER_TYPES: { value: AnswerType; label: string; hint: string }[] = [
  { value: 'member', label: 'Pick a crew member', hint: 'Everyone names one person' },
  { value: 'number', label: 'Number', hint: 'Closest number wins' },
  { value: 'yesno', label: 'Yes or No', hint: 'A clean call either way' },
  { value: 'time', label: 'Time', hint: 'Closest time of day wins' },
  { value: 'note', label: 'Free note', hint: 'A sealed note, read together' },
]
export const UNLOCK_TYPES: { value: UnlockType; label: string; hint: string }[] = [
  { value: 'datetime', label: 'A date and time', hint: 'Opens on the clock' },
  { value: 'checkin', label: 'Everyone checks in at a place', hint: 'Opens when all five arrive' },
  { value: 'partner', label: 'A partner signal', hint: 'Match ends, run finished or flight lands' },
  { value: 'opennow', label: 'The host taps “Open now”', hint: 'You decide when' },
]
export const PARTNER_KINDS: { value: PartnerKind; label: string; condition: string; met: string; photo: Photo }[] = [
  { value: 'match', label: 'Match ends', condition: 'Final whistle via sports partner', met: 'Final whistle confirmed', photo: PHOTOS.popcorn },
  { value: 'run', label: 'Run finished', condition: 'Official finish via event partner', met: 'Everyone crossed the line', photo: PHOTOS.finish },
  { value: 'flight', label: 'Flight lands', condition: 'Landing confirmed via flight partner', met: 'Wheels down, landing confirmed', photo: PHOTOS.airport },
]
export const FUN_KINDS: { value: FunKind; label: string; placeholder: string }[] = [
  { value: 'none', label: 'Nothing extra', placeholder: '' },
  { value: 'stake', label: 'A stake', placeholder: 'Loser buys tacos' },
  { value: 'dare', label: 'A dare', placeholder: 'Loser sings the first karaoke song' },
  { value: 'roast', label: 'A roast line', placeholder: 'Jake swore he wouldn’t cry. He brought tissues.' },
]
export const EMOJIS = ['🎉', '💍', '🌮', '✈️', '🏃', '🎂', '🎬', '⚽', '🏕️', '⭐']

// No money framing: stakes are tacos and playlists, not cash.
const MONEY = /(\$|€|£|\bdollars?\b|\bbucks\b|\bcash\b|\bmoney\b|\bvenmo\b|\bpaypal\b|\bzelle\b|\bbet(s|ting)?\b|\bwager\b|\bgambl)/i
export const looksLikeMoney = (s: string) => MONEY.test(s)

const KEY = 'akeru.demo.custom.v1'
interface Saved { specs: CustomSpec[]; draft: Draft | null }

export function defaultWhen(): string {
  const d = new Date(Date.now() + 2 * 86400000)
  d.setHours(20, 0, 0, 0)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export const newDraft = (): Draft => ({
  question: '', answer: null, unlock: null, when: defaultWhen(), place: '', partner: 'match',
  fun: 'none', funText: '', roastTarget: 'chris', name: '', emoji: '🎉', publish: false, step: 1,
})

function load(): Saved {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Saved | null
    if (v && Array.isArray(v.specs)) return { specs: v.specs.filter((x) => typeof x?.id === 'string' && x.id.startsWith('u-')), draft: v.draft ?? null }
  } catch { /* ignore */ }
  return { specs: [], draft: null }
}

export const custom = reactive<Saved>(load())
watch(custom, (v) => { try { sessionStorage.setItem(KEY, JSON.stringify(v)) } catch { /* private mode */ } }, { deep: true })

export function saveSpec(d: Draft): CustomSpec {
  const id = `u-${Math.random().toString(36).slice(2, 6)}` as const
  const spec: CustomSpec = {
    id, question: d.question.trim(), answer: d.answer!, unlock: d.unlock!, when: d.when, place: d.place.trim(),
    partner: d.partner, fun: d.fun, funText: d.funText.trim(), roastTarget: d.roastTarget,
    name: d.name.trim(), emoji: d.emoji, publish: d.publish,
  }
  custom.specs.push(spec)
  return spec
}

// ---------- formatting ----------
const clock = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h)) return hhmm
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
const mins = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0) }
export const whenLabel = (v: string) => {
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
const fmtCall = (a: AnswerType, v: string) => {
  if (a === 'member') return v === 'maya' ? 'Me' : member(v as MemberId).first
  if (a === 'time') return clock(v)
  return v
}

// ---------- the demo crew's calls per answer type (static sample data) ----------
const OTHERS: Record<AnswerType, { by: MemberId; v: string; aside?: string }[]> = {
  member: [
    { by: 'jake', v: 'riley', aside: 'She cried at a car commercial.' },
    { by: 'chris', v: 'sam', aside: 'Sam is a secret softie.' },
    { by: 'sam', v: 'riley', aside: 'Not even close.' },
    { by: 'riley', v: 'jake', aside: 'Watch Jake.' },
  ],
  number: [
    { by: 'jake', v: '3', aside: 'Keeping it modest.' },
    { by: 'chris', v: '9', aside: 'Go big.' },
    { by: 'sam', v: '5', aside: 'Did the math.' },
    { by: 'riley', v: '6', aside: 'Gut feeling.' },
  ],
  yesno: [
    { by: 'jake', v: 'Yes', aside: 'Obviously.' },
    { by: 'chris', v: 'No', aside: 'No way it happens.' },
    { by: 'sam', v: 'Yes', aside: 'Trust me.' },
    { by: 'riley', v: 'No', aside: 'Hope I’m wrong.' },
  ],
  time: [
    { by: 'jake', v: '19:30', aside: 'Early, for once.' },
    { by: 'chris', v: '21:00', aside: 'Fashionably late.' },
    { by: 'sam', v: '19:40', aside: 'Right on schedule.' },
    { by: 'riley', v: '20:00', aside: 'Round number.' },
  ],
  note: [
    { by: 'jake', v: 'Calling it now: this is the story we’ll tell for years.' },
    { by: 'chris', v: 'Whatever happens, I’m bringing snacks.' },
    { by: 'sam', v: 'Future us: I hope you’re still laughing this hard.' },
    { by: 'riley', v: 'Screenshot this. I was right.' },
  ],
}
const RESULT: Record<Exclude<AnswerType, 'note'>, string> = { member: 'riley', number: '5', yesno: 'Yes', time: '19:45' }
const DEFAULT_CALL: Record<AnswerType, string> = { member: 'riley', number: '4', yesno: 'Yes', time: '20:15', note: 'Whatever happens tonight, I’m glad it’s with you all.' }

function photoFor(s: CustomSpec): { photo: Photo; reveal: Photo } {
  if (s.unlock === 'partner') { const p = PARTNER_KINDS.find((k) => k.value === s.partner)!.photo; return { photo: p, reveal: p } }
  if (s.unlock === 'checkin') return { photo: PHOTOS.dinnerLaugh, reveal: PHOTOS.toast }
  if (s.unlock === 'opennow') return { photo: PHOTOS.key, reveal: PHOTOS.couch }
  return { photo: PHOTOS.couch, reveal: PHOTOS.dinnerLaugh }
}

export function conditionFor(s: Pick<CustomSpec, 'unlock' | 'when' | 'place' | 'partner'>): string {
  if (s.unlock === 'datetime') return `Opens ${whenLabel(s.when)}`
  if (s.unlock === 'checkin') return `All 5 checked in at ${s.place || 'the place'}`
  if (s.unlock === 'partner') return PARTNER_KINDS.find((k) => k.value === s.partner)!.condition
  return 'Opens when the host taps “Open now”'
}

function buildRevealFor(s: CustomSpec, myCall: string, metAt: string): Reveal {
  const calls = [{ by: 'maya' as MemberId, v: myCall }, ...OTHERS[s.answer].map((o) => ({ by: o.by, v: o.v }))]
  const asides = Object.fromEntries(OTHERS[s.answer].map((o) => [o.by, o.aside]))
  let rows: RevealRow[]
  let headline: string
  let summary: string
  let loser: MemberId | null = null
  const nameOf = (id: MemberId) => (id === 'maya' ? 'you' : member(id).first)
  if (s.answer === 'note') {
    rows = calls.map((c) => ({ by: c.by, call: c.v.trim() || DEFAULT_CALL.note }))
    headline = 'Five notes, opened together'
    summary = `Sealed for “${s.question}” and read out loud the moment it opened.`
  } else {
    const result = RESULT[s.answer]
    let winners: MemberId[]
    if (s.answer === 'number' || s.answer === 'time') {
      const val = (v: string) => (s.answer === 'time' ? mins(v) : Number(v))
      const diff = (v: string) => Math.abs(val(v) - val(result))
      const best = Math.min(...calls.map((c) => diff(c.v)))
      winners = calls.filter((c) => diff(c.v) === best).map((c) => c.by)
      loser = calls.reduce((a, b) => (diff(b.v) > diff(a.v) ? b : a)).by
      rows = calls.map((c) => ({
        by: c.by, call: fmtCall(s.answer, c.v), aside: c.by === 'maya' ? undefined : `“${asides[c.by]}”`,
        badge: winners.includes(c.by) ? (best === 0 ? 'Spot on' : 'Closest') : undefined, highlight: winners.includes(c.by),
      }))
    } else {
      winners = calls.filter((c) => c.v === result).map((c) => c.by)
      loser = calls.find((c) => c.by !== 'maya' && c.v !== result)?.by ?? null
      rows = calls.map((c) => ({
        by: c.by, call: fmtCall(s.answer, c.v), aside: c.by === 'maya' ? undefined : `“${asides[c.by]}”`,
        badge: winners.includes(c.by) ? 'Called it' : undefined, highlight: winners.includes(c.by),
      }))
    }
    const shown = fmtCall(s.answer, result)
    headline = s.answer === 'member' ? `It was ${shown}` : s.answer === 'yesno' ? `The answer: ${shown}` : s.answer === 'time' ? `It happened at ${shown}` : `The answer: ${shown}`
    const w = winners.map(nameOf)
    const wText = w.length === 0 ? 'Nobody called it.' : w.length === 1 ? `${cap(w[0])} called it.` : `${cap(w.slice(0, -1).join(', '))} and ${w[w.length - 1]} called it.`
    summary = `“${s.question}” ${wText}`
  }
  const out: Reveal = { kicker: metAt.split(' · ')[0], headline, summary, rows }
  if (s.fun === 'roast' && s.funText) {
    out.roast = { target: s.roastTarget, text: s.funText, consequence: `${member(s.roastTarget).first} holds the share key on this one.` }
  } else if ((s.fun === 'stake' || s.fun === 'dare') && s.funText) {
    const who = loser ? (loser === 'maya' ? 'You' : member(loser).first) : 'The crew'
    out.funBit = { label: s.fun === 'stake' ? 'The stake' : 'The dare', text: loser ? `${s.funText}. That’s ${who}${loser === 'maya' ? '' : ', this time'}.` : `${s.funText}. Everyone’s in.` }
  }
  return out
}
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)

export function toTemplate(s: CustomSpec): Template {
  const kind = ({ member: 'pick', number: 'number', yesno: 'yesno', time: 'clock', note: 'note' } as const)[s.answer]
  const { photo, reveal } = photoFor(s)
  const condition = conditionFor(s)
  const metAt =
    s.unlock === 'datetime' ? `Opened on schedule · ${whenLabel(s.when)}`
    : s.unlock === 'checkin' ? `All 5 checked in · ${s.place}`
    : s.unlock === 'partner' ? `${PARTNER_KINDS.find((k) => k.value === s.partner)!.met} · tonight`
    : 'Opened by Maya, the host · just now'
  const others: CrewCall[] = OTHERS[s.answer].map((o) => ({ by: o.by, call: fmtCall(s.answer, o.v), aside: o.aside }))
  const countdownSec = s.unlock === 'datetime' ? Math.max(60, Math.floor((new Date(s.when).getTime() - Date.now()) / 1000)) : 0
  return {
    id: s.id as TemplateId,
    name: s.name,
    tagline: s.question,
    kind,
    question: s.question,
    hint: `Your template · ${condition}.`,
    condition,
    opensOn: condition.replace(/ via .*/, '').replace(/^Opens /, '').toLowerCase(),
    waitingFor: 'Opens in',
    countdownSec,
    metAt,
    photo,
    revealPhoto: reveal,
    others,
    defaultCall: DEFAULT_CALL[s.answer],
    picks: s.answer === 'member' ? MEMBERS.map((m) => ({ value: m.id, label: m.id === 'maya' ? 'Me' : m.first })) : undefined,
    noteLabel: 'Your sealed note',
    sealedUntil: 'sealed until it opens',
    suggestions: ['Whatever happens tonight, I’m glad it’s with you all.', 'Calling it now and I’ll be smug later.', 'Read this out loud. You’re welcome.'],
    slug: s.id,
    emoji: s.emoji,
    published: s.publish,
    hostOpens: s.unlock === 'opennow',
    formatCall: (v) => fmtCall(s.answer, v),
    reveal: (myCall) => buildRevealFor(s, myCall, metAt),
  }
}

export const publishedTemplates = () => custom.specs.filter((s) => s.publish).map(toTemplate)

registerCustomLookup(
  (id) => { const s = custom.specs.find((x) => x.id === id); return s ? toTemplate(s) : undefined },
  (slug) => (custom.specs.find((x) => x.id === slug)?.id as TemplateId | undefined) ?? null,
)
