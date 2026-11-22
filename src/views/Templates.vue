<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Screen from '../components/Screen.vue'
import Sparkle from '../components/Sparkle.vue'
import { TEMPLATES, template } from '../data'
import type { TemplateId } from '../data'
import { pickTemplate, state } from '../store'

const router = useRouter()
if (!state.templateId) pickTemplate('dinner')
const current = computed(() => template(state.templateId ?? 'dinner'))

function choose(id: TemplateId) { pickTemplate(id) }
</script>

<template>
  <Screen :photo="current.photo" kicker="Template" :caption="current.name" back="/crew" :step="2">
    <p class="kicker">Step 2 · {{ state.crewName }}</p>
    <h1 class="title">What are you locking?</h1>
    <p class="lede">Pick a template. Each one opens on a real-world moment.</p>

    <fieldset class="tpls">
      <legend class="visually-hidden">Templates</legend>
      <label v-for="t in TEMPLATES" :key="t.id" class="tpl" :class="{ 'is-on': state.templateId === t.id }">
        <input type="radio" name="tpl" class="visually-hidden" :value="t.id" :checked="state.templateId === t.id" @change="choose(t.id)" />
        <img class="tpl__img" :src="t.photo.src" alt="" />
        <span class="tpl__text">
          <span class="tpl__name">{{ t.name }}</span>
          <span class="tpl__line">{{ t.tagline }}</span>
          <span class="tpl__cond"><span class="dot-live" aria-hidden="true" />Opens on: {{ t.opensOn ?? t.condition.replace(/ via .*/, '').toLowerCase() }}</span>
        </span>
        <span class="tpl__check" aria-hidden="true"><Sparkle :size="16" color="var(--ink)" /></span>
      </label>
    </fieldset>
    <p class="tpls__partner"><RouterLink to="/partner/run">See it from a partner app</RouterLink></p>

    <template #foot>
      <button type="button" class="btn btn--primary btn--block" @click="router.push('/lock')">Use “{{ current.name }}”</button>
    </template>
  </Screen>
</template>
