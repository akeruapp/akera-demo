<script setup lang="ts">
// Akeru mark (inline copy of src/assets/akeru-mark.svg so it can be sized and themed).
withDefaults(defineProps<{ size?: number; label?: string }>(), { size: 24, label: '' })
const uid = `akg-${Math.random().toString(36).slice(2, 8)}`
</script>

<template>
  <svg class="mark" :width="size" :height="size" viewBox="6 4 96 96" :role="label ? 'img' : undefined" :aria-label="label || undefined" :aria-hidden="label ? undefined : 'true'" focusable="false">
    <defs>
      <linearGradient :id="uid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F8C58C" />
        <stop offset=".55" stop-color="#F4A35C" />
      </linearGradient>
    </defs>
    <path fill="#F4A35C" fill-rule="evenodd" d="M50 97 A40 40 0 0 1 10 57 A40 40 0 0 1 50 17 C72 17 90 30 90 48 L90 92 Q90 97 85 97 Z M45.5 57.04 A11 11 0 1 1 54.5 57.04 L58.4 77.6 Q59 81 55.6 81 L44.4 81 Q41 81 41.6 77.6 Z" />
    <path :fill="`url(#${uid})`" transform="translate(78 9) scale(.2)" d="M100 50 C60.65 55.78 55.78 60.65 50 100 C44.22 60.65 39.35 55.78 0 50 C39.35 44.22 44.22 39.35 50 0 C55.78 39.35 60.65 44.22 100 50 Z" />
  </svg>
</template>
