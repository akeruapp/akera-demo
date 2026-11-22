<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sparkle from '../components/Sparkle.vue'
import Mark from '../components/Mark.vue'
import { PARTNER, PHOTOS, SHARE_SLUGS } from '../data'
import { startFromPartner } from '../store'

const route = useRoute()
const router = useRouter()
const ready = computed(() => route.query.aketa === 'ready')
const splits = [
  { km: '0–2.5 km', t: '12:41', pace: '5:04' },
  { km: '2.5–5 km', t: '12:38', pace: '5:03' },
  { km: '5–7.5 km', t: '12:30', pace: '5:00' },
  { km: '7.5–10 km', t: '12:23', pace: '4:57' },
]

function lockDare() {
  startFromPartner()
  router.push('/demo/lock')
}
</script>

<template>
  <div class="partner">
    <p class="partner__ribbon">
      <span class="partner__ribbon-tag">Partner example</span>
      A fictional race-timing app, showing how Akeru appears inside a partner’s app.
      <RouterLink to="/demo/partners" class="partner__ribbon-link">How partners connect</RouterLink>
    </p>

    <div class="partner__app">
      <header class="partner__bar">
        <span class="partner__logo" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="8" fill="#14532D"/><path d="M7 19 L12 9 L16 16 L18.5 12 L21 19 Z" fill="#F3F7F2"/></svg>
        </span>
        <span class="partner__brand">Fieldstone <span>Timing</span></span>
        <span class="partner__menu">Results</span>
      </header>

      <main class="partner__main">
        <RouterLink v-if="ready" :to="`/demo/r/${SHARE_SLUGS.run}`" class="partner__ready" data-testid="aketa-ready">
          <span class="partner__ready-icon" aria-hidden="true"><Sparkle :size="20" /></span>
          <span class="partner__ready-text">
            <strong>Your crew’s Aketa is ready</strong>
            <span>Gate C Crew’s guesses just opened. See the reveal</span>
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </RouterLink>

        <figure class="partner__hero">
          <img :src="PHOTOS.finish.src" :alt="PHOTOS.finish.alt" />
          <figcaption>Photo: {{ PHOTOS.finish.credit }} / Pexels</figcaption>
        </figure>

        <section class="partner__result" aria-labelledby="pr-h">
          <p class="partner__event">Riverside 10K · for the food bank · Sunday</p>
          <h1 id="pr-h" class="partner__name">Sam Bennett</h1>
          <p class="partner__status"><span class="partner__check" aria-hidden="true">✓</span> Finished</p>
          <p class="partner__time" aria-label="Official time 50 minutes 12 seconds">50:12</p>
          <p class="partner__timelabel">Official chip time · personal best</p>
          <dl class="partner__stats">
            <div><dt>Pace</dt><dd>5:01 /km</dd></div>
            <div><dt>Overall</dt><dd>212 of 1,480</dd></div>
            <div><dt>Bib</dt><dd>1322</dd></div>
          </dl>
        </section>

        <section class="partner__splits" aria-labelledby="sp-h">
          <h2 id="sp-h">Splits</h2>
          <table>
            <thead><tr><th scope="col">Segment</th><th scope="col">Time</th><th scope="col">Pace /km</th></tr></thead>
            <tbody><tr v-for="s in splits" :key="s.km"><th scope="row">{{ s.km }}</th><td>{{ s.t }}</td><td>{{ s.pace }}</td></tr></tbody>
          </table>
        </section>

        <section class="akeru-module" aria-labelledby="ak-h">
          <p class="akeru-module__by"><Mark :size="20" /> with <span class="akeru-module__mark">akeru</span></p>
          <h2 id="ak-h" class="akeru-module__title">Make the next one a story</h2>
          <p class="akeru-module__text">Lock a friendly dare with your crew. It opens when everyone finishes.</p>
          <button type="button" class="akeru-btn" @click="lockDare">🔒 Lock a dare with your crew for the next run</button>
        </section>

        <p class="partner__foot">
          Fieldstone Timing only sends Akeru a yes/no “finished” signal. It never sees what anyone in your crew wrote.
        </p>
      </main>
    </div>

    <p class="partner__back"><RouterLink to="/demo/">Back to the Akeru demo</RouterLink></p>
  </div>
</template>
