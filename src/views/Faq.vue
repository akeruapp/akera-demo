<script setup lang="ts">
import { ref } from 'vue'
import Screen from '../components/Screen.vue'
import { PHOTOS } from '../data'

const FAQS: { q: string; a: string; lang?: boolean }[] = [
  { q: 'What is Akeru?', a: 'Akeru is how friend groups lock predictions, dares or notes that stay sealed until something real happens. Then you open them together.' },
  { q: 'What’s a lock?', a: 'A call, dare or note your crew seals until its unlock condition is met. Until then, nobody can peek.' },
  { q: 'What can unlock it?', a: 'A time, an event result, a partner signal, or everyone choosing to open it.' },
  { q: 'Who sees my locks?', a: 'Only your crew.' },
  { q: 'Can a reveal be shared?', a: 'Only if you opt in. A roast leaves the crew only if the person being roasted taps “I’m laughing too”.' },
  { q: 'Is there any money involved?', a: 'No. Akeru never handles money. A crew might joke that the loser buys dinner, but that’s just part of the fun.' },
  { q: 'What are templates, and can I make my own?', a: 'Templates are starting points for a lock. And yes, you can create your own in the demo.' },
  { q: 'How do I invite friends?', a: 'Share a link, a QR code or your crew code. Friends join with one tap, no sign-up.' },
  { q: 'What do partners see?', a: 'Partners only send a yes or no signal, like “the match ended”. No personal data.' },
  { q: 'What does Akeru mean?', a: '', lang: true },
  { q: 'Is there an app?', a: 'Native iOS and Android apps are on the way. This is a clickable demo.' },
]

const open = ref<Set<number>>(new Set())
function toggle(i: number) {
  const s = new Set(open.value)
  if (s.has(i)) s.delete(i)
  else s.add(i)
  open.value = s
}
function onKey(e: KeyboardEvent, i: number) {
  const btns = [...document.querySelectorAll<HTMLButtonElement>('.faq__btn')]
  let j = -1
  if (e.key === 'ArrowDown') j = (i + 1) % btns.length
  else if (e.key === 'ArrowUp') j = (i - 1 + btns.length) % btns.length
  else if (e.key === 'Home') j = 0
  else if (e.key === 'End') j = btns.length - 1
  if (j < 0) return
  e.preventDefault()
  btns[j].focus()
}
</script>

<template>
  <Screen :photo="PHOTOS.key" kicker="FAQ" caption="Questions, answered." back="/demo/">
    <p class="kicker">Akeru · FAQ</p>
    <h1 class="title">Questions, answered</h1>
    <p class="lede">The short version of how Akeru works.</p>

    <div class="faq" data-testid="faq">
      <div v-for="(f, i) in FAQS" :key="f.q" class="faq__item" :class="{ 'is-open': open.has(i) }">
        <h2 class="faq__h">
          <button :id="`faq-q-${i}`" type="button" class="faq__btn" :aria-expanded="open.has(i)" :aria-controls="`faq-a-${i}`"
            @click="toggle(i)" @keydown="onKey($event, i)">
            <span class="faq__q">{{ f.q }}</span>
            <span class="faq__icon" aria-hidden="true" />
          </button>
        </h2>
        <div :id="`faq-a-${i}`" class="faq__panel" role="region" :aria-labelledby="`faq-q-${i}`" :aria-hidden="!open.has(i)">
          <div class="faq__inner">
            <p v-if="f.lang" class="faq__a">
              <span lang="ja">開ける</span> means “to open”. The reveal is Aketa, <span lang="ja">開けた</span>, “opened”.
            </p>
            <p v-else class="faq__a">{{ f.a }}</p>
          </div>
        </div>
      </div>
    </div>

    <template #foot>
      <RouterLink to="/demo/" class="btn btn--primary btn--block">Back to the demo</RouterLink>
    </template>
  </Screen>
</template>
