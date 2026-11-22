<script setup lang="ts">
import { ref } from 'vue'
import Mark from '../components/Mark.vue'
import Orbit from '../components/Orbit.vue'
import { tryUnlock } from '../gate'

const emit = defineEmits<{ unlocked: [] }>()
const code = ref('')
const error = ref('')
const busy = ref(false)
const input = ref<HTMLInputElement | null>(null)

async function submit() {
  if (busy.value) return
  if (!code.value.trim()) { error.value = 'Enter the passcode to continue.'; input.value?.focus(); return }
  busy.value = true
  const ok = await tryUnlock(code.value).catch(() => false)
  busy.value = false
  if (ok) { code.value = ''; emit('unlocked'); return }
  error.value = 'That passcode didn’t open it. Check with the person who shared the link and try again.'
  code.value = ''
  input.value?.focus()
}
</script>

<template>
  <div class="gate">
    <Orbit class="gate__orbit" :w="480" :h="168" :at="0.1" :spark="16" />
    <main class="gate__main">
      <Mark :size="72" />
      <p class="gate__word">akeru</p>
      <h1 class="gate__title" tabindex="-1" data-focus-start>Enter passcode</h1>
      <p class="gate__lede">This preview is private. Enter the passcode you were given to open it.</p>
      <form class="gate__form" novalidate @submit.prevent="submit">
        <label class="field">
          <span class="field__label">Passcode</span>
          <input ref="input" v-model="code" class="input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false"
            :aria-invalid="!!error" aria-describedby="gate-msg" @input="error = ''" />
        </label>
        <p id="gate-msg" class="field__msg" :class="{ 'is-error': error }" role="status" aria-live="polite">{{ error }}</p>
        <button type="submit" class="btn btn--primary btn--block btn--lg" :disabled="busy">Open the preview</button>
      </form>
    </main>
  </div>
</template>
