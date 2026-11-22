// Demo passcode gate. Only the SHA-256 hash of the passcode is embedded; the passcode itself is never stored.
// This is a light client-side gate for a static demo, not real access control.
const PASSCODE_SHA256 = '51be849c565a4ed128f1481c8424a1e5ec080e324dea73d4feeb8e298e30b78d'
const KEY = 'akeru.demo.unlocked'

export const isUnlocked = (): boolean => {
  try { return sessionStorage.getItem(KEY) === '1' } catch { return false }
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function tryUnlock(code: string): Promise<boolean> {
  const ok = (await sha256Hex(code.trim())) === PASSCODE_SHA256
  if (ok) { try { sessionStorage.setItem(KEY, '1') } catch { /* private mode */ } }
  return ok
}
