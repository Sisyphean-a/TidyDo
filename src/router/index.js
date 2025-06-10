import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/tidyDo/index.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
  ],
})

export default router
