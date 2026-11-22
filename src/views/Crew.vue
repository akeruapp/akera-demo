<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Screen from '../components/Screen.vue'
import AvatarLink from '../components/AvatarLink.vue'
import { CREW, PHOTOS } from '../data'
import { cleanCode, codeFor, crewMembers, isSampleCode, normalizeCode as normalize, seedSample, startCrew, state } from '../store'
import LockGlyph from '../components/LockGlyph.vue'
import Badge from '../components/Badge.vue'
import { FIRST_LOCK, firstLock } from '../firstlock'

const router = useRouter()
const mode = ref<'create' | 'join'>(state.crew === 'joined' ? 'join' : 'create')
// A new crew starts blank: no sample name, code, blurb or members carried over from Gate C Crew.
const name = ref(state.crewCustom ? state.crewName : '')
const myCode = ref(state.crewCustom ? state.crewCode : '')
const blurb = ref(state.crewCustom ? state.crewBlurb : '')
const code = ref(state.crew === 'joined' ? state.crewCode : '')
const error = ref('')
const codeError = ref('')
const done = computed(() => state.crew !== null)
const members = computed(() => crewMembers())

function setMode(m: 'create' | 'join') {
  if (mode.value === m) return
  mode.value = m
  error.value = ''
  state.crew = null
}

function create() {
  const n = name.value.trim()
  error.value = n ? '' : 'Give your crew a name first.'
  codeError.value = ''
  let c = ''
  if (myCode.value.trim()) {
    c = cleanCode(myCode.value)
    if (!c) codeError.value = 'Use 4 to 12 letters or numbers (a hyphen is fine), or leave it blank and we’ll make one.'
    else if (isSampleCode(c)) codeError.value = `${CREW.code} belongs to the sample crew. Pick another, or leave it blank.`
  }
  if (error.value || codeError.value) return
  startCrew(n, c || codeFor(n), blurb.value)
}

function join() {
  if (state.crewCustom && normalize(code.value) && normalize(code.value) === normalize(state.crewCode)) {
    error.value = ''; state.crew = 'joined'; return
  }
  if (!isSampleCode(code.value)) {
    error.value = code.value.trim()
      ? `We couldn’t find “${code.value.trim()}”. In this demo, try ${CREW.code}.`
      : `Enter a crew code. In this demo, try ${CREW.code}.`
    return
  }
  error.value = ''
  code.value = CREW.code
  seedSample('joined')
}

function onTabKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    setMode(mode.value === 'create' ? 'join' : 'create')
    document.getElementById(`tab-${mode.value}`)?.focus()
  }
}
</script>

<template>
  <Screen :photo="PHOTOS.van" kicker="Your crew" caption="The people who’ll be there when it opens." back="/demo/" :step="1">
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
          <input v-model="name" class="input" maxlength="40" autocomplete="off" placeholder="e.g. Saturday hikers" :aria-invalid="!!error" aria-describedby="crew-msg" data-testid="crew-name" />
        </label>
        <p id="crew-msg" class="field__msg" :class="{ 'is-error': error }" aria-live="polite">{{ error || 'Anything your friends will recognise.' }}</p>
        <label class="field">
          <span class="field__label">Crew code <span class="field__opt">(optional)</span></span>
          <input v-model="myCode" class="input input--code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="We’ll make one from the name" :aria-invalid="!!codeError" aria-describedby="code-msg" data-testid="crew-code" />
        </label>
        <p id="code-msg" class="field__msg" :class="{ 'is-error': codeError }" aria-live="polite">{{ codeError || 'Leave blank and we’ll make one, like ' + (normalize(name).slice(0, 4) || 'CREW') + '-K3P9.' }}</p>
        <label class="field">
          <span class="field__label">About <span class="field__opt">(optional)</span></span>
          <input v-model="blurb" class="input" maxlength="80" autocomplete="off" placeholder="What brings you together?" data-testid="crew-blurb" />
        </label>
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
            <p v-if="state.crewBlurb" class="muted" data-testid="crew-blurb-text">{{ state.crewBlurb }}</p>
          </div>
          <p class="code-pill" :aria-label="`Invite code ${state.crewCode}`" data-testid="crew-code-pill">{{ state.crewCode }}</p>
        </div>
        <ul class="members" aria-label="Crew members" data-testid="crew-members">
          <li v-for="m in members" :key="m.id" class="members__row">
            <AvatarLink :id="m.id" />
            <span class="members__name">{{ m.name }}</span>
            <span v-if="m.id === 'maya'" class="tag">{{ state.crew === 'created' ? 'You · Host' : 'You' }}</span>
            <span v-else class="members__status">{{ state.crew === 'created' ? 'Joined via invite' : 'Member' }}</span>
          </li>
        </ul>
        <p v-if="members.length === 1" class="muted small" data-testid="crew-solo">Just you so far. Invite your crew to get everyone in.</p>
      </div>
      <RouterLink v-if="done" to="/demo/stats" class="card firstcard" data-testid="crew-stats">
        <span class="firstcard__badge" aria-hidden="true"><Badge id="oracle" :size="40" /></span>
        <span class="firstcard__text">
          <span class="card__label">Crew stats</span>
          <span class="firstcard__q">Badges, streaks and memories</span>
        </span>
        <span class="tpl__go firstcard__go" aria-hidden="true">›</span>
      </RouterLink>
      <RouterLink v-if="done && firstLock.lockedAt" to="/demo/first" class="card firstcard" data-testid="crew-firstlock">
        <span class="seal__lock" aria-hidden="true"><LockGlyph :size="32" /></span>
        <span class="firstcard__text">
          <span class="card__label">Your first call · locked</span>
          <span class="firstcard__q">{{ FIRST_LOCK.question }}</span>
        </span>
        <span class="tpl__go firstcard__go" aria-hidden="true">›</span>
      </RouterLink>
    </section>

    <template v-if="done" #foot>
      <button type="button" class="btn btn--secondary btn--block" data-testid="invite-entry" @click="router.push('/demo/invite')">Invite your crew</button>
      <button type="button" class="btn btn--primary btn--block" @click="router.push('/demo/templates')">Choose what to lock</button>
    </template>
  </Screen>
</template>
