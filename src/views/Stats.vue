<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Screen from '../components/Screen.vue'
import Badge from '../components/Badge.vue'
import AvatarLink from '../components/AvatarLink.vue'
import Sparkle from '../components/Sparkle.vue'
import CrewLine from '../components/CrewLine.vue'
import { CREW, MEMBERS, PHOTOS, findTemplate, member } from '../data'
import type { MemberId } from '../data'
import { BADGES, MEMORIES, PROFILES, badge, earnedFor, memoryHref, rate } from '../stats'
import type { EarnedBadge } from '../stats'
import { crewMembers, state } from '../store'
import { firstLock } from '../firstlock'

// Stats follow the active crew. The Gate C Crew history is sample data: it only shows for the sample crew
// (or with no crew yet, labelled as the sample). A crew you started has its own, mostly empty, history.
const isNew = computed(() => !!state.crew && state.crewCustom)
const crewName = computed(() => (state.crew ? state.crewName : CREW.name))
const back = computed(() => (state.crew ? { to: '/demo/crew', label: `Back to ${state.crewName}` } : { to: '/demo/', label: 'Back to the demo' }))
const members = computed(() => (isNew.value ? crewMembers() : MEMBERS))
const myCalls = computed(() => (state.lockedAt ? 1 : 0) + (firstLock.lockedAt ? 1 : 0))
const me = computed(() => (isNew.value ? { hits: 0, calls: myCalls.value, streak: 0 } : PROFILES.maya))
const myRate = computed(() => (isNew.value ? (me.value.calls ? '0%' : '–') : `${rate(PROFILES.maya)}%`))
const mine = computed<EarnedBadge[]>(() => {
  if (!isNew.value) return earnedFor('maya')
  const e = new Set<EarnedBadge>(earnedFor('maya').filter((b) => b === 'firstlock' || b === 'maker'))
  if (state.crew === 'created' && state.invited) e.add('starter')
  return BADGES.map((b) => b.id).filter((b) => e.has(b))
})
const alsoBy = (b: EarnedBadge) => (isNew.value ? [] : MEMBERS.filter((m) => m.id !== 'maya' && earnedFor(m.id).includes(b)).map((m) => m.first))
const opened = computed(() => (isNew.value ? (state.revealSeen ? 1 : 0) : 24))
const revealName = computed(() => (state.templateId ? findTemplate(state.templateId)?.name ?? 'Your reveal' : 'Your reveal'))

// Opt-in share card for one badge: off until you opt in, nothing is posted.
const shareBadge = ref<EarnedBadge>(mine.value[0] ?? 'oracle')
const optIn = ref(false)
const ready = ref(false)
watch([shareBadge, optIn], () => { ready.value = false })
function makeCard() { if (optIn.value) ready.value = true }

const sampleShoutouts: { id: MemberId; line: string }[] = [
  { id: 'sam', line: 'Five in a row. The crew’s longest run of calls.' },
  { id: 'riley', line: 'Kept every capsule note safe until it opened.' },
  { id: 'chris', line: 'Finished every dare, with style.' },
  { id: 'jake', line: 'Laughed the loudest at his own roast.' },
  { id: 'maya', line: 'Got the whole crew in.' },
]
const shoutouts = computed(() => (isNew.value
  ? members.value.map((m) => ({ id: m.id, line: m.id === 'maya' ? (state.crew === 'created' ? `Started ${state.crewName}.` : `Joined ${state.crewName}.`) : `Joined ${state.crewName}.` }))
  : sampleShoutouts))
</script>

<template>
  <Screen :photo="PHOTOS.toast" kicker="Crew stats" caption="Badges and bragging rights. No money, ever." :back="back.to">
    <p class="kicker" data-testid="stats-crew">{{ crewName }} · {{ state.crew ? 'Private to the crew' : 'Sample crew' }}</p>
    <CrewLine />
    <h1 class="title">Crew stats</h1>
    <p class="lede">Badges and bragging rights only. Only your crew sees this page.</p>

    <!-- 1. Called it -->
    <section class="stats-sec" aria-labelledby="ci-h" data-testid="sec-called">
      <h2 id="ci-h" class="card__label">Called it · you</h2>
      <ul class="statrow">
        <li class="statcard"><Badge id="hits" :size="48" /><span class="statcard__n">{{ me.hits }}</span><span class="statcard__l">calls that hit</span></li>
        <li class="statcard"><Badge id="rate" :size="48" /><span class="statcard__n">{{ myRate }}</span><span class="statcard__l">hit rate · {{ me.hits }} of {{ me.calls }}</span></li>
        <li class="statcard"><Badge id="streak" :size="48" /><span class="statcard__n">{{ me.streak }}</span><span class="statcard__l">in a row right now</span></li>
      </ul>
      <p class="muted small"><RouterLink to="/demo/u/maya" class="inlink">See your profile</RouterLink></p>
    </section>

    <!-- 2. Badges -->
    <section class="stats-sec" aria-labelledby="bg-h" data-testid="sec-badges">
      <h2 id="bg-h" class="card__label">Badges earned · {{ mine.length }} of {{ BADGES.length }}</h2>
      <ul class="badgegrid">
        <li v-for="b in BADGES" :key="b.id" class="badgecell" :class="mine.includes(b.id) ? 'is-earned' : 'is-locked'" :data-testid="`badge-${b.id}`">
          <Badge :id="b.id" :size="64" :locked="!mine.includes(b.id)" />
          <span class="badgecell__name">{{ b.name }}</span>
          <span class="badgecell__how">{{ b.how }}</span>
          <span class="badgecell__state">{{ mine.includes(b.id) ? 'Earned' : 'Not yet' }}</span>
          <span v-if="alsoBy(b.id).length" class="badgecell__also">Also: {{ alsoBy(b.id).join(', ') }}</span>
        </li>
      </ul>
    </section>

    <!-- share one badge (opt-in) -->
    <section class="card badgeshare" aria-labelledby="bs-h" data-testid="badge-share">
      <h2 id="bs-h" class="card__label">Share a badge</h2>
      <p v-if="!mine.length" class="muted" data-testid="badge-none">Earn your first badge in {{ crewName }} and you can share it here.</p>
      <template v-else>
      <fieldset class="chips">
        <legend class="visually-hidden">Badge to share</legend>
        <label v-for="b in mine" :key="b" class="chip" :class="{ 'is-on': shareBadge === b }">
          <input v-model="shareBadge" type="radio" name="sharebadge" class="visually-hidden" :value="b" />
          <Badge :id="b" :size="28" /> {{ badge(b).name }}
        </label>
      </fieldset>
      <div class="badgecard" :class="{ 'is-ready': ready }" data-testid="badge-card">
        <Badge :id="shareBadge" :size="72" />
        <div>
          <p class="badgecard__name">{{ badge(shareBadge).name }}</p>
          <p class="badgecard__who">Maya · {{ crewName }}</p>
          <p class="badgecard__how">{{ badge(shareBadge).how }}</p>
        </div>
      </div>
      <label class="switch" data-testid="badge-optin">
        <input v-model="optIn" type="checkbox" class="switch__input" role="switch" :aria-checked="optIn" />
        <span class="switch__track" aria-hidden="true"><span class="switch__thumb" /></span>
        <span class="switch__label">
          <span class="switch__main">Share this badge outside the crew</span>
          <span class="switch__sub">Only the badge card. Your stats and calls stay private.</span>
        </span>
      </label>
      <button type="button" class="btn btn--primary btn--block" :disabled="!optIn" aria-describedby="bs-state" data-testid="badge-share-btn" @click="makeCard">Make share card</button>
      <p id="bs-state" class="sharebox__state" :class="{ 'is-ready': ready }" role="status" aria-live="polite">
        <template v-if="ready"><Sparkle :size="12" /> Card ready. Demo only: nothing was posted.</template>
        <template v-else-if="optIn">Opted in. Make the card when you’re ready.</template>
        <template v-else>Off until you opt in.</template>
      </p>
      </template>
    </section>

    <!-- 3. Crew wall -->
    <section class="stats-sec" aria-labelledby="cw-h" data-testid="sec-wall">
      <h2 id="cw-h" class="card__label">Crew wall</h2>
      <ul class="wall">
        <li class="wall__big"><span class="wall__n" data-testid="wall-opened">{{ opened }}</span><span class="wall__l">{{ opened === 1 ? 'lock' : 'locks' }} opened together</span></li>
        <li class="wall__big"><span class="wall__n" data-testid="wall-members">{{ members.length }} of {{ members.length }}</span><span class="wall__l">{{ isNew ? (members.length === 1 ? 'in the crew so far' : 'in the crew') : 'there for every unlock this year' }}</span></li>
        <li v-if="!isNew" class="wall__best">
          <span class="card__label">Best reveal of the month</span>
          <RouterLink to="/demo/r/x7k2" class="wall__link">Dinner’s on Jake</RouterLink>
          <span class="muted small">The whole crew was laughing, Jake too.</span>
        </li>
        <li v-else class="wall__best">
          <span class="card__label">Best reveal so far</span>
          <RouterLink v-if="state.revealSeen" to="/demo/reveal" class="wall__link">{{ revealName }}</RouterLink>
          <span v-else class="muted small">Your first reveal will show up here.</span>
        </li>
      </ul>
      <ul class="shout" aria-label="Shout-outs">
        <li v-for="s in shoutouts" :key="s.id" class="shout__row">
          <AvatarLink :id="s.id" :size="40" />
          <span><strong>{{ s.id === 'maya' ? 'You' : member(s.id).first }}</strong> · {{ s.line }}</span>
        </li>
      </ul>
    </section>

    <!-- 4. Memories -->
    <section class="stats-sec" aria-labelledby="mm-h" data-testid="sec-memories">
      <h2 id="mm-h" class="card__label">Memories</h2>
      <p v-if="isNew && !state.revealSeen" class="muted" data-testid="mem-none">No reveals yet. Lock a call with {{ crewName }} and it lands here when it opens.</p>
      <ol v-else-if="isNew" class="timeline">
        <li class="timeline__item">
          <span class="timeline__dot" aria-hidden="true" />
          <span class="timeline__when">Today</span>
          <RouterLink to="/demo/reveal" class="timeline__link" data-testid="mem-current">{{ revealName }}</RouterLink>
          <span class="timeline__line">Your crew’s first reveal.</span>
        </li>
      </ol>
      <ol v-else class="timeline">
        <li v-for="m in MEMORIES" :key="m.template" class="timeline__item">
          <span class="timeline__dot" aria-hidden="true" />
          <span class="timeline__when">{{ m.when }}</span>
          <RouterLink :to="memoryHref(m.template)" class="timeline__link" :data-testid="`mem-${m.template}`">{{ m.title }}</RouterLink>
          <span class="timeline__line">{{ m.line }}</span>
        </li>
      </ol>
    </section>

    <template #foot>
      <RouterLink :to="back.to" class="btn btn--primary btn--block" data-testid="stats-back">{{ back.label }}</RouterLink>
    </template>
  </Screen>
</template>
