import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/ai-tech/login',
      name: 'Login',
      component: () => import('@/features/auth/pages/LoginPage.vue'),
      meta: { requiresAuth: false, hideHeader: true }
    },
    {
      path: '/ai-tech',
      name: 'Home',
      component: () => import('@/features/home/pages/HomePage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ai-tech/self/window/:windowId',
      name: 'WindowWorkspace',
      component: () => import('@/features/self-study/pages/SelfStudyWorkspacePage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ai-tech/share/owner/window/:windowId/:inviteCode',
      name: 'OwnerWorkspace',
      component: () => import('@/features/course-owner/pages/OwnerWorkspacePage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ai-tech/share/member/window/:windowId/:inviteCode',
      name: 'MemberWorkspace',
      component: () => import('@/features/course-member/pages/MemberWorkspacePage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/ai-tech/login'
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  if (window.__isRouting) {
    window.__isRouting.value = true
  }
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const token = localStorage.getItem('token')
    if (!token) {
      next('/ai-tech/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

router.afterEach(() => {
  if (window.__isRouting) {
    setTimeout(() => {
      window.__isRouting.value = false
    }, 300)
  }
})

router.onError(() => {
  if (window.__isRouting) {
    window.__isRouting.value = false
  }
})

export default router