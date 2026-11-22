import { reactive, watch } from 'vue'
import type { TemplateId } from './data'
import { CREW, template } from './data'

export interface DemoState {
  crew: 'created' | 'joined' | null
  crewName: string
  templateId: TemplateId | null
  myCall: string | null
  lockedAt: number | null
  revealSeen: boolean
  consent: boolean
  fromPartner: boolean
}

const KEY = 'akeru.demo.v1'

const fresh = (): DemoState => ({
  crew: null, crewName: CREW.name, templateId: null, myCall: null, lockedAt: null, revealSeen: false, consent: false, fromPartner: false,
})

function load(): DemoState {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return fresh()
    const v = JSON.parse(raw) as Partial<DemoState>
    const s = fresh()
    if (v.crew === 'created' || v.crew === 'joined') s.crew = v.crew
    if (v.templateId && ['dinner', 'match', 'run', 'note', 'reunion', 'roadtrip'].includes(v.templateId)) s.templateId = v.templateId
    if (typeof v.crewName === 'string' && v.crewName.trim()) s.crewName = v.crewName.slice(0, 40)
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
  if (!state.crew) { state.crew = 'joined'; state.crewName = CREW.name }
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
