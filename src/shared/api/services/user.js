import { api } from '@/shared/api/index.js'

export const getUserInfo = () => {
  return api.get('/user/info')
}

export const updateUserInfo = (data) => {
  return api.put('/auth/info', data)
}
