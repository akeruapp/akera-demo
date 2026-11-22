<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Screen from '../components/Screen.vue'
import Badge from '../components/Badge.vue'
import AvatarLink from '../components/AvatarLink.vue'
import Sparkle from '../components/Sparkle.vue'
import { MEMBERS, PHOTOS, member } from '../data'
import type { MemberId } from '../data'
import { BADGES, MEMORIES, PROFILES, badge, earnedFor, memoryHref, rate } from '../stats'
import type { EarnedBadge } from '../stats'
import { state } from '../store'

const me = PROFILES.maya
const mine = computed(() => earnedFor('maya'))
const alsoBy = (b: EarnedBadge) => MEMBERS.filter((m) => m.id !== 'maya' && earnedFor(m.id).includes(b)).map((m) => m.first)
const crewName = computed(() => (state.crew ? state.crewName : 'Gate C Crew'))

// Opt-in share card for one badge: off until you opt in, nothing is posted.
const shareBadge = ref<EarnedBadge>('oracle')
const optIn = ref(false)
const ready = ref(false)
watch([shareBadge, optIn], () => { ready.value = false })
function makeCard() { if (optIn.value) ready.value = true }

const shoutouts: { id: MemberId; line: string }[] = [
  { id: 'sam', line: 'Five in a row. The crew’s longest run of calls.' },
  { id: 'riley', line: 'Kept every capsule note safe until it opened.' },
  { id: 'chris', line: 'Finished every dare, with style.' },
  { id: 'jake', line: 'Laughed the loudest at his own roast.' },
  { id: 'maya', line: 'Got the whole crew in.' },
]
</script>

<template>
  <Screen :photo="PHOTOS.toast" kicker="Crew stats" caption="Badges and bragging rights. No money, ever." back="/demo/crew">
    <p class="kicker">{{ crewName }} · Private to the crew</p>
    <h1 class="title">Crew stats</h1>
    <p class="lede">Badges and bragging rights only. Only your crew sees this page.</p>

    <!-- 1. Called it -->
    <section class="stats-sec" aria-labelledby="ci-h" data-testid="sec-called">
      <h2 id="ci-h" class="card__label">Called it · you</h2>
      <ul class="statrow">
        <li class="statcard"><Badge id="hits" :size="48" /><span class="statcard__n">{{ me.hits }}</span><span class="statcard__l">calls that hit</span></li>
        <li class="statcard"><Badge id="rate" :size="48" /><span class="statcard__n">{{ rate(me) }}%</span><span class="statcard__l">hit rate · {{ me.hits }} of {{ me.calls }}</span></li>
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
    </section>

    <!-- 3. Crew wall -->
    <section class="stats-sec" aria-labelledby="cw-h" data-testid="sec-wall">
      <h2 id="cw-h" class="card__label">Crew wall</h2>
      <ul class="wall">
        <li class="wall__big"><span class="wall__n">24</span><span class="wall__l">locks opened together</span></li>
        <li class="wall__big"><span class="wall__n">5 of 5</span><span class="wall__l">there for every unlock this year</span></li>
        <li class="wall__best">
          <span class="card__label">Best reveal of the month</span>
          <RouterLink to="/demo/r/x7k2" class="wall__link">Dinner’s on Jake</RouterLink>
          <span class="muted small">The whole crew was laughing, Jake too.</span>
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
      <ol class="timeline">
        <li v-for="m in MEMORIES" :key="m.template" class="timeline__item">
          <span class="timeline__dot" aria-hidden="true" />
          <span class="timeline__when">{{ m.when }}</span>
          <RouterLink :to="memoryHref(m.template)" class="timeline__link" :data-testid="`mem-${m.template}`">{{ m.title }}</RouterLink>
          <span class="timeline__line">{{ m.line }}</span>
        </li>
      </ol>
    </section>

    <template #foot>
      <RouterLink to="/demo/crew" class="btn btn--primary btn--block">Back to {{ crewName }}</RouterLink>
    </template>
  </Screen>
</template>
