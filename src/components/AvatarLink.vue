<script setup lang="ts">
// An avatar that opens that member's crew profile.
import Avatar from './Avatar.vue'
import { member } from '../data'
import type { MemberId } from '../data'
withDefaults(defineProps<{ id: MemberId; size?: number; locked?: boolean }>(), { size: 40, locked: false })
</script>

<template>
  <RouterLink :to="`/demo/u/${id}`" class="avlink" :aria-label="`${member(id).name}’s profile`" :data-testid="`av-${id}`">
    <Avatar :id="id" :size="size" :locked="locked" />
  </RouterLink>
</template>
