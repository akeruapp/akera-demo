<script setup lang="ts">
import Mark from '../components/Mark.vue'
import Orbit from '../components/Orbit.vue'
import Sparkle from '../components/Sparkle.vue'
</script>

<template>
  <div class="landing">
    <Orbit class="landing__orbit landing__orbit--a" :w="560" :h="196" :at="0.12" :spark="20" />
    <Orbit class="landing__orbit landing__orbit--b" :w="420" :h="144" :tilt="-28" :at="0.58" :spark="14" />
    <Sparkle class="landing__spark landing__spark--1" :size="20" />
    <Sparkle class="landing__spark landing__spark--2" :size="12" />
    <main class="landing__main">
      <Mark class="landing__mark" :size="112" label="Akeru logo" />
      <h1 class="landing__word">akeru</h1>
      <p class="landing__kicker" lang="ja"><span>開ける</span><span class="dot" aria-hidden="true">·</span><span lang="en">to open</span></p>
      <p class="landing__teaser">Lock it in now. Open it together when it happens.</p>
      <p class="landing__soon"><span class="landing__domain">akeru.app</span><span class="dot" aria-hidden="true">·</span>coming soon</p>
    </main>
  </div>
</template>
