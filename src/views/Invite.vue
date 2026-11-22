<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Screen from '../components/Screen.vue'
import AvatarLink from '../components/AvatarLink.vue'
import QrCode from '../components/QrCode.vue'
import { MEMBERS, PHOTOS } from '../data'
import { prefersReducedMotion, state } from '../store'
import { copyText, inviteDisplay, inviteMessage, inviteUrl, smsHref, whatsappHref } from '../invite'

const router = useRouter()
const url = inviteUrl()
const display = inviteDisplay()
const code = state.crewCode
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
const toast = ref('')
let toastTimer = 0

function flash(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 2400)
}
async function copyLink() { flash((await copyText(url)) ? 'Link copied' : 'Couldn’t copy. Press and hold the link to copy it.') }
async function copyCode() { flash((await copyText(code)) ? `Code ${code} copied` : 'Couldn’t copy the code.') }
async function share() {
  try { await navigator.share({ title: `Join ${state.crewName} on Akeru`, text: inviteMessage(url).replace(` ${url}`, ''), url }) } catch { /* dismissed */ }
}

// "Who's in": Maya is in from the start; the rest join one by one (all at once with reduced motion).
// A crew you just started had only you; opening the invite step is where the demo simulates friends joining.
state.invited = true
const others = MEMBERS.filter((m) => m.id !== 'maya')
const joined = ref(prefersReducedMotion() ? others.length : 0)
const timers: number[] = []
onMounted(() => {
  if (joined.value === others.length) return
  others.forEach((_, i) => timers.push(window.setTimeout(() => (joined.value = i + 1), 700 + i * 650)))
})
onBeforeUnmount(() => { timers.forEach(clearTimeout); clearTimeout(toastTimer) })
const inCount = computed(() => joined.value + 1)
const isIn = (i: number) => i < joined.value
</script>

<template>
  <Screen :photo="PHOTOS.van" kicker="Invite" caption="Get everyone in before you lock." back="/demo/crew">
    <p class="kicker">{{ state.crewName }}</p>
    <h1 class="title">Invite your crew</h1>
    <p class="lede">Send the link. Friends tap it and they’re in, no sign-up.</p>

    <section class="card invite" aria-labelledby="inv-h">
      <h2 id="inv-h" class="card__label">Your invite link</h2>
      <div class="invite__qrwrap">
        <QrCode :value="url" :size="184" :label="`QR code to join ${state.crewName}`" data-testid="qr" />
        <p class="muted small invite__scan">Scan with a phone camera to join.</p>
      </div>
      <div class="invite__link">
        <span class="invite__url mono" data-testid="invite-link">{{ display }}</span>
        <button type="button" class="btn btn--primary invite__copy" data-testid="copy-link" @click="copyLink">Copy link</button>
      </div>
      <div class="invite__code">
        <span class="muted small">Or share the code</span>
        <button type="button" class="code-pill code-pill--btn" data-testid="copy-code" :aria-label="`Copy crew code ${code}`" data-crew-code @click="copyCode">
          {{ code }} <svg class="code-pill__icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M11 3.5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        </button>
      </div>
      <p class="invite__toast" role="status" aria-live="polite" data-testid="toast">{{ toast }}</p>

      <div class="invite__share" role="group" aria-label="Share the invite">
        <button v-if="canShare" type="button" class="btn btn--secondary sharebtn" data-testid="native-share" @click="share">
          <span aria-hidden="true">↗</span> Share…
        </button>
        <a class="btn btn--secondary sharebtn" :href="smsHref(url)" data-testid="share-sms">
          <span aria-hidden="true">💬</span> Text
        </a>
        <a class="btn btn--secondary sharebtn" :href="whatsappHref(url)" target="_blank" rel="noopener noreferrer" data-testid="share-whatsapp">
          <span aria-hidden="true">🟢</span> WhatsApp<span class="visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
      <p class="muted small">Demo: nothing is sent until you choose an app and send it yourself.</p>
    </section>

    <section class="card whosin" aria-labelledby="who-h">
      <div class="whosin__head">
        <h2 id="who-h" class="card__label">Who’s in</h2>
        <p class="whosin__count" aria-live="polite" data-testid="who-count">{{ inCount }} of {{ MEMBERS.length }} in</p>
      </div>
      <ul class="members" data-testid="whos-in">
        <li class="members__row">
          <AvatarLink id="maya" />
          <span class="members__name">Maya Thompson</span>
          <span class="tag">You · Host</span>
        </li>
        <li v-for="(m, i) in others" :key="m.id" class="members__row whosin__row" :class="{ 'is-in': isIn(i) }">
          <AvatarLink :id="m.id" />
          <span class="members__name">{{ m.name }}</span>
          <span class="members__status whosin__status">{{ isIn(i) ? 'Joined' : 'Invite sent' }}</span>
        </li>
      </ul>
    </section>

    <template #foot>
      <button type="button" class="btn btn--primary btn--block" @click="router.push('/demo/templates')">Choose what to lock</button>
      <button type="button" class="btn btn--ghost btn--block" @click="router.push('/demo/crew')">Back to crew</button>
    </template>
  </Screen>
</template>
