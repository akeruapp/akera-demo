<script setup lang="ts">
import { computed } from 'vue'
import type { MemberId } from '../data'
import { member } from '../data'
import LockGlyph from './LockGlyph.vue'

const props = withDefaults(defineProps<{ id: MemberId; size?: number; locked?: boolean }>(), { size: 40, locked: false })
const m = computed(() => member(props.id))
</script>

<template>
  <span class="avatar" :style="{ '--s': size + 'px', '--h': m.hue }" aria-hidden="true">
    {{ m.initials }}
    <span v-if="locked" class="avatar__lock"><LockGlyph :size="12" /></span>
  </span>
</template>
