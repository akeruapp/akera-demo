<script setup lang="ts">
withDefaults(defineProps<{ size?: number; open?: boolean }>(), { size: 24, open: false })
</script>

<template>
  <svg class="lockglyph" :class="{ 'is-open': open }" :width="size" :height="size" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path class="lockglyph__shackle" d="M15 22 V15 a9 9 0 0 1 18 0 V22" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
    <rect x="9" y="21" width="30" height="22" rx="6" fill="currentColor" />
    <circle cx="24" cy="31" r="3" fill="var(--ink)" />
    <rect x="22.6" y="32" width="2.8" height="6" rx="1.4" fill="var(--ink)" />
  </svg>
</template>
