<script setup lang="ts">
// QR code drawn in-page as SVG from a local encoder (qrcode-generator). No network request.
import { computed } from 'vue'
import qrcode from 'qrcode-generator'
import Mark from './Mark.vue'

const props = withDefaults(defineProps<{ value: string; size?: number; label?: string }>(), { size: 200, label: '' })
const MARGIN = 4

const qr = computed(() => {
  const q = qrcode(0, 'H') // high error correction leaves room for the mark in the middle
  q.addData(props.value, 'Byte')
  q.make()
  const n = q.getModuleCount()
  const c = Math.round(n * 0.22) | 1 // odd-sized clear square in the centre for the mark
  const lo = Math.floor((n - c) / 2)
  const hi = lo + c
  let d = ''
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (r >= lo && r < hi && col >= lo && col < hi) continue
      if (q.isDark(r, col)) d += `M${col + MARGIN} ${r + MARGIN}h1v1h-1z`
    }
  }
  return { d, total: n + MARGIN * 2, lo: lo + MARGIN, c }
})
</script>

<template>
  <div class="qr" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :viewBox="`0 0 ${qr.total} ${qr.total}`" :width="size" :height="size" role="img" :aria-label="label || `QR code for ${value}`" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="#F4EEE6" />
      <path :d="qr.d" fill="#121A2C" />
      <rect :x="qr.lo + 0.5" :y="qr.lo + 0.5" :width="qr.c - 1" :height="qr.c - 1" rx="1.5" fill="#121A2C" />
    </svg>
    <Mark class="qr__mark" :size="Math.round(size * (qr.c - 2) / qr.total)" />
  </div>
</template>
