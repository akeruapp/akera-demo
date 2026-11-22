<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Screen from '../components/Screen.vue'
import Avatar from '../components/Avatar.vue'
import LockGlyph from '../components/LockGlyph.vue'
import Sparkle from '../components/Sparkle.vue'
import { MEMBERS, PHOTOS, member } from '../data'
import type { MemberId } from '../data'
import { prefersReducedMotion, state } from '../store'
import CrewLine from '../components/CrewLine.vue'
import { FIRST_LOCK, elapsedSec, firstLock, sealFirstLock } from '../firstlock'

// A crew you started or joined by your own link isn't flying to Denver: keep its copy generic.
const ctx = computed(() => (state.crewCustom ? `Next time ${state.crewName} meets up.` : FIRST_LOCK.context))
const opens = computed(() => (state.crewCustom ? `everyone in ${state.crewName} has arrived` : FIRST_LOCK.opensWhen))

// Arriving without Join (deep link, refresh) still counts from here.
if (!firstLock.startedAt) firstLock.startedAt = Date.now()

const pick = ref<MemberId | null>(firstLock.call)
const sealed = computed(() => firstLock.lockedAt !== null)
const sealing = ref(false)
// phase: 'closing' plays the lock animation once; 'done' is the resting state (immediate with reduced motion)
const phase = ref<'closing' | 'done'>('done')

function lock() {
  if (!pick.value || sealing.value) return
  sealing.value = true
  sealFirstLock(pick.value)
  phase.value = prefersReducedMotion() ? 'done' : 'closing'
  if (phase.value === 'closing') window.setTimeout(() => (phase.value = 'done'), 1100)
  sealing.value = false
  nextTick(() => document.querySelector<HTMLElement>('.first h1')?.focus())
}

const now = ref(Date.now())
let tick = 0
onMounted(() => { tick = window.setInterval(() => (now.value = Date.now()), 1000) })
onBeforeUnmount(() => clearInterval(tick))
const left = computed(() => Math.max(0, FIRST_LOCK.countdownSec - Math.floor((now.value - (firstLock.lockedAt ?? now.value)) / 1000)))
const parts = computed(() => {
  const s = left.value
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0'))
})
const spoken = computed(() => `${Number(parts.value[0])} hours ${Number(parts.value[1])} minutes`)
const elapsed = computed(() => elapsedSec())
const pickedName = computed(() => (firstLock.call === 'maya' ? 'yourself' : firstLock.call ? member(firstLock.call).first : ''))
</script>

<template>
  <Screen :photo="PHOTOS.airport" kicker="First lock" :caption="FIRST_LOCK.question" back="/demo/crew">
    <div class="first">
      <template v-if="!sealed">
        <p class="kicker">You’re in {{ state.crewName }} · Your first call</p>
        <h1 class="title" tabindex="-1" data-focus-start>{{ FIRST_LOCK.question }}</h1>
        <CrewLine />
        <p class="lede">{{ ctx }} Tap who you think shows up last.</p>

        <fieldset class="facepick">
          <legend class="visually-hidden">{{ FIRST_LOCK.question }}</legend>
          <label v-for="m in MEMBERS" :key="m.id" class="facepick__opt" :class="{ 'is-on': pick === m.id }" :data-testid="`pick-${m.id}`">
            <input v-model="pick" type="radio" name="first" class="visually-hidden" :value="m.id" />
            <Avatar :id="m.id" :size="56" />
            <span class="facepick__name">{{ m.id === 'maya' ? 'Me' : m.first }}</span>
            <span class="facepick__check" aria-hidden="true"><Sparkle :size="12" color="var(--ink)" /></span>
          </label>
        </fieldset>
        <p class="muted small first__hint" aria-live="polite">{{ pick ? `You’re calling ${pick === 'maya' ? 'yourself' : member(pick).first}. Nobody sees it until it opens.` : 'Nobody sees your call until it opens.' }}</p>
      </template>

      <template v-else>
        <div class="seal" :class="`seal--${phase}`" aria-hidden="true">
          <span class="seal__ring" />
          <span class="seal__lock"><LockGlyph :size="56" :open="phase === 'closing'" /></span>
          <Sparkle class="seal__spark" :size="20" />
        </div>
        <p class="kicker first__center">Sealed · <span data-testid="elapsed">Locked in {{ elapsed }}s</span></p>
        <h1 class="title first__center" tabindex="-1" data-focus-start>You’re in. It opens when {{ opens }}.</h1>
        <CrewLine class="crewline--center" />
        <p class="lede first__center">Your call on “{{ FIRST_LOCK.question }}” is locked: you picked {{ pickedName }}. Nobody can see it until then.</p>

        <section class="card countdown" aria-labelledby="fl-cd">
          <h2 id="fl-cd" class="card__label">Opens in</h2>
          <p class="countdown__clock" :aria-label="spoken" data-testid="fl-countdown">
            <span>{{ parts[0] }}</span><span class="countdown__sep" aria-hidden="true">:</span><span>{{ parts[1] }}</span><span class="countdown__sep" aria-hidden="true">:</span><span>{{ parts[2] }}</span>
          </p>
          <p class="countdown__units" aria-hidden="true"><span>hrs</span><span>min</span><span>sec</span></p>
        </section>
        <ul class="first__crew" aria-label="Locked so far">
          <li v-for="m in MEMBERS" :key="m.id"><Avatar :id="m.id" :size="40" :locked="true" /><span>{{ m.id === 'maya' ? 'You' : m.first }}</span></li>
        </ul>
      </template>
    </div>

    <template #foot>
      <template v-if="!sealed">
        <button type="button" class="btn btn--primary btn--block btn--lg" :disabled="!pick" data-testid="first-lock" @click="lock">
          <LockGlyph :size="20" /> Lock it
        </button>
        <p class="foot__note">No account needed. You can add a profile later.</p>
      </template>
      <template v-else>
        <RouterLink to="/demo/crew" class="btn btn--primary btn--block" data-testid="to-crew">Go to {{ state.crewName }}</RouterLink>
      </template>
    </template>
  </Screen>
</template>
