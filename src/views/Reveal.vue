<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import LockGlyph from '../components/LockGlyph.vue'
import Sparkle from '../components/Sparkle.vue'
import TopBar from '../components/TopBar.vue'
import { template } from '../data'
import { prefersReducedMotion, state } from '../store'

const router = useRouter()
const t = computed(() => template(state.templateId!))
const reduced = prefersReducedMotion()
const replaying = state.revealSeen
// A crew you started solo: by the time it opens, the demo assumes your invites went out and friends locked theirs.
state.invited = true
// Phases: 0 sealed, 1 shackle opens, 2 burst + word, 3 settled (held end state)
const phase = ref(reduced || replaying ? 3 : 0)
const cta = ref<HTMLButtonElement | null>(null)
const timers: number[] = []

const rays = Array.from({ length: 10 }, (_, i) => ({
  a: (i * 36 + (i % 2 ? 12 : 0)),
  d: i % 2 ? 128 : 168,
  s: i % 3 === 0 ? 22 : i % 3 === 1 ? 14 : 10,
}))

onMounted(() => {
  state.revealSeen = true
  if (phase.value === 3) { cta.value?.focus(); return }
  timers.push(window.setTimeout(() => (phase.value = 1), 450))
  timers.push(window.setTimeout(() => (phase.value = 2), 1050))
  timers.push(window.setTimeout(() => { phase.value = 3; cta.value?.focus({ preventScroll: true }) }, 2500))
})
onBeforeUnmount(() => timers.forEach((x) => window.clearTimeout(x)))

function skip() { timers.forEach((x) => window.clearTimeout(x)); phase.value = 3; cta.value?.focus() }
</script>

<template>
  <div class="aketa" :class="[`phase-${phase}`, { 'is-reduced': reduced }]">
    <div class="aketa__bar"><TopBar back="/demo/locked" /></div>
    <main class="aketa__stage" @click="phase < 3 && skip()">
      <div class="aketa__art" aria-hidden="true">
        <span class="aketa__ring aketa__ring--1" />
        <span class="aketa__ring aketa__ring--2" />
        <span class="aketa__glow" />
        <span v-for="(r, i) in rays" :key="i" class="aketa__ray" :style="{ '--a': r.a + 'deg', '--d': r.d + 'px', '--i': i }">
          <Sparkle :size="r.s" />
        </span>
        <span class="aketa__lock"><LockGlyph :size="96" :open="phase >= 1" /></span>
      </div>
      <h1 class="aketa__word" data-focus-start tabindex="-1">Aketa!</h1>
      <p class="aketa__sub" lang="ja"><span>開けた</span> · <span lang="en">it opened!</span></p>
      <p class="aketa__met" role="status">{{ phase >= 2 ? t.metAt : '' }}</p>
    </main>
    <div class="aketa__foot">
      <button ref="cta" type="button" class="btn btn--primary btn--block" :tabindex="phase === 3 ? 0 : -1" :aria-hidden="phase < 3" @click="router.push('/demo/reveal')">See everyone’s calls</button>
      <button v-if="phase < 3" type="button" class="btn btn--ghost btn--sm aketa__skip" @click.stop="skip">Skip animation</button>
    </div>
  </div>
</template>
