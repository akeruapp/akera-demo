// Invite links for the current crew. Nothing is sent from here: these only build URLs.
import { state, normalizeCode as norm, isSampleCode } from './store'

/** /j/CODE for the crew you're in. A crew you started also carries its name (?n=) so the link opens it in a fresh tab: no backend in this demo. */
export function invitePath(): string {
  const base = `/j/${state.crewCode}`
  return state.crewCustom ? `${base}?n=${encodeURIComponent(state.crewName)}` : base
}
export const inviteDisplay = () => `akeru.app/j/${state.crewCode}`

/** A link that works where the demo is running: akeru.app in production, else this origin (/j/... reaches the join page). */
export function inviteUrl(): string {
  const host = typeof location !== 'undefined' ? location.hostname : 'akeru.app'
  if (host === 'akeru.app' || host === 'www.akeru.app') return `https://akeru.app${invitePath()}`
  return `${location.origin}${invitePath()}`
}

export const inviteMessage = (url: string) =>
  state.crewCustom ? `Join ${state.crewName} on Akeru, we’re locking calls 🔒 ${url}` : `Join our crew on Akeru, we’re locking calls for Friday 🔒 ${url}`
export const smsHref = (url: string) => `sms:?&body=${encodeURIComponent(inviteMessage(url))}`
export const whatsappHref = (url: string) => `https://wa.me/?text=${encodeURIComponent(inviteMessage(url))}`

export const normalizeCode = norm
export interface FoundCrew { kind: 'sample' | 'mine' | 'link'; name: string; code: string }
/** Which crew a join code opens: the sample (C7-GATE), the crew in this session, or a custom crew named in the link. */
export function findCrew(code: string, nameFromLink?: string): FoundCrew | null {
  const c = norm(code)
  if (!c) return null
  if (state.crew && norm(state.crewCode) === c) return { kind: 'mine', name: state.crewName, code: state.crewCode }
  if (isSampleCode(c)) return { kind: 'sample', name: 'Gate C Crew', code: 'C7-GATE' }
  const n = (nameFromLink ?? '').trim()
  if (n && /^[A-Z0-9-]{4,14}$/i.test(code)) return { kind: 'link', name: n.slice(0, 40), code: code.toUpperCase() }
  return null
}
export const isKnownCode = (s: string) => findCrew(s) !== null

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch { return false }
  }
}
