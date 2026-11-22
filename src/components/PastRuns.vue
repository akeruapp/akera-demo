<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AvatarLink from './AvatarLink.vue'
import Sparkle from './Sparkle.vue'
import { member } from '../data'
import type { BuiltinId } from '../data'
import { PAST_RUNS } from '../stats'
import { runTemplate } from '../store'

const props = defineProps<{ template: BuiltinId }>()
const router = useRouter()
const runs = computed(() => PAST_RUNS[props.template] ?? [])
const names = (ids: string[]) => {
  const f = ids.map((i) => (i === 'maya' ? 'Maya' : member(i as never).first))
  if (f.length === 5) return 'Everyone'
  return f.length === 1 ? f[0] : `${f.slice(0, -1).join(', ')} and ${f[f.length - 1]}`
}
function run() {
  runTemplate(props.template)
  router.push('/demo/lock')
}
</script>

<template>
  <section class="pastruns" aria-labelledby="past-h" data-testid="past-runs">
    <h2 id="past-h" class="card__label">Past runs</h2>
    <ol class="pastruns__list">
      <li v-for="r in runs" :key="r.when" class="pastruns__item">
        <span class="pastruns__faces">
          <AvatarLink v-for="id in r.who.slice(0, 3)" :key="id" :id="id" :size="28" />
          <span v-if="r.who.length > 3" class="pastruns__more" aria-hidden="true">+{{ r.who.length - 3 }}</span>
        </span>
        <span class="pastruns__text">
          <span class="pastruns__when">{{ r.when }}</span>
          <span class="pastruns__who"><Sparkle :size="10" /> {{ names(r.who) }} called it<template v-if="r.who.length === 5"> together</template></span>
          <span class="pastruns__note">{{ r.note }}</span>
        </span>
      </li>
    </ol>
    <button type="button" class="btn btn--secondary btn--block" data-testid="run-it" @click="run">Run it with your crew</button>
  </section>
</template>
