<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Gate from './views/Gate.vue'
import { isUnlocked } from './gate'
import { isDemoPath } from './router'

const router = useRouter()
const route = useRoute()
const unlocked = ref(isUnlocked())
// Every /demo route shows the passcode gate first; the URL (deep link) is kept and shown after unlock.
const gated = computed(() => isDemoPath(route.path) && !unlocked.value)

async function focusStart() {
  await nextTick()
  const h = document.querySelector<HTMLElement>('[data-focus-start]') ?? document.querySelector<HTMLElement>('h1')
  if (h) {
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1')
    h.focus({ preventScroll: true })
  }
}

let first = true
router.afterEach(() => {
  if (first) { first = false; return }
  focusStart()
})

function onUnlocked() {
  unlocked.value = true
  window.scrollTo(0, 0)
  focusStart()
}
</script>

<template>
  <Gate v-if="gated" @unlocked="onUnlocked" />
  <RouterView v-else v-slot="{ Component, route: r }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="r.path" />
    </Transition>
  </RouterView>
</template>
