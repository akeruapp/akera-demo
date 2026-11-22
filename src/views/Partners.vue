<script setup lang="ts">
import Screen from '../components/Screen.vue'
import Sparkle from '../components/Sparkle.vue'
import { PHOTOS } from '../data'

const verticals = [
  { k: 'Sports data', signal: 'Final whistle: yes / no', ex: 'Match prediction' },
  { k: 'Flight status', signal: 'Landed: yes / no', ex: 'First to land buys dinner' },
  { k: 'Race timing', signal: 'Finished: yes / no', ex: 'Charity run finish time' },
  { k: 'Maps & arrival', signal: 'Arrived: yes / no', ex: 'Road trip first stop' },
  { k: 'Venue check-in', signal: 'All seated: yes / no', ex: 'Sealed table note, reunion capsule' },
]
</script>

<template>
  <Screen :photo="PHOTOS.run" kicker="For partners" caption="Your moment opens their story." back="/demo/">
    <p class="kicker">Partners · illustrative</p>
    <h1 class="title">Akeru inside your app</h1>
    <p class="lede">A partner adds one Akeru button where the moment happens, then sends a single yes/no signal when it’s over. Crews do the rest.</p>

    <ol class="steps3">
      <li><span class="steps3__n">01</span><div><strong>Add the button</strong><p>“Lock a dare with your crew” sits on a results, flight or match screen.</p></div></li>
      <li><span class="steps3__n">02</span><div><strong>Send yes / no</strong><p>When the moment is real (finished, landed, arrived) the partner says so. Nothing else.</p></div></li>
      <li><span class="steps3__n">03</span><div><strong>Aketa!</strong><p>Every call opens at once. Crews share the cards they opt in to.</p></div></li>
    </ol>

    <section class="stack" aria-labelledby="pv-h">
      <h2 id="pv-h" class="card__label">Signals by partner type</h2>
      <ul class="pverts">
        <li v-for="v in verticals" :key="v.k" class="pverts__row">
          <span class="pverts__k">{{ v.k }}</span>
          <span class="pverts__sig">{{ v.signal }}</span>
          <span class="pverts__ex">{{ v.ex }}</span>
        </li>
      </ul>
    </section>

    <section class="card privacy" aria-labelledby="pp-h">
      <h2 id="pp-h" class="card__label"><Sparkle :size="12" /> Private by design</h2>
      <p>Partners never see anyone’s calls, notes or roasts. Akeru never needs the partner’s raw data, only the yes/no.</p>
    </section>

    <template #foot>
      <RouterLink to="/demo/partner/run" class="btn btn--primary btn--block">See it from a partner app</RouterLink>
      <p class="foot__note">Partner types and labels are illustrative for this demo.</p>
    </template>
  </Screen>
</template>
