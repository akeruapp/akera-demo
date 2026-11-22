// "30-second first lock": the call a new member makes right after joining from an invite.
// Separate from the main demo flow so it never needs a template or any setup.
import { reactive, watch } from 'vue'
import type { MemberId } from './data'

export const FIRST_LOCK = {
  question: 'Who’s late to the gate?',
  context: 'Friday, DEN · Gate C. Boarding 6:40 PM.',
  opensWhen: 'all five of you scan in at Gate C on Friday',
  countdownSec: 2 * 86400 + 5 * 3600 + 17 * 60, // demo: Friday boarding
}

interface FirstLockState { startedAt: number | null; call: MemberId | null; lockedAt: number | null }
const KEY = 'akeru.demo.firstlock.v1'
function load(): FirstLockState {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    if (v && typeof v === 'object') return { startedAt: v.startedAt ?? null, call: v.call ?? null, lockedAt: v.lockedAt ?? null }
  } catch { /* ignore */ }
  return { startedAt: null, call: null, lockedAt: null }
}
export const firstLock = reactive<FirstLockState>(load())
watch(firstLock, (v) => { try { sessionStorage.setItem(KEY, JSON.stringify(v)) } catch { /* private mode */ } }, { deep: true })

/** Called on one-tap Join: the 30-second clock starts here. */
export function startFirstLock() {
  firstLock.startedAt = Date.now()
  firstLock.call = null
  firstLock.lockedAt = null
}
export function sealFirstLock(call: MemberId) {
  firstLock.call = call
  firstLock.lockedAt = Date.now()
}
export const elapsedSec = () =>
  firstLock.startedAt && firstLock.lockedAt ? Math.max(1, Math.round((firstLock.lockedAt - firstLock.startedAt) / 1000)) : null
