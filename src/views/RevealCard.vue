<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CrewLine from '../components/CrewLine.vue'
import Screen from '../components/Screen.vue'
import Avatar from '../components/Avatar.vue'
import AvatarLink from '../components/AvatarLink.vue'
import PastRuns from '../components/PastRuns.vue'
import Sparkle from '../components/Sparkle.vue'
import { buildReveal, member, slugFor, template } from '../data'
import type { BuiltinId, MemberId } from '../data'
import { state } from '../store'

const router = useRouter()
const t = computed(() => template(state.templateId!))
const r = computed(() => buildReveal(t.value, state.myCall ?? t.value.defaultCall))
const target = computed(() => (r.value.roast ? member(r.value.roast.target) : null))
const canShare = computed(() => !r.value.roast || state.consent)
const slug = computed(() => slugFor(t.value))

function whoLabel(by: MemberId) {
  const n = by === 'maya' ? 'You' : member(by).first
  if (t.value.kind === 'note') return `${n} wrote`
  if (t.value.id === 'run' && by === 'sam') return 'Sam, the runner'
  return `${n} called`
}

function share() {
  if (!canShare.value) return
  router.push({ path: `/demo/r/${slug.value}`, query: { from: 'crew' } })
}
</script>

<template>
  <Screen :photo="t.revealPhoto" kicker="Aketa!" :caption="r.headline" back="/demo/aketa" :step="5">
    <article class="reveal">
      <figure class="reveal__photo">
        <img :src="t.revealPhoto.src" :alt="t.revealPhoto.alt" :style="t.revealPhoto.focus ? { objectPosition: t.revealPhoto.focus } : undefined" />
        <figcaption class="reveal__stamp"><Sparkle :size="16" /> Aketa!</figcaption>
      </figure>
      <p class="kicker">{{ r.kicker }} · {{ t.metAt.split(' · ').slice(-1)[0] }}</p>
      <CrewLine />
      <h1 class="title">{{ r.headline }}</h1>
      <p class="lede">{{ r.summary }}</p>

      <section aria-labelledby="calls-h" class="stack">
        <h2 id="calls-h" class="card__label">Everyone’s calls</h2>
        <ul class="calls" :class="{ 'calls--notes': t.kind === 'note' }">
          <li v-for="row in r.rows" :key="row.by" class="calls__row" :class="{ 'is-hi': row.highlight }">
            <AvatarLink :id="row.by" :size="40" />
            <div class="calls__body">
              <p class="calls__who">{{ whoLabel(row.by) }}
                <span v-if="row.badge" class="badge"><Sparkle :size="10" color="var(--ink)" />{{ row.badge }}</span>
              </p>
              <p class="calls__call">{{ row.call }}</p>
              <p v-if="row.aside" class="calls__aside">{{ row.aside }}</p>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="r.funBit" class="card funbit" aria-labelledby="fun-h">
        <h2 id="fun-h" class="card__label">{{ r.funBit.label }}</h2>
        <p class="funbit__text">{{ r.funBit.text }}</p>
      </section>

      <section v-if="r.roast && target" class="card roast" aria-labelledby="roast-h">
        <h2 id="roast-h" class="card__label">Friendly roast</h2>
        <p class="roast__text">{{ r.roast.text }}</p>
        <p class="roast__out">{{ r.roast.consequence }}</p>
        <div class="consent">
          <div class="consent__head">
            <Avatar :id="target.id" :size="32" />
            <p><strong>{{ target.first }} holds the share key.</strong> A roast only leaves the crew if {{ target.first }} is laughing too.</p>
          </div>
          <label class="switch">
            <input v-model="state.consent" type="checkbox" class="switch__input" role="switch" :aria-checked="state.consent" />
            <span class="switch__track" aria-hidden="true"><span class="switch__thumb" /></span>
            <span class="switch__label">
              <span class="switch__main">I’m laughing too</span>
              <span class="switch__sub">Demo control: tap on {{ target.first }}’s behalf</span>
            </span>
          </label>
        </div>
      </section>

      <section class="card sharebox" aria-labelledby="share-h">
        <h2 id="share-h" class="card__label">Share the reveal</h2>
        <p class="muted">Opt in to share a public card at <span class="mono">aketa.app/r/{{ slug }}</span>. Your crew and chat stay private.</p>
        <p id="share-why" class="sharebox__state" :class="{ 'is-ready': canShare }" aria-live="polite">
          <template v-if="canShare"><Sparkle :size="12" /> Ready to share{{ r.roast ? `, ${target?.first} is laughing too` : '' }}</template>
          <template v-else>Waiting on {{ target?.first }}’s “I’m laughing too”</template>
        </p>
      </section>
      <PastRuns v-if="!t.slug" :template="(t.id as BuiltinId)" />
    </article>

    <template #foot>
      <button type="button" class="btn btn--primary btn--block" :disabled="!canShare" aria-describedby="share-why" @click="share">Share reveal card</button>
      <button type="button" class="btn btn--ghost btn--block" @click="router.push('/demo/templates')">Keep it in the crew · lock another</button>
    </template>
  </Screen>
</template>
