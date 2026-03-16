export * from '@/shared/api/services/auth.js'
export * from '@/shared/api/services/user.js'
export * from '@/shared/api/services/window.js'
export * from '@/shared/api/services/chapter.js'
export * from '@/shared/api/services/knowledge.js'
export * from '@/shared/api/services/task.js'
export * from '@/shared/api/services/quiz.js'
export * from '@/shared/api/services/guide.js'
export * from '@/shared/api/services/chat.js'
export * from '@/shared/api/services/diagnosis.js'
export * from '@/shared/api/services/dashboard.js'
export * from '@/shared/api/services/feedback.js'

export { default as api, createAxiosInstance } from '@/shared/api/core/instance.js'
export { HttpStatus, ResponseStatus } from '@/shared/api/constants/httpCode.js'
export {
  showMessage,
  showErrorMessage,
  clearAuthData,
  redirectToLogin,
  getToken,
  setToken,
  getUserInfo,
  setUserInfo
} from './utils/helpers'
