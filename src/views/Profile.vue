<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Screen from '../components/Screen.vue'
import Avatar from '../components/Avatar.vue'
import Badge from '../components/Badge.vue'
import { PHOTOS, TEMPLATES, findTemplate, member } from '../data'
import type { MemberId } from '../data'
import type { EarnedBadge } from '../stats'
import { crewMembers, state } from '../store'
import { BADGES, MEMORIES, PROFILES, badge, earnedFor, isMember, isNewCrew, memoryHref, newCrewCalls, newCrewEarned, rate } from '../stats'

const route = useRoute()
const slug = computed(() => String(route.params.name ?? '').toLowerCase())
// The sample Gate C Crew profiles are demo history. A crew you started shows only its real demo state:
// your own calls and badges from this session, zeros for everyone else, and only people actually in it.
const isNew = computed(() => isNewCrew())
const ok = computed(() => isMember(slug.value) && (!isNew.value || crewMembers().some((x) => x.id === slug.value)))
interface View { id: MemberId; title: string; titleBadge: EarnedBadge; calls: number; rate: string; streak: number; best: number }
const p = computed<View | null>(() => {
  if (!ok.value) return null
  const id = slug.value as MemberId
  if (!isNew.value) { const s = PROFILES[id]; return { id, title: s.title, titleBadge: s.titleBadge, calls: s.calls, rate: `${rate(s)}%`, streak: s.streak, best: s.best } }
  const calls = newCrewCalls(id)
  const started = id === 'maya' && state.crew === 'created'
  return { id, title: started ? `Started ${state.crewName}` : `New in ${state.crewName}`, titleBadge: started ? 'starter' : 'firstlock', calls, rate: calls ? '0%' : '–', streak: 0, best: 0 }
})
const m = computed(() => (p.value ? member(p.value.id) : null))
const earned = computed<EarnedBadge[]>(() => (p.value ? (isNew.value ? newCrewEarned(p.value.id) : earnedFor(p.value.id)) : []))
const recent = computed(() => (p.value && !isNew.value ? PROFILES[p.value.id].recent.map((t) => ({ t, mem: MEMORIES.find((x) => x.template === t)!, name: TEMPLATES.find((x) => x.id === t)!.name })) : []))
const current = computed(() => (isNew.value && state.revealSeen && state.templateId ? findTemplate(state.templateId)?.name ?? 'Your reveal' : null))
const crewLabel = computed(() => (state.crew ? state.crewName : 'Gate C Crew'))
</script>

<template>
  <Screen :photo="PHOTOS.couch" kicker="Crew profile" caption="Private to the crew." back="/demo/stats">
    <template v-if="p && m">
      <div class="prof__head">
        <Avatar :id="p.id" :size="80" />
        <div>
          <p class="kicker" data-testid="prof-crew">{{ p.id === 'maya' ? (isNew ? `You · ${crewLabel}` : 'You') : crewLabel }}</p>
          <h1 class="title prof__name">{{ m.name }}</h1>
          <p class="prof__title" data-testid="title-badge"><Badge :id="p.titleBadge" :size="28" :locked="isNew && !earned.includes(p.titleBadge)" /> {{ p.title }}</p>
        </div>
      </div>

      <ul class="statrow statrow--4" aria-label="Stats" data-testid="prof-stats">
        <li class="statcard"><span class="statcard__n" data-testid="prof-calls">{{ p.calls }}</span><span class="statcard__l">calls made</span></li>
        <li class="statcard"><span class="statcard__n" data-testid="prof-rate">{{ p.rate }}</span><span class="statcard__l">called it</span></li>
        <li class="statcard"><span class="statcard__n">{{ p.streak }}</span><span class="statcard__l">current streak</span></li>
        <li class="statcard"><span class="statcard__n">{{ p.best }}</span><span class="statcard__l">best streak</span></li>
      </ul>

      <section class="stats-sec" aria-labelledby="pb-h">
        <h2 id="pb-h" class="card__label" data-testid="prof-badges">Badges · {{ earned.length }} of {{ BADGES.length }}</h2>
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
        <p v-if="isNew && !current" class="muted" data-testid="prof-norev">No reveals yet in {{ crewLabel }}.</p>
        <ul v-else-if="isNew" class="timeline timeline--compact">
          <li class="timeline__item">
            <span class="timeline__dot" aria-hidden="true" />
            <span class="timeline__when">Today</span>
            <RouterLink to="/demo/reveal" class="timeline__link" data-testid="prof-rev-current">{{ current }}</RouterLink>
          </li>
        </ul>
        <ul v-else class="timeline timeline--compact">
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
      <h1 class="title" data-testid="prof-missing">No one by that name in {{ isNew ? crewLabel : 'the crew' }}</h1>
      <p class="lede">We couldn’t find a profile for <span class="mono amber">{{ slug || 'that link' }}</span>. Pick someone from the crew instead.</p>
    </template>

    <template #foot>
      <RouterLink to="/demo/stats" class="btn btn--primary btn--block">Crew stats</RouterLink>
      <RouterLink :to="state.crew ? '/demo/crew' : '/demo/'" class="btn btn--ghost btn--block" data-testid="prof-back">{{ state.crew ? `Back to ${state.crewName}` : 'Back to the demo' }}</RouterLink>
    </template>
  </Screen>
</template>
