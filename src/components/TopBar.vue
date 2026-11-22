<script setup lang="ts">
import { useRouter } from 'vue-router'
import Mark from './Mark.vue'
const props = defineProps<{ back?: string; step?: number; total?: number }>()
const router = useRouter()
function goBack() {
  if (props.back) router.push(props.back)
}
</script>

<template>
  <header class="topbar">
    <button v-if="back" type="button" class="iconbtn" aria-label="Back" @click="goBack">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <RouterLink to="/" class="wordmark" aria-label="akeru, back to welcome"><Mark :size="24" />akeru</RouterLink>
    <div class="topbar__end">
      <p v-if="step && total" class="topbar__step">
        <span class="visually-hidden">Step {{ step }} of {{ total }}</span>
        <span class="steps" aria-hidden="true">
          <span v-for="i in total" :key="i" class="steps__seg" :class="{ 'is-on': i <= step }" />
        </span>
      </p>
      <slot />
    </div>
  </header>
</template>
