<script setup lang="ts">
// The deck's four-point "reveal" sparkle, recreated from SPARKLE in akeru_ink_amber.js.
withDefaults(defineProps<{ size?: number; outlined?: boolean; color?: string }>(), {
  size: 24, outlined: false, color: 'var(--amber)',
})
</script>

<template>
  <svg class="sparkle" :width="size" :height="size" viewBox="-2 -2 104 104" aria-hidden="true" focusable="false">
    <path
      d="M100 50 C60.65 55.78 55.78 60.65 50 100 C44.22 60.65 39.35 55.78 0 50 C39.35 44.22 44.22 39.35 50 0 C55.78 39.35 60.65 44.22 100 50 Z"
      :fill="color"
      :stroke="outlined ? 'var(--ink)' : 'none'"
      :stroke-width="outlined ? 6 : 0"
    />
  </svg>
</template>
