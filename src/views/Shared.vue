<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AvatarLink from '../components/AvatarLink.vue'
import PastRuns from '../components/PastRuns.vue'
import Orbit from '../components/Orbit.vue'
import Mark from '../components/Mark.vue'
import Sparkle from '../components/Sparkle.vue'
import { CREW, buildReveal, member, template, templateForSlug } from '../data'
import type { BuiltinId } from '../data'
import { state } from '../store'

const route = useRoute()
const missing = computed(() => String(route.params.slug).startsWith('u-') && !templateForSlug(String(route.params.slug)))
const id = computed(() => templateForSlug(String(route.params.slug)) ?? 'dinner')
const t = computed(() => template(id.value))
const fromCrew = computed(() => route.query.from === 'crew' && state.templateId === id.value)
// Direct loads always show the canned reveal; in-app shares show Maya's own call.
const r = computed(() => buildReveal(t.value, fromCrew.value && state.myCall ? state.myCall : t.value.defaultCall))
const pub = (s: string) => s.replace(/\byou\b/gi, 'Maya')
const crewName = computed(() => (fromCrew.value ? state.crewName : CREW.name))

</script>

<template>
  <div class="shared">
    <Orbit class="shared__orbit shared__orbit--a" :w="520" :h="180" :at="0.1" :spark="22" />
    <Orbit class="shared__orbit shared__orbit--b" :w="420" :h="140" :tilt="-30" :at="0.55" :spark="16" />
    <header class="shared__bar">
      <span class="wordmark"><Mark :size="24" /><span>aketa<span class="amber">!</span></span></span>
      <span class="urlpill"><svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/></svg>aketa.app/r/{{ route.params.slug }}</span>
    </header>

    <p v-if="fromCrew" class="shared__note" role="status">This is the public card your link opens. Demo only: nothing was posted.</p>

    <main v-if="missing" class="shared__main">
      <article class="pubcard pubcard--missing">
        <div class="pubcard__body">
          <p class="pubcard__aketa"><Sparkle :size="20" /> Not here</p>
          <h1 class="title">This card lives in another demo session</h1>
          <p class="lede">Custom templates in this demo stay in the browser tab that made them.</p>
          <RouterLink to="/demo/" class="btn btn--primary btn--block btn--lg">Go to the demo</RouterLink>
        </div>
      </article>
    </main>
    <main v-else class="shared__main">
      <article class="pubcard">
        <figure class="pubcard__photo">
          <img :src="t.revealPhoto.src" :alt="t.revealPhoto.alt" :style="t.revealPhoto.focus ? { objectPosition: t.revealPhoto.focus } : undefined" />
          <figcaption class="credit">Photo: {{ t.revealPhoto.credit }} / Pexels</figcaption>
        </figure>
        <div class="pubcard__body">
          <p class="pubcard__aketa"><Sparkle :size="20" /> Aketa!</p>
          <h1 class="title">{{ pub(r.headline) }}</h1>
          <p class="muted">{{ crewName }} · {{ t.name }} · {{ t.metAt.split(' · ').slice(-1)[0] }}</p>
          <p class="lede">{{ pub(r.summary) }}</p>

          <ul class="pubcalls" :class="{ 'pubcalls--notes': t.kind === 'note' }" aria-label="Everyone’s calls">
            <li v-for="row in r.rows" :key="row.by" class="pubcalls__row" :class="{ 'is-hi': row.highlight }">
              <AvatarLink :id="row.by" :size="32" />
              <span class="pubcalls__who">{{ member(row.by).first }}</span>
              <span class="pubcalls__call">{{ row.call }}</span>
              <span v-if="row.badge" class="badge"><Sparkle :size="10" color="var(--ink)" />{{ row.badge }}</span>
            </li>
          </ul>

          <div v-if="r.funBit" class="pubroast"><p><strong>{{ r.funBit.label }}:</strong> {{ pub(r.funBit.text) }}</p></div>
          <div v-if="r.roast" class="pubroast">
            <p>{{ r.roast.text }} {{ r.roast.consequence }}</p>
            <p class="pubroast__ok"><Sparkle :size="12" /> {{ member(r.roast.target).first }} is laughing too</p>
          </div>

          <PastRuns v-if="!t.slug" :template="(id as BuiltinId)" />
          <p class="pubcard__foot">Made with <span class="amber">akeru</span> · Lock it. Live it. Relive it.</p>
        </div>
      </article>
    </main>
  </div>
</template>
