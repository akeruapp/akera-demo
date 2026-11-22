<script setup lang="ts">
// Small "More" menu for the demo nav: FAQ, crew stats, coming soon.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const btn = ref<HTMLButtonElement | null>(null)
const LINKS = [
  { to: '/demo/stats', label: 'Crew stats', id: 'nav-stats' },
  { to: '/demo/faq', label: 'FAQ', id: 'nav-faq' },
  { to: '/demo/soon', label: 'Coming soon', id: 'nav-soon' },
]
async function toggle() {
  open.value = !open.value
  if (open.value) { await nextTick(); root.value?.querySelector<HTMLElement>('.navmenu__list a')?.focus() }
}
function close(refocus = false) { open.value = false; if (refocus) btn.value?.focus() }
function onDoc(e: MouseEvent) { if (open.value && root.value && !root.value.contains(e.target as Node)) close() }
function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') { e.preventDefault(); close(true); return }
  const items = [...(root.value?.querySelectorAll<HTMLElement>('.navmenu__list a') ?? [])]
  const i = items.indexOf(document.activeElement as HTMLElement)
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus() }
  if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus() }
}
onMounted(() => document.addEventListener('click', onDoc))
onBeforeUnmount(() => document.removeEventListener('click', onDoc))
</script>

<template>
  <div ref="root" class="navmenu" @keydown="onKey" @focusout="(e) => { if (!root?.contains(e.relatedTarget as Node)) open = false }">
    <button ref="btn" type="button" class="navmenu__btn" :aria-expanded="open" aria-controls="navmenu-list" data-testid="nav-more" @click="toggle">
      More <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <ul v-show="open" id="navmenu-list" class="navmenu__list">
      <li v-for="l in LINKS" :key="l.to"><RouterLink :to="l.to" :data-testid="l.id" @click="close()">{{ l.label }}</RouterLink></li>
    </ul>
  </div>
</template>
