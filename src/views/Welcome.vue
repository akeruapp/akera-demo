<script setup lang="ts">
import { useRouter } from 'vue-router'
import Mark from '../components/Mark.vue'
import { PHOTOS } from '../data'
import { resetDemo } from '../store'

const router = useRouter()
function start() {
  resetDemo()
  router.push('/crew')
}
</script>

<template>
  <div class="welcome">
    <img class="welcome__photo" :src="PHOTOS.couch.src" :alt="PHOTOS.couch.alt" />
    <div class="welcome__scrim" aria-hidden="true" />
    <header class="welcome__bar">
      <span class="wordmark"><Mark :size="24" />akeru</span>
      <span class="demo-tag">Clickable demo</span>
    </header>
    <main class="welcome__body">
      <Mark class="welcome__mark" :size="72" />
      <p class="welcome__kicker" lang="ja"><span>開ける</span><span class="dot" aria-hidden="true">·</span><span lang="en">to open</span></p>
      <h1 class="welcome__title">
        Akeru
      </h1>
      <p class="welcome__tagline">Lock it. Live it. Relive it.</p>
      <p class="welcome__line">Friends lock predictions, dares and moments that unlock when real life delivers.</p>
      <div class="welcome__actions">
        <button type="button" class="btn btn--primary btn--lg" @click="start">
          Start the demo
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <RouterLink to="/r/x7k2" class="btn btn--ghost">See a shared reveal</RouterLink>
      </div>
      <RouterLink to="/partner/run" class="welcome__partner">See it from a partner app</RouterLink>
      <p class="welcome__hint">A clickable walk-through of the flow with sample data. Not the native app.</p>
    </main>
    <p class="welcome__credit credit">Photo: {{ PHOTOS.couch.credit }} / Pexels</p>
  </div>
</template>
