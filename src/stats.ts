// Crew stats, badges, profiles and past runs for Gate C Crew. Demo data only; no money anywhere.
// "Earned" means badges and bragging rights. Everything here is positive: no last place, no worst calls.
import type { BuiltinId, MemberId } from './data'
import { SHARE_SLUGS } from './data'
import { custom } from './custom'
import { firstLock } from './firstlock'

export type BadgeId = 'oracle' | 'dare' | 'laughed' | 'nightowl' | 'starter' | 'firstlock' | 'maker' | 'reunion' | 'hits' | 'rate' | 'streak'
export type EarnedBadge = Exclude<BadgeId, 'hits' | 'rate' | 'streak'>

export const BADGES: { id: EarnedBadge; name: string; how: string }[] = [
  { id: 'oracle', name: 'Oracle', how: '3 calls in a row' },
  { id: 'dare', name: 'Dare Finisher', how: 'Saw a dare all the way through' },
  { id: 'laughed', name: 'Laughed Too', how: 'Took a roast well' },
  { id: 'nightowl', name: 'Night Owl', how: 'Was there for a late unlock' },
  { id: 'starter', name: 'Crew Starter', how: 'Invited a crew' },
  { id: 'firstlock', name: 'First Lock', how: 'Locked a first call in 30 seconds' },
  { id: 'maker', name: 'Template Maker', how: 'Built a template' },
  { id: 'reunion', name: 'Reunion Keeper', how: 'Opened a reunion time capsule' },
]
export const badge = (id: EarnedBadge) => BADGES.find((b) => b.id === id)!

export interface Profile {
  id: MemberId
  title: string // fun title badge
  titleBadge: EarnedBadge
  calls: number
  hits: number
  streak: number
  best: number
  earned: EarnedBadge[]
  recent: BuiltinId[]
}

export const PROFILES: Record<MemberId, Profile> = {
  maya: { id: 'maya', title: 'The Crew Starter', titleBadge: 'starter', calls: 12, hits: 7, streak: 3, best: 4, earned: ['oracle', 'laughed', 'nightowl', 'starter'], recent: ['dinner', 'reunion', 'roadtrip'] },
  jake: { id: 'jake', title: 'Good Sport', titleBadge: 'laughed', calls: 11, hits: 5, streak: 1, best: 3, earned: ['laughed', 'dare', 'nightowl'], recent: ['dinner', 'match', 'run'] },
  chris: { id: 'chris', title: 'Dare Machine', titleBadge: 'dare', calls: 10, hits: 5, streak: 2, best: 3, earned: ['dare', 'maker'], recent: ['run', 'note', 'roadtrip'] },
  sam: { id: 'sam', title: 'Hot Streak', titleBadge: 'oracle', calls: 12, hits: 8, streak: 5, best: 5, earned: ['oracle', 'nightowl', 'reunion'], recent: ['run', 'reunion', 'match'] },
  riley: { id: 'riley', title: 'Memory Keeper', titleBadge: 'reunion', calls: 9, hits: 4, streak: 2, best: 2, earned: ['reunion', 'laughed'], recent: ['reunion', 'note', 'dinner'] },
}

/** Maya's badges react to what was done in this demo session (first lock, a built template). */
export function earnedFor(id: MemberId): EarnedBadge[] {
  const e = new Set(PROFILES[id].earned)
  if (id === 'maya') {
    if (firstLock.lockedAt) e.add('firstlock')
    if (custom.specs.length) e.add('maker')
  }
  return BADGES.map((b) => b.id).filter((b) => e.has(b))
}
export const rate = (p: Profile) => Math.round((p.hits / p.calls) * 100)

export const MEMBER_SLUGS: MemberId[] = ['maya', 'jake', 'chris', 'sam', 'riley']
export const isMember = (s: string): s is MemberId => (MEMBER_SLUGS as string[]).includes(s)

// Memories: past reveals, each linking to the existing share route.
export interface Memory { template: BuiltinId; when: string; title: string; line: string }
export const MEMORIES: Memory[] = [
  { template: 'dinner', when: 'This month', title: 'Dinner’s on Jake', line: 'Jake landed 22 minutes early. Sam saw it coming.' },
  { template: 'reunion', when: 'Last month', title: 'Ten years, five predictions', line: 'Opened at Ballwin High. Three came true.' },
  { template: 'run', when: 'Last month', title: 'Sam ran 50:12', line: 'A personal best, for the food bank.' },
  { template: 'roadtrip', when: 'In the spring', title: 'Chris called the first stop', line: 'Mile 12 and a “snack emergency.”' },
  { template: 'match', when: 'In the spring', title: 'Jake nailed it', line: 'Hawks 2, Comets 1, a winner in the 88th minute.' },
  { template: 'note', when: 'Last winter', title: 'Five notes for Riley', line: 'Sealed in the morning, read out loud at the table.' },
]
export const memoryHref = (t: BuiltinId) => `/demo/r/${SHARE_SLUGS[t]}`

// Past runs shown on each reveal page: 2 or 3 earlier runs and who called it.
export const PAST_RUNS: Record<BuiltinId, { when: string; who: MemberId[]; note: string }[]> = {
  dinner: [
    { when: 'Denver, last fall', who: ['riley'], note: 'Riley called Chris landing first' },
    { when: 'Austin, last spring', who: ['sam', 'jake'], note: 'Sam and Jake both had Maya' },
    { when: 'Chicago, two winters ago', who: ['chris'], note: 'Chris called the early flight' },
  ],
  match: [
    { when: 'Semi-final', who: ['sam'], note: 'Exact score, 3–1' },
    { when: 'Season opener', who: ['jake', 'riley'], note: 'Both called the draw' },
  ],
  run: [
    { when: 'Spring 5K', who: ['chris'], note: 'Within 40 seconds' },
    { when: 'Turkey Trot', who: ['maya', 'riley'], note: 'Both under a minute out' },
  ],
  note: [
    { when: 'New Year’s dinner', who: ['maya', 'jake', 'chris', 'sam', 'riley'], note: 'Five notes, all opened together' },
    { when: 'Birthday brunch', who: ['maya', 'jake', 'chris', 'sam', 'riley'], note: 'Read out loud, nobody skipped' },
  ],
  reunion: [
    { when: '3-year capsule', who: ['riley'], note: 'Riley called who’d move first' },
    { when: '1-year capsule', who: ['sam', 'maya'], note: 'Called the new job, both of them' },
  ],
  roadtrip: [
    { when: 'Moab trip', who: ['jake'], note: 'First stop: the coffee shack' },
    { when: 'Coast drive', who: ['chris', 'sam'], note: 'Called the pie place' },
    { when: 'Lake weekend', who: ['maya'], note: 'Gas, snacks, the usual' },
  ],
}
