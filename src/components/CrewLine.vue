<script setup lang="ts">
import { state } from '../store'
</script>

<template>
  <!-- Which crew this is for: the crew you started or joined (name + code), never a hardcoded sample. -->
  <p v-if="state.crew" class="crewline" data-testid="crew-line">
    <span class="visually-hidden">Crew: </span><span class="crewline__name">{{ state.crewName }}</span>
    <span class="crewline__code mono" :aria-label="`code ${state.crewCode}`">{{ state.crewCode }}</span>
  </p>
</template>
