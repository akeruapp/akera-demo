<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Screen from '../components/Screen.vue'
import Avatar from '../components/Avatar.vue'
import LockGlyph from '../components/LockGlyph.vue'
import Orbit from '../components/Orbit.vue'
import Sparkle from '../components/Sparkle.vue'
import { PARTNER, member, template } from '../data'
import { crewMembers, state } from '../store'
import CrewLine from '../components/CrewLine.vue'

const members = computed(() => crewMembers())
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']
const lockedLine = computed(() => (members.value.length === 1 ? 'Locked in. Just you so far.' : `Locked in. ${WORDS[members.value.length]} of ${WORDS[members.value.length].toLowerCase()}.`))

const router = useRouter()
const t = computed(() => template(state.templateId!))
const cond = computed(() => (state.fromPartner && t.value.id === 'run' ? PARTNER.locked : t.value.condition))

const myCallLabel = computed(() => {
  const c = state.myCall ?? ''
  if (t.value.kind === 'pick') return c === 'maya' ? 'Me' : member(c as never).first
  if (t.value.kind === 'score') {
    const [h, k] = c.split('-').map(Number)
    return h === k ? `${h}–${k} draw` : h > k ? `Hawks ${h}–${k}` : `Comets ${k}–${h}`
  }
  if (t.value.kind === 'note') return t.value.noteLabel ?? 'Your note'
  if (t.value.formatCall) return t.value.formatCall(c)
  return c
})

const now = ref(Date.now())
let timer = 0
onMounted(() => { timer = window.setInterval(() => (now.value = Date.now()), 1000) })
onBeforeUnmount(() => window.clearInterval(timer))

const left = computed(() => Math.max(0, t.value.countdownSec - Math.floor((now.value - (state.lockedAt ?? now.value)) / 1000)))
const parts = computed(() => {
  const s = left.value
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0'))
})
const spoken = computed(() => `${Number(parts.value[0])} hours ${Number(parts.value[1])} minutes`)
</script>

<template>
  <Screen :photo="t.photo" kicker="Locked" :caption="cond" back="/demo/lock" :step="4">
    <div class="lockhero">
      <Orbit class="lockhero__orbit" :w="248" :h="88" :at="0.08" :spark="14" />
      <span class="lockhero__lock"><LockGlyph :size="72" /></span>
      <Sparkle class="lockhero__spark" :size="20" />
    </div>
    <p class="kicker center">Step 4 · Sealed</p>
    <CrewLine class="crewline--center" />
    <h1 class="title center">{{ lockedLine }}</h1>
    <p class="lede center">Your call: <strong class="amber">{{ myCallLabel }}</strong>. It stays sealed for everyone until real life delivers.</p>

    <section v-if="t.countdownSec > 0" class="card countdown" aria-labelledby="cd-label">
      <h2 id="cd-label" class="card__label">{{ t.waitingFor }}</h2>
      <p class="countdown__clock" :aria-label="spoken">
        <span>{{ parts[0] }}</span><span class="countdown__sep" aria-hidden="true">:</span><span>{{ parts[1] }}</span><span class="countdown__sep" aria-hidden="true">:</span><span>{{ parts[2] }}</span>
      </p>
      <p class="countdown__units" aria-hidden="true"><span>hrs</span><span>min</span><span>sec</span></p>
    </section>

    <section class="card condition" aria-labelledby="cond-label">
      <div class="condition__icon" aria-hidden="true"><span class="pulse" /></div>
      <div>
        <h2 id="cond-label" class="card__label">Unlocks when</h2>
        <p class="condition__text">{{ cond }}</p>
        <p class="condition__status"><span class="dot-live" aria-hidden="true" /> Waiting for the signal</p>
        <p class="muted small">{{ t.hostOpens ? 'Only the host can open it.' : 'Illustrative label for this demo.' }}</p>
      </div>
    </section>

    <ul class="crewrow" aria-label="Everyone’s call is locked">
      <li v-for="m in members" :key="m.id" class="crewrow__item">
        <Avatar :id="m.id" :size="44" locked />
        <span class="crewrow__name">{{ m.id === 'maya' ? 'You' : m.first }}</span>
      </li>
    </ul>

    <template #foot>
      <template v-if="t.hostOpens">
        <button type="button" class="btn btn--primary btn--block" @click="router.push('/demo/aketa')">
          <Sparkle :size="16" color="var(--ink)" /> Open now
        </button>
        <p class="foot__note">You’re the host. Opening it opens everyone’s call at once.</p>
      </template>
      <template v-else>
        <button type="button" class="btn btn--secondary btn--block" @click="router.push('/demo/aketa')">
          <Sparkle :size="16" /> Simulate unlock
        </button>
        <p class="foot__note">Demo control. In the app, {{ t.slug ? 'the condition' : 'the partner signal' }} opens it for everyone at once.</p>
      </template>
    </template>
  </Screen>
</template>
