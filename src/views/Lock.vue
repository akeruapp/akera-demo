<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Screen from '../components/Screen.vue'
import Avatar from '../components/Avatar.vue'
import LockGlyph from '../components/LockGlyph.vue'
import { NOTE_SUGGESTIONS, PARTNER, member, parseTime, template } from '../data'
import { lockCall, prefersReducedMotion, state } from '../store'

const router = useRouter()
const t = computed(() => template(state.templateId!))
const partner = computed(() => state.fromPartner && t.value.id === 'run')
const others = computed(() => t.value.others)

// local draft per kind
const pick = ref(t.value.kind === 'pick' ? (state.myCall ?? t.value.defaultCall) : t.value.defaultCall)
const [h0, c0] = (t.value.kind === 'score' ? (state.myCall ?? t.value.defaultCall) : '2-1').split('-').map((n) => parseInt(n, 10))
const hawks = ref(h0)
const comets = ref(c0)
const secs = ref(parseTime(t.value.kind === 'time' ? (state.myCall ?? t.value.defaultCall) : '51:00'))
const note = ref(t.value.kind === 'note' ? (state.myCall ?? t.value.defaultCall) : '')
const sealing = ref(false)

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

const value = computed(() => {
  switch (t.value.kind) {
    case 'pick': return pick.value
    case 'score': return `${hawks.value}-${comets.value}`
    case 'time': return fmt(secs.value)
    default: return note.value.trim()
  }
})
const valid = computed(() => value.value.length > 0)

function seal() {
  if (!valid.value || sealing.value) return
  sealing.value = true
  lockCall(value.value)
  window.setTimeout(() => router.push('/locked'), prefersReducedMotion() ? 0 : 520)
}
</script>

<template>
  <Screen :photo="t.photo" band kicker="Lock your call" :caption="partner ? PARTNER.condition : t.name" :back="partner ? '/partner/run' : '/templates'" :step="3">
    <p class="kicker">Step 3 · {{ t.name }}</p>
    <h1 class="title">{{ partner ? PARTNER.question : t.question }}</h1>
    <p class="lede">{{ partner ? PARTNER.hint : t.hint }}</p>
    <p v-if="partner" class="condchip" data-testid="lock-condition">
      <span class="dot-live" aria-hidden="true" />
      <span><span class="condchip__k">Condition set</span> {{ PARTNER.condition }}</span>
    </p>

    <section class="card stack" aria-labelledby="your-call">
      <h2 id="your-call" class="card__label">Your call · Maya</h2>

      <fieldset v-if="t.kind === 'pick'" class="chips">
        <legend class="visually-hidden">{{ t.question }}</legend>
        <label v-for="p in t.picks" :key="p.value" class="chip" :class="{ 'is-on': pick === p.value }">
          <input v-model="pick" type="radio" name="pick" class="visually-hidden" :value="p.value" />
          <Avatar :id="p.value as any" :size="32" />
          {{ p.label }}
        </label>
      </fieldset>

      <div v-else-if="t.kind === 'score'" class="score">
        <div v-for="side in (['hawks', 'comets'] as const)" :key="side" class="score__side">
          <span :id="`lbl-${side}`" class="score__team">{{ side === 'hawks' ? 'Hawks' : 'Comets' }}</span>
          <div class="stepper" role="group" :aria-labelledby="`lbl-${side}`">
            <button type="button" class="iconbtn iconbtn--ring" :aria-label="`One fewer goal for ${side === 'hawks' ? 'Hawks' : 'Comets'}`"
              @click="side === 'hawks' ? (hawks = clamp(hawks - 1, 0, 9)) : (comets = clamp(comets - 1, 0, 9))">−</button>
            <output class="stepper__val" aria-live="polite">{{ side === 'hawks' ? hawks : comets }}</output>
            <button type="button" class="iconbtn iconbtn--ring" :aria-label="`One more goal for ${side === 'hawks' ? 'Hawks' : 'Comets'}`"
              @click="side === 'hawks' ? (hawks = clamp(hawks + 1, 0, 9)) : (comets = clamp(comets + 1, 0, 9))">+</button>
          </div>
        </div>
      </div>

      <div v-else-if="t.kind === 'time'" class="timepick">
        <output class="timepick__val" for="time-range" aria-live="polite">{{ fmt(secs) }}</output>
        <div class="timepick__row">
          <button type="button" class="iconbtn iconbtn--ring" aria-label="15 seconds faster" @click="secs = clamp(secs - 15, 40 * 60, 70 * 60)">−</button>
          <input id="time-range" v-model.number="secs" type="range" class="range" :min="40 * 60" :max="70 * 60" step="15" aria-label="Guess Sam’s finish time" :aria-valuetext="`${Math.floor(secs / 60)} minutes ${secs % 60} seconds`" />
          <button type="button" class="iconbtn iconbtn--ring" aria-label="15 seconds slower" @click="secs = clamp(secs + 15, 40 * 60, 70 * 60)">+</button>
        </div>
        <p class="muted small">Between 40:00 and 70:00, in 15-second steps.</p>
      </div>

      <div v-else class="stack">
        <label class="field">
          <span class="visually-hidden">{{ t.noteLabel }}</span>
          <textarea v-model="note" class="input textarea" rows="4" maxlength="180" aria-describedby="note-count" />
        </label>
        <p id="note-count" class="field__msg">{{ note.length }} / 180 · {{ t.sealedUntil }}</p>
        <div class="suggest" role="group" aria-label="Note ideas">
          <button v-for="s in (t.suggestions ?? NOTE_SUGGESTIONS)" :key="s" type="button" class="suggest__btn" @click="note = s">{{ s }}</button>
        </div>
      </div>
    </section>

    <section class="stack" aria-labelledby="already">
      <h2 id="already" class="card__label">Already locked · {{ others.length }} of {{ others.length + 1 }}</h2>
      <ul class="sealed">
        <li v-for="o in others" :key="o.by" class="sealed__row">
          <Avatar :id="o.by" :size="32" locked />
          <span class="sealed__name">{{ member(o.by).first }}</span>
          <span class="sealed__bar" aria-hidden="true" />
          <span class="sealed__state">Sealed</span>
        </li>
      </ul>
    </section>

    <template #foot>
      <button type="button" class="btn btn--primary btn--block btn--lock" :class="{ 'is-sealing': sealing }" :disabled="!valid" @click="seal">
        <LockGlyph :size="20" :open="!sealing" />
        {{ sealing ? 'Locked' : 'Lock my call' }}
      </button>
      <p class="foot__note">Once it’s locked, nobody sees it until it opens. Not even you.</p>
    </template>
  </Screen>
</template>
