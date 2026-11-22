<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Screen from '../components/Screen.vue'
import Avatar from '../components/Avatar.vue'
import Badge from '../components/Badge.vue'
import { PHOTOS, TEMPLATES, member } from '../data'
import { BADGES, MEMORIES, PROFILES, badge, earnedFor, isMember, memoryHref, rate } from '../stats'

const route = useRoute()
const slug = computed(() => String(route.params.name ?? '').toLowerCase())
const ok = computed(() => isMember(slug.value))
const p = computed(() => (ok.value ? PROFILES[slug.value as keyof typeof PROFILES] : null))
const m = computed(() => (p.value ? member(p.value.id) : null))
const earned = computed(() => (p.value ? earnedFor(p.value.id) : []))
const recent = computed(() => (p.value ? p.value.recent.map((t) => ({ t, mem: MEMORIES.find((x) => x.template === t)!, name: TEMPLATES.find((x) => x.id === t)!.name })) : []))
</script>

<template>
  <Screen :photo="PHOTOS.couch" kicker="Crew profile" caption="Private to the crew." back="/demo/stats">
    <template v-if="p && m">
      <div class="prof__head">
        <Avatar :id="p.id" :size="80" />
        <div>
          <p class="kicker">{{ p.id === 'maya' ? 'You' : 'Gate C Crew' }}</p>
          <h1 class="title prof__name">{{ m.name }}</h1>
          <p class="prof__title" data-testid="title-badge"><Badge :id="p.titleBadge" :size="28" /> {{ p.title }}</p>
        </div>
      </div>

      <ul class="statrow statrow--4" aria-label="Stats">
        <li class="statcard"><span class="statcard__n">{{ p.calls }}</span><span class="statcard__l">calls made</span></li>
        <li class="statcard"><span class="statcard__n">{{ rate(p) }}%</span><span class="statcard__l">called it</span></li>
        <li class="statcard"><span class="statcard__n">{{ p.streak }}</span><span class="statcard__l">current streak</span></li>
        <li class="statcard"><span class="statcard__n">{{ p.best }}</span><span class="statcard__l">best streak</span></li>
      </ul>

      <section class="stats-sec" aria-labelledby="pb-h">
        <h2 id="pb-h" class="card__label">Badges · {{ earned.length }} of {{ BADGES.length }}</h2>
        <ul class="badgegrid badgegrid--sm">
          <li v-for="b in BADGES" :key="b.id" class="badgecell" :class="earned.includes(b.id) ? 'is-earned' : 'is-locked'">
            <Badge :id="b.id" :size="48" :locked="!earned.includes(b.id)" />
            <span class="badgecell__name">{{ badge(b.id).name }}</span>
            <span class="badgecell__state">{{ earned.includes(b.id) ? 'Earned' : 'Not yet' }}</span>
          </li>
        </ul>
      </section>

      <section class="stats-sec" aria-labelledby="pr-h">
        <h2 id="pr-h" class="card__label">Recent reveals</h2>
        <ul class="timeline timeline--compact">
          <li v-for="r in recent" :key="r.t" class="timeline__item">
            <span class="timeline__dot" aria-hidden="true" />
            <span class="timeline__when">{{ r.name }}</span>
            <RouterLink :to="memoryHref(r.t)" class="timeline__link" :data-testid="`prof-rev-${r.t}`">{{ r.mem.title }}</RouterLink>
          </li>
        </ul>
      </section>
    </template>

    <template v-else>
      <p class="kicker">Hmm</p>
      <h1 class="title" data-testid="prof-missing">No one by that name in the crew</h1>
      <p class="lede">We couldn’t find a profile for <span class="mono amber">{{ slug || 'that link' }}</span>. Pick someone from the crew instead.</p>
    </template>

    <template #foot>
      <RouterLink to="/demo/stats" class="btn btn--primary btn--block">Crew stats</RouterLink>
      <RouterLink to="/demo/crew" class="btn btn--ghost btn--block">Back to the crew</RouterLink>
    </template>
  </Screen>
</template>
