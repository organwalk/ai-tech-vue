import { api } from '@/shared/api/index.js'

export const generateGuide = (data) => {
  return api.post('/guide/generate', data)
}

export const getGuideDetail = (guideId) => {
  return api.get(`/guide/${guideId}`)
}

export const deleteGuide = (guideId) => {
  return api.delete(`/guide/${guideId}`)
}
