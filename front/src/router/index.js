import { createRouter, createWebHistory } from 'vue-router'
import SettingView from '@/views/SettingView.vue'
import CommentView from '@/views/CommentView.vue'
import AuthView from "@/views/AuthView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'setting',
      component: SettingView,
      meta: {requiresAuth: true},
    },
    {
      path: '/comments',
      name: 'comment',
      component: CommentView,
      meta: {requiresAuth: true},
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: {guestOnly: true},
    },
  ],
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = Boolean(localStorage.getItem('token'))

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'auth' })
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return next({ name: 'setting' })
  }

  return next()
})


export default router
