<script setup lang="ts">
import type { Photo } from '../data'
import TopBar from './TopBar.vue'
import Orbit from './Orbit.vue'

withDefaults(defineProps<{
  photo?: Photo
  band?: boolean
  kicker?: string
  caption?: string
  back?: string
  step?: number
  total?: number
}>(), { band: false, total: 5 })
</script>

<template>
  <div class="screen">
    <aside v-if="photo" class="screen__media" aria-hidden="true">
      <img :src="photo.src" alt="" />
      <div class="screen__scrim" />
      <Orbit class="screen__orbit" :w="360" :h="128" :at="0.6" />
      <div class="screen__caption">
        <p v-if="kicker" class="kicker">{{ kicker }}</p>
        <p v-if="caption" class="screen__captitle">{{ caption }}</p>
        <p class="credit">Photo: {{ photo.credit }} / Pexels</p>
      </div>
    </aside>
    <div class="screen__main">
      <TopBar :back="back" :step="step" :total="total" />
      <figure v-if="photo && band" class="band">
        <img :src="photo.src" :alt="photo.alt" :style="photo.focus ? { objectPosition: photo.focus } : undefined" />
      </figure>
      <main class="screen__body" id="main">
        <slot />
      </main>
      <div v-if="$slots.foot" class="screen__foot">
        <slot name="foot" />
      </div>
    </div>
  </div>
</template>
