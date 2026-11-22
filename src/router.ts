import { createRouter, createWebHistory } from 'vue-router'
import { state } from './store'
import Welcome from './views/Welcome.vue'
import Crew from './views/Crew.vue'
import Templates from './views/Templates.vue'
import Lock from './views/Lock.vue'
import Locked from './views/Locked.vue'
import Reveal from './views/Reveal.vue'
import RevealCard from './views/RevealCard.vue'
import Shared from './views/Shared.vue'

type Need = 'crew' | 'template' | 'locked' | 'revealed'

declare module 'vue-router' {
  interface RouteMeta { needs?: Need; title: string }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'welcome', component: Welcome, meta: { title: 'Akeru · Lock it. Live it. Relive it.' } },
    { path: '/crew', name: 'crew', component: Crew, meta: { title: 'Your crew · Akeru' } },
    { path: '/templates', name: 'templates', component: Templates, meta: { needs: 'crew', title: 'Pick a template · Akeru' } },
    { path: '/lock', name: 'lock', component: Lock, meta: { needs: 'template', title: 'Lock your call · Akeru' } },
    { path: '/locked', name: 'locked', component: Locked, meta: { needs: 'locked', title: 'Locked · Akeru' } },
    { path: '/aketa', name: 'aketa', component: Reveal, meta: { needs: 'locked', title: 'Aketa! · Akeru' } },
    { path: '/reveal', name: 'reveal', component: RevealCard, meta: { needs: 'revealed', title: 'The reveal · Akeru' } },
    { path: '/r/:slug', name: 'shared', component: Shared, meta: { title: 'Aketa! Dinner’s on Jake · aketa.app' } },
    { path: '/:rest(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const n = to.meta.needs
  if (!n) return true
  if (!state.crew) return { name: 'welcome' }
  if (n === 'crew') return true
  if (!state.templateId) return { name: 'templates' }
  if (n === 'template') return true
  if (!state.lockedAt) return { name: 'lock' }
  if (n === 'locked') return true
  if (!state.revealSeen) return { name: 'aketa' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title
})
