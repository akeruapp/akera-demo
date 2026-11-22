import { createRouter, createWebHistory } from 'vue-router'
import { state } from './store'
import Landing from './views/Landing.vue'
import Welcome from './views/Welcome.vue'
import Crew from './views/Crew.vue'
import Templates from './views/Templates.vue'
import Lock from './views/Lock.vue'
import Locked from './views/Locked.vue'
import Reveal from './views/Reveal.vue'
import RevealCard from './views/RevealCard.vue'
import Shared from './views/Shared.vue'
import PartnerRun from './views/PartnerRun.vue'
import Partners from './views/Partners.vue'

type Need = 'crew' | 'template' | 'locked' | 'revealed'

declare module 'vue-router' {
  interface RouteMeta { needs?: Need; title: string }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: Landing, meta: { title: 'Akeru · akeru.app · coming soon' } },
    { path: '/demo', name: 'welcome', component: Welcome, meta: { title: 'Akeru · Lock it. Live it. Relive it.' } },
    { path: '/demo/crew', name: 'crew', component: Crew, meta: { title: 'Your crew · Akeru' } },
    { path: '/demo/templates', name: 'templates', component: Templates, meta: { needs: 'crew', title: 'Pick a template · Akeru' } },
    { path: '/demo/lock', name: 'lock', component: Lock, meta: { needs: 'template', title: 'Lock your call · Akeru' } },
    { path: '/demo/locked', name: 'locked', component: Locked, meta: { needs: 'locked', title: 'Locked · Akeru' } },
    { path: '/demo/aketa', name: 'aketa', component: Reveal, meta: { needs: 'locked', title: 'Aketa! · Akeru' } },
    { path: '/demo/reveal', name: 'reveal', component: RevealCard, meta: { needs: 'revealed', title: 'The reveal · Akeru' } },
    { path: '/demo/r/:slug', name: 'shared', component: Shared, meta: { title: 'Aketa! Dinner’s on Jake · aketa.app' } },
    { path: '/demo/partner/run', name: 'partner-run', component: PartnerRun, meta: { title: 'Sam Bennett · Riverside 10K · Fieldstone Timing (partner example)' } },
    { path: '/demo/partners', name: 'partners', component: Partners, meta: { title: 'Akeru for partners · Akeru' } },
    { path: '/demo/:rest(.*)*', redirect: '/demo' },
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

export const isDemoPath = (path: string) => path === '/demo' || path.startsWith('/demo/')

router.afterEach((to) => {
  document.title = to.meta.title
  // The demo is not for search engines; the coming-soon landing can be indexed.
  let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (isDemoPath(to.path)) {
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = 'noindex'
  } else if (robots) {
    robots.remove()
  }
})
