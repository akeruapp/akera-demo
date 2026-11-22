<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Avatar from '../components/Avatar.vue'
import Mark from '../components/Mark.vue'
import Orbit from '../components/Orbit.vue'
import Sparkle from '../components/Sparkle.vue'
import { CREW, MEMBERS } from '../data'
import { state } from '../store'
import { isKnownCode } from '../invite'
import { firstLock, startFirstLock } from '../firstlock'

const route = useRoute()
const router = useRouter()
const raw = computed(() => String(route.params.code ?? ''))
const known = computed(() => isKnownCode(raw.value))
const already = computed(() => known.value && state.crew !== null)
const firstDone = computed(() => firstLock.lockedAt !== null)
const crewName = computed(() => (state.crew ? state.crewName : CREW.name))

function join() {
  state.crew = 'joined'
  state.crewName = CREW.name
  startFirstLock()
  router.push('/demo/first')
}
</script>

<template>
  <div class="join">
    <Orbit class="join__orbit" :w="480" :h="168" :at="0.1" :spark="16" />
    <main class="join__main">
      <p class="join__brand"><Mark :size="32" /> <span>akeru</span></p>

      <template v-if="known">
        <p class="kicker">{{ already ? 'Already in' : 'You’re invited' }}</p>
        <h1 class="title join__title" tabindex="-1" data-focus-start>
          {{ already ? `You’re already in ${crewName}` : `Join ${crewName}` }}
        </h1>
        <p class="lede">
          <template v-if="already">No need to join again.{{ firstDone ? ' Your first call is already locked.' : '' }} Pick up where the crew is.</template>
          <template v-else><strong>Maya Thompson</strong> invited you. {{ CREW.blurb }}</template>
        </p>
        <ul class="join__faces" :aria-label="`${MEMBERS.length} people in ${crewName}`">
          <li v-for="m in MEMBERS" :key="m.id" :title="m.name"><Avatar :id="m.id" :size="56" /><span class="join__first">{{ m.first }}</span></li>
        </ul>
        <p class="join__code muted small">Crew code <span class="mono">{{ CREW.code }}</span></p>
        <div class="join__actions">
          <button v-if="!already" type="button" class="btn btn--primary btn--block btn--lg" data-testid="join" @click="join">
            <Sparkle :size="16" color="var(--ink)" /> Join
          </button>
          <template v-else>
            <RouterLink to="/demo/crew" class="btn btn--primary btn--block btn--lg" data-testid="go-crew">Go to your crew</RouterLink>
            <RouterLink v-if="firstDone" to="/demo/first" class="btn btn--ghost btn--block" data-testid="see-first">See your locked call</RouterLink>
          </template>
          <p v-if="!already" class="muted small join__fine">One tap, no sign-up. Demo data only.</p>
        </div>
      </template>

      <template v-else>
        <p class="kicker">Hmm</p>
        <h1 class="title join__title" tabindex="-1" data-focus-start data-testid="join-error">This invite doesn’t open anything</h1>
        <p class="lede">We couldn’t find a crew for <span class="mono join__bad">{{ raw || 'that link' }}</span>. The link may be mistyped or out of date. Ask whoever sent it for a fresh one.</p>
        <div class="join__actions">
          <RouterLink to="/demo/crew" class="btn btn--primary btn--block btn--lg">Enter a code instead</RouterLink>
          <RouterLink to="/demo" class="btn btn--ghost btn--block">Back to the demo</RouterLink>
        </div>
      </template>
    </main>
  </div>
</template>
