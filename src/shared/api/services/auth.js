import { api } from '@/shared/api/index.js'
import loginApi from '@/shared/api/core/loginInstance.js'

export const sendCode = (email) => {
  return api.post('/auth/send-code', { email })
}

export const login = (email, code) => {
  return loginApi.post('/auth/login', { email, code })
}
