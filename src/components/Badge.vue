<script setup lang="ts">
// Custom inline SVG badges, drawn like collectible stickers: cream die-cut edge, navy body, amber + cream art.
// No icon fonts or external icon services.
import type { BadgeId } from '../stats'
withDefaults(defineProps<{ id: BadgeId; size?: number; locked?: boolean }>(), { size: 64, locked: false })
const N = '#121A2C', A = '#F4A35C', C = '#F4EEE6', A2 = '#F8C58C'
</script>

<template>
  <span class="bdg" :class="{ 'is-locked': locked, 'is-on': !locked }" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true">
    <svg :width="size" :height="size" viewBox="0 0 64 64" focusable="false">
      <!-- Oracle: hexagon, an eye with a keyhole pupil, three dots for three in a row -->
      <g v-if="id === 'oracle'">
        <path :fill="C" d="M32 1 59 16.5v31L32 63 5 47.5v-31z" />
        <path :fill="N" d="M32 5 55.5 18.5v27L32 59 8.5 45.5v-27z" />
        <path :fill="A" d="M12 30c6-9 13-13 20-13s14 4 20 13c-6 9-13 13-20 13s-14-4-20-13z" />
        <circle cx="32" cy="30" r="8.5" :fill="N" />
        <path :fill="C" d="M30.4 31.5a3.2 3.2 0 1 1 3.2 0l1 5h-5.2z" />
        <circle cx="24" cy="50" r="2.4" :fill="A2" /><circle cx="32" cy="50" r="2.4" :fill="A2" /><circle cx="40" cy="50" r="2.4" :fill="A2" />
      </g>
      <!-- Dare Finisher: tilted diamond with a checkered finish flag -->
      <g v-else-if="id === 'dare'">
        <rect x="9" y="9" width="46" height="46" rx="9" transform="rotate(45 32 32)" :fill="C" />
        <rect x="12.5" y="12.5" width="39" height="39" rx="7" transform="rotate(45 32 32)" :fill="N" />
        <rect x="22" y="15" width="3" height="34" rx="1.5" :fill="C" />
        <path :fill="A" d="M25 17h20l-4 6 4 6H25z" />
        <path :fill="N" d="M25 17h5v4h-5zm10 0h5v4h-5zm-5 4h5v4h-5zm10 0h3l-1.3 2 1.3 2H40zm-15 4h5v4h-5zm10 0h5v4h-5z" />
        <path :fill="A2" d="M44 41l1.6 3.4 3.4 1.6-3.4 1.6L44 51l-1.6-3.4-3.4-1.6 3.4-1.6z" />
      </g>
      <!-- Laughed Too: round sticker, laughing face with a happy tear -->
      <g v-else-if="id === 'laughed'">
        <circle cx="32" cy="32" r="30" :fill="C" />
        <circle cx="32" cy="32" r="26.5" :fill="N" />
        <circle cx="32" cy="32" r="18" :fill="A" />
        <path d="M22 28q3-4 6 0M36 28q3-4 6 0" fill="none" :stroke="N" stroke-width="2.6" stroke-linecap="round" />
        <path :fill="N" d="M22 35h20a10 10 0 0 1-20 0z" />
        <path :fill="C" d="M26 37h12a6 4 0 0 1-12 0z" />
        <path :fill="C" d="M47 30c2 3 3 5 3 6.5a3 3 0 0 1-6 0c0-1.5 1-3.5 3-6.5z" />
      </g>
      <!-- Night Owl: crescent-topped shield, owl eyes, little stars -->
      <g v-else-if="id === 'nightowl'">
        <path :fill="C" d="M32 2c10 0 26 4 26 4v24c0 17-12 28-26 32C18 58 6 47 6 30V6s16-4 26-4z" />
        <path :fill="N" d="M32 6c9 0 22.5 3.4 22.5 3.4V30c0 14.6-10 24.4-22.5 28C19.5 54.4 9.5 44.6 9.5 30V9.4S23 6 32 6z" />
        <path :fill="A2" d="M44 14a7 7 0 1 0 5.5 11.5A8 8 0 0 1 44 14z" />
        <circle cx="24" cy="36" r="7" :fill="A" /><circle cx="38" cy="36" r="7" :fill="A" />
        <circle cx="24" cy="36" r="3" :fill="N" /><circle cx="38" cy="36" r="3" :fill="N" />
        <path :fill="A2" d="M31 42h0l2.5 4-2.5 2-2.5-2z" transform="translate(0.5 0)" />
        <circle cx="17" cy="18" r="1.4" :fill="C" /><circle cx="28" cy="14" r="1" :fill="C" />
      </g>
      <!-- Crew Starter: starburst with three heads -->
      <g v-else-if="id === 'starter'">
        <path :fill="C" d="M32 1l6 7 9-3 2 9 9 2-3 9 7 7-7 6 3 9-9 2-2 9-9-3-6 7-6-7-9 3-2-9-9-2 3-9-7-6 7-7-3-9 9-2 2-9 9 3z" />
        <circle cx="32" cy="32" r="23" :fill="N" />
        <circle cx="22" cy="28" r="5" :fill="A2" /><circle cx="42" cy="28" r="5" :fill="A2" /><circle cx="32" cy="24" r="6" :fill="A" />
        <path :fill="A2" d="M14 44a8 8 0 0 1 16 0zM34 44a8 8 0 0 1 16 0z" />
        <path :fill="A" d="M22 46a10 10 0 0 1 20 0z" />
      </g>
      <!-- First Lock: stopwatch with a padlock face, "30" -->
      <g v-else-if="id === 'firstlock'">
        <rect x="26" y="1" width="12" height="8" rx="3" :fill="C" />
        <circle cx="32" cy="36" r="27" :fill="C" />
        <circle cx="32" cy="36" r="23.5" :fill="N" />
        <rect x="29" y="4" width="6" height="7" rx="2" :fill="A2" />
        <path d="M24 32v-5a8 8 0 0 1 16 0v5" fill="none" :stroke="A" stroke-width="3.5" stroke-linecap="round" />
        <rect x="19" y="31" width="26" height="18" rx="5" :fill="A" />
        <text x="32" y="45" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="700" font-size="12" :fill="N">30</text>
      </g>
      <!-- Template Maker: rounded card with a pencil and a sparkle -->
      <g v-else-if="id === 'maker'">
        <rect x="3" y="3" width="58" height="58" rx="14" :fill="C" transform="rotate(-6 32 32)" />
        <rect x="7" y="7" width="50" height="50" rx="11" :fill="N" transform="rotate(-6 32 32)" />
        <rect x="16" y="16" width="24" height="5" rx="2.5" :fill="C" opacity=".85" />
        <rect x="16" y="25" width="16" height="5" rx="2.5" :fill="C" opacity=".55" />
        <path :fill="A" d="M40 26l8 8-16 16h-8v-8z" />
        <path :fill="A2" d="M40 26l3-3a2.8 2.8 0 0 1 4 0l4 4a2.8 2.8 0 0 1 0 4l-3 3z" />
        <path :fill="C" d="M24 42v8h8z" opacity=".9" />
      </g>
      <!-- Reunion Keeper: time-capsule pill with a keyhole -->
      <g v-else-if="id === 'reunion'">
        <rect x="2" y="12" width="60" height="40" rx="20" :fill="C" transform="rotate(-20 32 32)" />
        <rect x="6" y="16" width="52" height="32" rx="16" :fill="N" transform="rotate(-20 32 32)" />
        <path :fill="A" d="M32 20.4 L46.8 15 A12.5 12.5 0 0 1 55.4 38.5 L40.6 43.9z" transform="translate(-4 0)" />
        <path :fill="A2" d="M14.6 25.9 L28 21 L36.6 44.5 L23.2 49.4 A12.5 12.5 0 0 1 14.6 25.9z" transform="translate(-4 0)" opacity=".35" />
        <path :fill="N" d="M44.5 29a3.4 3.4 0 1 1 3.4 0l1 5.4h-5.4z" transform="rotate(-20 46 30)" />
        <circle cx="19" cy="38" r="1.6" :fill="C" /><circle cx="25" cy="35" r="1.6" :fill="C" />
      </g>
      <!-- Stat badges: hits (target), rate (ring), streak (flame) -->
      <g v-else-if="id === 'hits'">
        <circle cx="32" cy="32" r="30" :fill="C" /><circle cx="32" cy="32" r="26.5" :fill="N" />
        <circle cx="32" cy="32" r="18" fill="none" :stroke="A" stroke-width="4" />
        <circle cx="32" cy="32" r="9" fill="none" :stroke="A2" stroke-width="4" />
        <circle cx="32" cy="32" r="3" :fill="C" />
        <path d="M32 32 50 14" :stroke="C" stroke-width="3" stroke-linecap="round" />
        <path :fill="A" d="M50 9v5h5l-4 4h-5v-5z" />
      </g>
      <g v-else-if="id === 'rate'">
        <rect x="2" y="2" width="60" height="60" rx="18" :fill="C" /><rect x="5.5" y="5.5" width="53" height="53" rx="15" :fill="N" />
        <circle cx="32" cy="32" r="17" fill="none" stroke="#2C3650" stroke-width="7" />
        <circle cx="32" cy="32" r="17" fill="none" :stroke="A" stroke-width="7" stroke-dasharray="62 107" stroke-linecap="round" transform="rotate(-90 32 32)" />
        <path :fill="C" d="M30.4 33.5a3.2 3.2 0 1 1 3.2 0l1 5h-5.2z" />
      </g>
      <g v-else>
        <path :fill="C" d="M32 2c4 9 18 16 18 32a18 18 0 0 1-36 0c0-8 4-12 7-15 0 5 2 8 5 9-1-10 2-19 6-26z" transform="translate(0 4) scale(1 .94)" />
        <path :fill="A" d="M32 9c3 8 14 13 14 26a14 14 0 0 1-28 0c0-6 3-9 5-11 0 4 2 7 5 8-1-8 1-16 4-23z" transform="translate(0 4) scale(1 .94)" />
        <path :fill="A2" d="M32 30c3 4 7 6 7 12a7 7 0 0 1-14 0c0-3 2-5 3-6 1 2 2 3 3 3 0-3 0-6 1-9z" transform="translate(0 4) scale(1 .94)" />
      </g>
    </svg>
    <span v-if="locked" class="bdg__lock"><svg width="14" height="14" viewBox="0 0 48 48"><path d="M15 22V15a9 9 0 0 1 18 0v7" fill="none" stroke="#F4EEE6" stroke-width="5" stroke-linecap="round" /><rect x="9" y="21" width="30" height="22" rx="6" fill="#F4EEE6" /></svg></span>
  </span>
</template>
