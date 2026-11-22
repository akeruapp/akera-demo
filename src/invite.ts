// Invite links for the demo crew. Nothing is sent from here: these only build URLs.
import { CREW } from './data'

export const INVITE_PATH = `/j/${CREW.code}`
export const INVITE_DISPLAY = `akeru.app${INVITE_PATH}`

/** A link that works where the demo is running: akeru.app in production, else this origin (/j/... reaches the join page). */
export function inviteUrl(): string {
  const host = typeof location !== 'undefined' ? location.hostname : 'akeru.app'
  if (host === 'akeru.app' || host === 'www.akeru.app') return `https://akeru.app${INVITE_PATH}`
  return `${location.origin}${INVITE_PATH}`
}

export const inviteMessage = (url: string) => `Join our crew on Akeru, we’re locking calls for Friday 🔒 ${url}`
export const smsHref = (url: string) => `sms:?&body=${encodeURIComponent(inviteMessage(url))}`
export const whatsappHref = (url: string) => `https://wa.me/?text=${encodeURIComponent(inviteMessage(url))}`

export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')
export const isKnownCode = (s: string) => normalizeCode(s) === normalizeCode(CREW.code)

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
