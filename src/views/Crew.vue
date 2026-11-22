<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Screen from '../components/Screen.vue'
import Avatar from '../components/Avatar.vue'
import { CREW, MEMBERS, PHOTOS } from '../data'
import { state } from '../store'

const router = useRouter()
const mode = ref<'create' | 'join'>(state.crew === 'joined' ? 'join' : 'create')
const name = ref(state.crewName || CREW.name)
const code = ref(state.crew === 'joined' ? CREW.code : '')
const error = ref('')
const done = computed(() => state.crew !== null)

const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

function setMode(m: 'create' | 'join') {
  if (mode.value === m) return
  mode.value = m
  error.value = ''
  state.crew = null
}

function create() {
  const n = name.value.trim()
  if (!n) { error.value = 'Give your crew a name first.'; return }
  error.value = ''
  state.crewName = n.slice(0, 40)
  state.crew = 'created'
}

function join() {
  if (normalize(code.value) !== normalize(CREW.code)) {
    error.value = code.value.trim()
      ? `We couldn’t find “${code.value.trim()}”. In this demo, try ${CREW.code}.`
      : `Enter a crew code. In this demo, try ${CREW.code}.`
    return
  }
  error.value = ''
  code.value = CREW.code
  state.crewName = CREW.name
  state.crew = 'joined'
}

function onTabKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    setMode(mode.value === 'create' ? 'join' : 'create')
    document.getElementById(`tab-${mode.value}`)?.focus()
  }
}
</script>

<template>
  <Screen :photo="PHOTOS.van" kicker="Your crew" caption="The people who’ll be there when it opens." back="/" :step="1">
    <p class="kicker">Step 1 · Crew</p>
    <h1 class="title">Start a crew or join one</h1>
    <p class="lede">Crews are private. Only members see what’s locked inside.</p>

    <div class="seg" role="tablist" aria-label="Crew options" @keydown="onTabKey">
      <button id="tab-create" type="button" role="tab" class="seg__btn" :aria-selected="mode === 'create'" :tabindex="mode === 'create' ? 0 : -1" aria-controls="panel-crew" @click="setMode('create')">Start a crew</button>
      <button id="tab-join" type="button" role="tab" class="seg__btn" :aria-selected="mode === 'join'" :tabindex="mode === 'join' ? 0 : -1" aria-controls="panel-crew" @click="setMode('join')">Join with a code</button>
    </div>

    <section id="panel-crew" role="tabpanel" :aria-labelledby="`tab-${mode}`" class="stack">
      <form v-if="mode === 'create' && !done" class="stack" novalidate @submit.prevent="create">
        <label class="field">
          <span class="field__label">Crew name</span>
          <input v-model="name" class="input" maxlength="40" autocomplete="off" :aria-invalid="!!error" aria-describedby="crew-msg" />
        </label>
        <p id="crew-msg" class="field__msg" :class="{ 'is-error': error }" aria-live="polite">{{ error || 'Prefilled for the demo. Change it if you like.' }}</p>
        <button type="submit" class="btn btn--primary btn--block">Create crew</button>
      </form>

      <form v-if="mode === 'join' && !done" class="stack" novalidate @submit.prevent="join">
        <label class="field">
          <span class="field__label">Crew code</span>
          <input v-model="code" class="input input--code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. C7-GATE" :aria-invalid="!!error" aria-describedby="join-msg" />
        </label>
        <p id="join-msg" class="field__msg" :class="{ 'is-error': error }" aria-live="polite">
          <template v-if="error">{{ error }}</template>
          <template v-else>Demo code: <button type="button" class="linkbtn" @click="code = CREW.code">{{ CREW.code }}</button></template>
        </p>
        <button type="submit" class="btn btn--primary btn--block">Join crew</button>
      </form>

      <div v-if="done" class="card crewcard" aria-live="polite">
        <div class="crewcard__head">
          <div>
            <p class="kicker">{{ state.crew === 'joined' ? 'You’re in' : 'Crew created' }}</p>
            <h2 class="crewcard__name">{{ state.crewName }}</h2>
            <p class="muted">{{ CREW.blurb }}</p>
          </div>
          <p class="code-pill" :aria-label="`Invite code ${CREW.code}`">{{ CREW.code }}</p>
        </div>
        <ul class="members" aria-label="Crew members">
          <li v-for="m in MEMBERS" :key="m.id" class="members__row">
            <Avatar :id="m.id" />
            <span class="members__name">{{ m.name }}</span>
            <span v-if="m.id === 'maya'" class="tag">You</span>
            <span v-else class="members__status">{{ state.crew === 'created' ? 'Joined via invite' : 'Member' }}</span>
          </li>
        </ul>
      </div>
    </section>

    <template v-if="done" #foot>
      <button type="button" class="btn btn--primary btn--block" @click="router.push('/templates')">Choose what to lock</button>
    </template>
  </Screen>
</template>
