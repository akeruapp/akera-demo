<script setup lang="ts">
// Hairline amber orbit ring with a sparkle sitting on its path (deck slide 05).
const props = withDefaults(defineProps<{ w?: number; h?: number; tilt?: number; at?: number; spark?: number }>(), {
  w: 320, h: 120, tilt: -40, at: 0.62, spark: 18,
})
const rx = props.w / 2 - 2
const ry = props.h / 2 - 2
const t = props.at * Math.PI * 2
const sx = props.w / 2 + rx * Math.cos(t)
const sy = props.h / 2 + ry * Math.sin(t)
</script>

<template>
  <svg class="orbit" :width="w" :height="w" :viewBox="`0 ${-(w - h) / 2} ${w} ${w}`" aria-hidden="true" focusable="false">
    <g :transform="`rotate(${tilt} ${w / 2} ${h / 2})`">
      <ellipse :cx="w / 2" :cy="h / 2" :rx="rx" :ry="ry" fill="none" stroke="var(--amber)" stroke-opacity=".7" stroke-width="1" vector-effect="non-scaling-stroke" />
      <path
        :transform="`translate(${sx - spark / 2} ${sy - spark / 2}) scale(${spark / 100})`"
        d="M100 50 C60.65 55.78 55.78 60.65 50 100 C44.22 60.65 39.35 55.78 0 50 C39.35 44.22 44.22 39.35 50 0 C55.78 39.35 60.65 44.22 100 50 Z"
        fill="var(--amber)" stroke="var(--ink)" :stroke-width="600 / spark"
      />
    </g>
  </svg>
</template>
