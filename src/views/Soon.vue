<script setup lang="ts">
import Screen from '../components/Screen.vue'
import Sparkle from '../components/Sparkle.vue'
import { PHOTOS } from '../data'

type Icon = 'phone' | 'history' | 'bell' | 'chat' | 'voice' | 'capsule' | 'live' | 'season' | 'cause' | 'book' | 'calendar' | 'lang'
const PLANNED: { icon: Icon; text: string }[] = [
  { icon: 'phone', text: 'Native iOS and Android apps' },
  { icon: 'history', text: 'A template results history: who called it across runs' },
  { icon: 'bell', text: 'Push reminders before an unlock' },
  { icon: 'chat', text: 'A group-chat share for opt-in reveal cards' },
]
const EXPLORING: { icon: Icon; text: string }[] = [
  { icon: 'voice', text: 'A photo or voice note lock, opened at the reunion' },
  { icon: 'capsule', text: 'A time capsule lock months out, like a graduation or a wedding anniversary' },
  { icon: 'live', text: 'Live event unlocks from partners, like a race finish or a final whistle' },
  { icon: 'season', text: 'A seasonal badge set' },
  { icon: 'cause', text: 'Cause crews: a fundraiser unlocks when the goal is hit' },
  { icon: 'book', text: 'A crew yearbook: a year of reveals in one recap' },
  { icon: 'calendar', text: 'Calendar-linked unlocks' },
  { icon: 'lang', text: 'Multi-language crews: Spanish, French, Portuguese' },
]
const MAILTO = `mailto:?subject=${encodeURIComponent('Akeru idea')}&body=${encodeURIComponent('Here’s what I’d want in Akeru:\n\n')}`
</script>

<template>
  <Screen :photo="PHOTOS.key" kicker="Coming soon" caption="Shaped by crew feedback." back="/demo/">
    <p class="kicker">Akeru · What’s next</p>
    <h1 class="title">Coming soon</h1>
    <p class="lede">What’s next is shaped by crew feedback. Nothing here has a date yet.</p>

    <section v-for="g in [{ k: 'Planned', items: PLANNED }, { k: 'Exploring', items: EXPLORING }]" :key="g.k" class="stats-sec" :aria-labelledby="`soon-${g.k}`" :data-testid="`soon-${g.k.toLowerCase()}`">
      <h2 :id="`soon-${g.k}`" class="card__label">{{ g.k }}</h2>
      <ul class="soon">
        <li v-for="it in g.items" :key="it.text" class="soon__card">
          <span class="soon__icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#F4A35C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <template v-if="it.icon === 'phone'"><rect x="9" y="3" width="14" height="26" rx="3" /><path d="M14.5 17a2 2 0 1 1 3 0l.7 3.5h-4.4z" fill="#F4A35C" stroke="none" /></template>
              <template v-else-if="it.icon === 'history'"><path d="M5 16a11 11 0 1 0 3.2-7.8" /><path d="M5 5v4h4" /><path d="M16 10v6l4 2" /></template>
              <template v-else-if="it.icon === 'bell'"><path d="M8 22V14a8 8 0 0 1 16 0v8l2 3H6z" /><path d="M13 27a3 3 0 0 0 6 0" /></template>
              <template v-else-if="it.icon === 'chat'"><path d="M5 7h22v14H14l-6 5v-5H5z" /><path d="M15 15.5a1.6 1.6 0 1 1 2 0l.5 2.5h-3z" fill="#F4A35C" stroke="none" /></template>
              <template v-else-if="it.icon === 'voice'"><rect x="12" y="4" width="8" height="14" rx="4" /><path d="M7 15a9 9 0 0 0 18 0M16 24v4" /></template>
              <template v-else-if="it.icon === 'capsule'"><rect x="4" y="10" width="24" height="12" rx="6" transform="rotate(-25 16 16)" /><path d="M16 9.5l2.6 12" /></template>
              <template v-else-if="it.icon === 'live'"><circle cx="16" cy="16" r="3" fill="#F4A35C" /><path d="M10 10a8.5 8.5 0 0 0 0 12M22 10a8.5 8.5 0 0 1 0 12M6 6a14 14 0 0 0 0 20M26 6a14 14 0 0 1 0 20" /></template>
              <template v-else-if="it.icon === 'season'"><path d="M16 3l3.5 7.5L27 12l-5.5 5 1.5 8-7-4-7 4 1.5-8L5 12l7.5-1.5z" /></template>
              <template v-else-if="it.icon === 'cause'"><path d="M16 27s-10-6-10-13a5.5 5.5 0 0 1 10-3 5.5 5.5 0 0 1 10 3c0 7-10 13-10 13z" /><path d="M11 15h3l2-3 2 5 1.5-2H22" /></template>
              <template v-else-if="it.icon === 'book'"><path d="M6 5h9a3 3 0 0 1 3 3v19a3 3 0 0 0-3-3H6zM26 5h-5a3 3 0 0 0-3 3" /><path d="M26 5v19h-5" /></template>
              <template v-else-if="it.icon === 'calendar'"><rect x="5" y="7" width="22" height="20" rx="3" /><path d="M5 13h22M11 4v5M21 4v5" /><path d="M15 19.5a1.6 1.6 0 1 1 2 0l.5 2.5h-3z" fill="#F4A35C" stroke="none" /></template>
              <template v-else><circle cx="16" cy="16" r="12" /><path d="M4 16h24M16 4c4 4 4 20 0 24M16 4c-4 4-4 20 0 24" /></template>
            </svg>
          </span>
          <span class="soon__text">{{ it.text }}</span>
          <span class="soon__tag" :class="`soon__tag--${g.k.toLowerCase()}`">{{ g.k }}</span>
        </li>
      </ul>
    </section>

    <section class="card privacy" aria-labelledby="fb-h">
      <h2 id="fb-h" class="card__label"><Sparkle :size="12" /> Your crew decides</h2>
      <p>Tell us what your crew would use. The button opens your own email app with a blank draft; nothing is sent from here.</p>
    </section>

    <template #foot>
      <a :href="MAILTO" class="btn btn--primary btn--block" data-testid="feedback">Tell us what you’d want</a>
      <p class="foot__note">Opens your email app. Nothing is sent from this demo.</p>
    </template>
  </Screen>
</template>
