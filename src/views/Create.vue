<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Screen from '../components/Screen.vue'
import Avatar from '../components/Avatar.vue'
import Sparkle from '../components/Sparkle.vue'
import { MEMBERS, PHOTOS } from '../data'
import { pickTemplate, state } from '../store'
import {
  ANSWER_TYPES, EMOJIS, FUN_KINDS, PARTNER_KINDS, UNLOCK_TYPES,
  conditionFor, custom, looksLikeMoney, newDraft, saveSpec,
} from '../custom'

const router = useRouter()
if (!custom.draft) custom.draft = newDraft()
const d = custom.draft!
const step = computed(() => d.step)
const errors = ref<Record<string, string>>({})
const STEP_TITLES = ['', 'Ask your question', 'How does everyone answer?', 'When does it open?', 'Add a fun bit and a name', 'Preview your template']

const fun = computed(() => FUN_KINDS.find((f) => f.value === d.fun)!)
const answerLabel = computed(() => ANSWER_TYPES.find((a) => a.value === d.answer)?.label ?? '')
const condition = computed(() => (d.unlock ? conditionFor({ unlock: d.unlock, when: d.when, place: d.place, partner: d.partner }) : ''))

function validate(n: number): Record<string, string> {
  const e: Record<string, string> = {}
  if (n === 1) {
    const q = d.question.trim()
    if (!q) e.question = 'Write the question your crew will answer.'
    else if (q.length < 8) e.question = 'Make it a full question, at least 8 characters.'
  }
  if (n === 2 && !d.answer) e.answer = 'Pick how everyone answers.'
  if (n === 3) {
    if (!d.unlock) e.unlock = 'Pick when it opens.'
    else if (d.unlock === 'datetime' && !(new Date(d.when).getTime() > Date.now())) e.when = 'Pick a date and time in the future.'
    else if (d.unlock === 'checkin' && !d.place.trim()) e.place = 'Add the place everyone checks in at.'
  }
  if (n === 4) {
    if (d.fun !== 'none') {
      if (!d.funText.trim()) e.funText = `Write the ${fun.value.label.replace(/^An? /, '').toLowerCase()}, or pick “Nothing extra”.`
      else if (d.fun !== 'roast' && looksLikeMoney(d.funText)) e.funText = 'Keep it playful: no cash amounts. Try tacos, a playlist or a dare.'
      else if (d.fun === 'roast' && looksLikeMoney(d.funText)) e.funText = 'Keep the roast about the moment, not money.'
    }
    if (!d.name.trim()) e.name = 'Give your template a name.'
    else if (d.name.trim().length > 40) e.name = 'Keep the name to 40 characters or fewer.'
  }
  return e
}

async function focusFirstError() {
  await nextTick()
  const el = document.querySelector<HTMLElement>('.create [aria-invalid="true"], .create .is-error-group input')
  el?.focus()
}
async function focusTitle() {
  await nextTick()
  document.querySelector<HTMLElement>('.create h1')?.focus()
}

function next() {
  errors.value = validate(d.step)
  if (Object.keys(errors.value).length) { focusFirstError(); return }
  d.step = Math.min(5, d.step + 1)
  focusTitle()
}
function back() {
  errors.value = {}
  if (d.step > 1) { d.step -= 1; focusTitle() } else router.push('/demo/templates')
}
function edit(n: number) { errors.value = {}; d.step = n; focusTitle() }

watch(() => [d.question, d.answer, d.unlock, d.when, d.place, d.fun, d.funText, d.name], () => {
  if (Object.keys(errors.value).length) errors.value = {}
})

function use() {
  for (const n of [1, 2, 3, 4]) {
    const e = validate(n)
    if (Object.keys(e).length) { errors.value = e; d.step = n; focusFirstError(); return }
  }
  const spec = saveSpec(d)
  custom.draft = null
  pickTemplate(spec.id)
  router.push('/demo/lock')
}
function startOver() { custom.draft = newDraft(); Object.assign(d, newDraft()); errors.value = {}; focusTitle() }
</script>

<template>
  <Screen :photo="PHOTOS.key" kicker="Create your own" caption="Your question, your moment" back="/demo/templates">
    <div class="create">
      <div class="create__progress" role="group" :aria-label="`Step ${Math.min(step, 4)} of 4`">
        <span v-for="n in 4" :key="n" class="create__dot" :class="{ 'is-on': n <= step }" aria-hidden="true" />
      </div>
      <p class="kicker">{{ step <= 4 ? `Create · Step ${step} of 4` : 'Create · Preview' }}</p>
      <h1 class="title" tabindex="-1" data-focus-start>{{ STEP_TITLES[step] }}</h1>

      <!-- 1. question -->
      <div v-if="step === 1" class="stack">
        <p class="lede">What should your crew call before it happens?</p>
        <label class="field">
          <span class="field__label">Question</span>
          <input v-model="d.question" class="input" type="text" maxlength="120" placeholder="Who cries first at the wedding?"
            :aria-invalid="!!errors.question" aria-describedby="q-msg" data-testid="q" />
        </label>
        <p id="q-msg" class="field__msg" :class="{ 'is-error': errors.question }" role="status" aria-live="polite">{{ errors.question || `${d.question.trim().length}/120` }}</p>
      </div>

      <!-- 2. answer type -->
      <fieldset v-else-if="step === 2" class="opts" :class="{ 'is-error-group': errors.answer }" aria-describedby="a-msg">
        <legend class="visually-hidden">Answer type</legend>
        <label v-for="a in ANSWER_TYPES" :key="a.value" class="opt" :class="{ 'is-on': d.answer === a.value }">
          <input v-model="d.answer" type="radio" name="answer" class="visually-hidden" :value="a.value" :aria-invalid="!!errors.answer" />
          <span class="opt__main">{{ a.label }}</span>
          <span class="opt__sub">{{ a.hint }}</span>
          <span class="tpl__check" aria-hidden="true"><Sparkle :size="16" color="var(--ink)" /></span>
        </label>
        <p id="a-msg" class="field__msg" :class="{ 'is-error': errors.answer }" role="status" aria-live="polite">{{ errors.answer }}</p>
      </fieldset>

      <!-- 3. unlock -->
      <div v-else-if="step === 3" class="stack">
        <fieldset class="opts" :class="{ 'is-error-group': errors.unlock }" aria-describedby="u-msg">
          <legend class="visually-hidden">Unlock condition</legend>
          <label v-for="u in UNLOCK_TYPES" :key="u.value" class="opt" :class="{ 'is-on': d.unlock === u.value }">
            <input v-model="d.unlock" type="radio" name="unlock" class="visually-hidden" :value="u.value" :aria-invalid="!!errors.unlock" />
            <span class="opt__main">{{ u.label }}</span>
            <span class="opt__sub">{{ u.hint }}</span>
            <span class="tpl__check" aria-hidden="true"><Sparkle :size="16" color="var(--ink)" /></span>
          </label>
        </fieldset>
        <p id="u-msg" class="field__msg" :class="{ 'is-error': errors.unlock }" role="status" aria-live="polite">{{ errors.unlock }}</p>

        <template v-if="d.unlock === 'datetime'">
          <label class="field">
            <span class="field__label">Opens on</span>
            <input v-model="d.when" class="input clockpick clockpick--sm" type="datetime-local" :aria-invalid="!!errors.when" aria-describedby="w-msg" />
          </label>
          <p id="w-msg" class="field__msg" :class="{ 'is-error': errors.when }" role="status" aria-live="polite">{{ errors.when }}</p>
        </template>
        <template v-else-if="d.unlock === 'checkin'">
          <label class="field">
            <span class="field__label">Place</span>
            <input v-model="d.place" class="input" type="text" maxlength="60" placeholder="Rosa’s Cantina" :aria-invalid="!!errors.place" aria-describedby="p-msg" data-testid="place" />
          </label>
          <p id="p-msg" class="field__msg" :class="{ 'is-error': errors.place }" role="status" aria-live="polite">{{ errors.place || 'Opens when all 5 of you check in there.' }}</p>
        </template>
        <fieldset v-else-if="d.unlock === 'partner'" class="chips">
          <legend class="field__label">Which signal?</legend>
          <label v-for="p in PARTNER_KINDS" :key="p.value" class="chip" :class="{ 'is-on': d.partner === p.value }">
            <input v-model="d.partner" type="radio" name="partner" class="visually-hidden" :value="p.value" />
            {{ p.label }}
          </label>
        </fieldset>
        <p v-if="d.unlock === 'partner'" class="muted small">Illustrative partner signals for this demo.</p>
      </div>

      <!-- 4. fun bit + name -->
      <div v-else-if="step === 4" class="stack">
        <fieldset class="chips">
          <legend class="field__label">Fun bit (optional)</legend>
          <label v-for="f in FUN_KINDS" :key="f.value" class="chip" :class="{ 'is-on': d.fun === f.value }">
            <input v-model="d.fun" type="radio" name="fun" class="visually-hidden" :value="f.value" />
            {{ f.label }}
          </label>
        </fieldset>
        <template v-if="d.fun !== 'none'">
          <fieldset v-if="d.fun === 'roast'" class="chips">
            <legend class="field__label">Who’s it about?</legend>
            <label v-for="m in MEMBERS.filter((x) => x.id !== 'maya')" :key="m.id" class="chip" :class="{ 'is-on': d.roastTarget === m.id }">
              <input v-model="d.roastTarget" type="radio" name="roast" class="visually-hidden" :value="m.id" />
              <Avatar :id="m.id" :size="32" /> {{ m.first }}
            </label>
          </fieldset>
          <label class="field">
            <span class="field__label">{{ fun.label.replace(/^An? /, '').replace(/^./, (c) => c.toUpperCase()) }}</span>
            <input v-model="d.funText" class="input" type="text" maxlength="100" :placeholder="fun.placeholder" :aria-invalid="!!errors.funText" aria-describedby="f-msg" data-testid="fun" />
          </label>
          <p id="f-msg" class="field__msg" :class="{ 'is-error': errors.funText }" role="status" aria-live="polite">{{ errors.funText || (d.fun === 'roast' ? `Only leaves the crew if ${MEMBERS.find((m) => m.id === d.roastTarget)!.first} is laughing too.` : 'Playful stakes only. No cash amounts.') }}</p>
        </template>

        <label class="field">
          <span class="field__label">Template name</span>
          <input v-model="d.name" class="input" type="text" maxlength="40" placeholder="Wedding tears" :aria-invalid="!!errors.name" aria-describedby="n-msg" data-testid="name" />
        </label>
        <p id="n-msg" class="field__msg" :class="{ 'is-error': errors.name }" role="status" aria-live="polite">{{ errors.name }}</p>

        <fieldset class="emojis">
          <legend class="field__label">Emoji</legend>
          <label v-for="e in EMOJIS" :key="e" class="emoji" :class="{ 'is-on': d.emoji === e }">
            <input v-model="d.emoji" type="radio" name="emoji" class="visually-hidden" :value="e" :aria-label="`Emoji ${e}`" />
            <span aria-hidden="true">{{ e }}</span>
          </label>
        </fieldset>
      </div>

      <!-- 5. preview -->
      <div v-else class="stack">
        <p class="lede">This is how it shows up for {{ state.crewName }}.</p>
        <article class="card preview" data-testid="preview">
          <div class="preview__head">
            <span class="preview__emoji" aria-hidden="true">{{ d.emoji }}</span>
            <div>
              <p class="preview__name">{{ d.name }}</p>
              <p class="preview__q">{{ d.question }}</p>
            </div>
          </div>
          <dl class="preview__rows">
            <div><dt>Answer</dt><dd>{{ answerLabel }}</dd><button type="button" class="linkbtn" :aria-label="'Edit answer type'" @click="edit(2)">Edit</button></div>
            <div><dt>Opens</dt><dd>{{ condition }}</dd><button type="button" class="linkbtn" aria-label="Edit unlock" @click="edit(3)">Edit</button></div>
            <div v-if="d.fun !== 'none'"><dt>{{ fun.label.replace(/^An? /, '').replace(/^./, (c) => c.toUpperCase()) }}</dt><dd>{{ d.funText }}</dd><button type="button" class="linkbtn" aria-label="Edit fun bit" @click="edit(4)">Edit</button></div>
          </dl>
          <button type="button" class="linkbtn" aria-label="Edit question" @click="edit(1)">Edit question</button>
        </article>
        <label class="switch" data-testid="publish">
          <input v-model="d.publish" type="checkbox" class="switch__input" role="switch" :aria-checked="d.publish" />
          <span class="switch__track" aria-hidden="true"><span class="switch__thumb" /></span>
          <span class="switch__label">
            <span class="switch__main">Publish for other crews</span>
            <span class="switch__sub">Shows in your template list for this demo session</span>
          </span>
        </label>
      </div>
    </div>

    <template #foot>
      <template v-if="step <= 4">
        <button type="button" class="btn btn--primary btn--block" @click="next">{{ step === 4 ? 'Preview' : 'Next' }}</button>
        <button type="button" class="btn btn--ghost btn--block" @click="back">{{ step === 1 ? 'Back to templates' : 'Back' }}</button>
      </template>
      <template v-else>
        <button type="button" class="btn btn--primary btn--block" @click="use">Use with {{ state.crewName }}</button>
        <button type="button" class="btn btn--ghost btn--block" @click="startOver">Start over</button>
      </template>
    </template>
  </Screen>
</template>
