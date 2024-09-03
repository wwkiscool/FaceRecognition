import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/index.vue')
    },
    {
      path: '/canvas',
      name: 'canvas',
      component: () => import('../views/canvas.vue')
    }
  ]
})

export default router
