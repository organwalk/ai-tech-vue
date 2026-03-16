import { api } from '@/shared/api/index.js'

export const submitFeedback = (data) => {
  return api.post('/feedback/submit', data)
}

export const getFeedbackList = (params) => {
  return api.get('/feedback/list', { params })
}
