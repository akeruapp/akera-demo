import { reactive, watch } from 'vue'
import type { TemplateId } from './data'
import { CREW, MEMBERS, findTemplate, template } from './data'
import type { Member } from './data'
import './custom'

export interface DemoState {
  crew: 'created' | 'joined' | null
  crewName: string
  /** Invite code for this crew: C7-GATE for the sample, generated (or typed) for a crew you start. */
  crewCode: string
  crewBlurb: string
  /** true for a crew you started yourself (not the Gate C Crew sample). */
  crewCustom: boolean
  /** A custom crew has only you until the invite step, where the demo simulates friends joining. */
  invited: boolean
  templateId: TemplateId | null
  myCall: string | null
  lockedAt: number | null
  revealSeen: boolean
  consent: boolean
  fromPartner: boolean
}

const KEY = 'akeru.demo.v1'

const fresh = (): DemoState => ({
  crew: null, crewName: CREW.name, crewCode: CREW.code, crewBlurb: CREW.blurb, crewCustom: false, invited: true, templateId: null, myCall: null, lockedAt: null, revealSeen: false, consent: false, fromPartner: false,
})

function load(): DemoState {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return fresh()
    const v = JSON.parse(raw) as Partial<DemoState>
    const s = fresh()
    if (v.crew === 'created' || v.crew === 'joined') s.crew = v.crew
    if (v.templateId && findTemplate(v.templateId)) s.templateId = v.templateId
    if (typeof v.crewName === 'string' && v.crewName.trim()) s.crewName = v.crewName.slice(0, 40)
    if (v.crewCustom === true && typeof v.crewCode === 'string' && /^[A-Z0-9-]{4,14}$/.test(v.crewCode)) {
      s.crewCustom = true; s.crewCode = v.crewCode
      s.crewBlurb = typeof v.crewBlurb === 'string' ? v.crewBlurb.slice(0, 80) : ''
      s.invited = v.invited === true
    }
    if (typeof v.myCall === 'string') s.myCall = v.myCall
    if (typeof v.lockedAt === 'number') s.lockedAt = v.lockedAt
    s.revealSeen = v.revealSeen === true
    s.consent = v.consent === true
    s.fromPartner = v.fromPartner === true
    return s
  } catch {
    return fresh()
  }
}

export const state = reactive<DemoState>(load())

/** The prebuilt sample crew (Gate C Crew · C7-GATE), used only when no crew is set yet or C7-GATE is entered. */
export function seedSample(how: 'joined' | 'created' = 'joined') {
  Object.assign(state, { crew: how, crewName: CREW.name, crewCode: CREW.code, crewBlurb: CREW.blurb, crewCustom: false, invited: true })
}

export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')
export const isSampleCode = (s: string) => normalizeCode(s) === normalizeCode(CREW.code)
const SAFE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I
/** A demo code from the crew name: up to 4 letters/digits + 4 random characters, e.g. VVV-K3P9. Never C7-GATE. */
export function codeFor(name: string): string {
  const stem = normalizeCode(name).slice(0, 4) || 'CREW'
  for (;;) {
    let tail = ''
    const r = new Uint32Array(4); crypto.getRandomValues(r)
    for (const n of r) tail += SAFE[n % SAFE.length]
    const c = `${stem}-${tail}`
    if (!isSampleCode(c)) return c
  }
}
/** Tidy a typed code: upper case, letters/digits/hyphen, 4 to 12 characters. Returns '' when invalid. */
export function cleanCode(s: string): string {
  const c = s.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '')
  return /^[A-Z0-9][A-Z0-9-]{2,10}[A-Z0-9]$/.test(c) ? c : ''
}

/** Start a brand-new crew: your name and code, no sample blurb, only you as a member until you invite. */
export function startCrew(name: string, code: string, blurb = '') {
  Object.assign(state, { crew: 'created', crewName: name.trim().slice(0, 40), crewCode: code, crewBlurb: blurb.trim().slice(0, 80), crewCustom: true, invited: false })
}
/** Join a crew you were invited to by link (custom code + name carried in the link). */
export function joinCustomCrew(name: string, code: string) {
  Object.assign(state, { crew: 'joined', crewName: name.trim().slice(0, 40), crewCode: code, crewBlurb: '', crewCustom: true, invited: true })
}
/** Who is in the current crew: just you for a crew you just started, everyone once invites go out. */
export const crewMembers = (): Member[] => (state.crewCustom && !state.invited ? MEMBERS.filter((m) => m.id === 'maya') : MEMBERS)

watch(state, (s) => {
  try { sessionStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode */ }
}, { deep: true })

export function pickTemplate(id: TemplateId) {
  if (state.templateId !== id) {
    state.templateId = id
    state.myCall = template(id).defaultCall
    state.lockedAt = null
    state.revealSeen = false
    state.consent = false
    state.fromPartner = false
  }
}

/** Entry from the partner app: seed the demo crew and the run template, condition set. */
export function startFromPartner() {
  if (!state.crew) seedSample()
  pickTemplate('run')
  state.myCall = template('run').defaultCall
  state.lockedAt = null
  state.revealSeen = false
  state.fromPartner = true
}

export function lockCall(call: string) {
  state.myCall = call
  state.lockedAt = Date.now()
  state.revealSeen = false
  state.consent = false
}

export function resetDemo(keepTemplate?: TemplateId) {
  Object.assign(state, fresh())
  if (keepTemplate) pickTemplate(keepTemplate)
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** "Run it with your crew": start the lock flow for a template with Gate C Crew, fresh. */
export function runTemplate(id: TemplateId) {
  if (!state.crew) seedSample()
  state.templateId = id
  state.myCall = template(id).defaultCall
  state.lockedAt = null
  state.revealSeen = false
  state.consent = false
  state.fromPartner = false
}
