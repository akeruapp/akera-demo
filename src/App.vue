<script setup lang="ts">
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
let first = true
router.afterEach(async () => {
  if (first) { first = false; return }
  await nextTick()
  // Move focus to the new screen's heading for keyboard and screen reader users.
  const h = document.querySelector<HTMLElement>('[data-focus-start]') ?? document.querySelector<HTMLElement>('h1')
  if (h) {
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1')
    h.focus({ preventScroll: true })
  }
})
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>
