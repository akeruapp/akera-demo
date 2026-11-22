<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Screen from '../components/Screen.vue'
import Avatar from '../components/Avatar.vue'
import LockGlyph from '../components/LockGlyph.vue'
import Orbit from '../components/Orbit.vue'
import Sparkle from '../components/Sparkle.vue'
import { MEMBERS, member, template } from '../data'
import { state } from '../store'

const router = useRouter()
const t = computed(() => template(state.templateId!))

const myCallLabel = computed(() => {
  const c = state.myCall ?? ''
  if (t.value.kind === 'pick') return c === 'maya' ? 'Me' : member(c as never).first
  if (t.value.kind === 'score') {
    const [h, k] = c.split('-').map(Number)
    return h === k ? `${h}–${k} draw` : h > k ? `Hawks ${h}–${k}` : `Comets ${k}–${h}`
  }
  if (t.value.kind === 'note') return 'Your note for Riley'
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
  <Screen :photo="t.photo" kicker="Locked" :caption="t.condition" back="/lock" :step="4">
    <div class="lockhero">
      <Orbit class="lockhero__orbit" :w="248" :h="88" :at="0.08" :spark="14" />
      <span class="lockhero__lock"><LockGlyph :size="72" /></span>
      <Sparkle class="lockhero__spark" :size="20" />
    </div>
    <p class="kicker center">Step 4 · Sealed</p>
    <h1 class="title center">Locked in. Five of five.</h1>
    <p class="lede center">Your call: <strong class="amber">{{ myCallLabel }}</strong>. It stays sealed for everyone until real life delivers.</p>

    <section class="card countdown" aria-labelledby="cd-label">
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
        <p class="condition__text">{{ t.condition }}</p>
        <p class="condition__status"><span class="dot-live" aria-hidden="true" /> Waiting for the signal</p>
        <p class="muted small">Illustrative partner label for this demo.</p>
      </div>
    </section>

    <ul class="crewrow" aria-label="Everyone’s call is locked">
      <li v-for="m in MEMBERS" :key="m.id" class="crewrow__item">
        <Avatar :id="m.id" :size="44" locked />
        <span class="crewrow__name">{{ m.id === 'maya' ? 'You' : m.first }}</span>
      </li>
    </ul>

    <template #foot>
      <button type="button" class="btn btn--secondary btn--block" @click="router.push('/aketa')">
        <Sparkle :size="16" /> Simulate unlock
      </button>
      <p class="foot__note">Demo control. In the app, the partner signal opens it for everyone at once.</p>
    </template>
  </Screen>
</template>
