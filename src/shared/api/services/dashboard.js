import { api } from '@/shared/api/index.js'

export const getMemberList = (windowId) => {
  return api.get(`/dashboard/course/member/${windowId}`)
}

export const removeMember = (memberId) => {
  return api.delete(`/dashboard/course/member/${memberId}`)
}

export const getLearnerDetail = (params) => {
  return api.get('/dashboard/learner/detail', { params })
}

export const getLearnerAnalyze = (taskId) => {
  return api.get(`/dashboard/learner/analyze/${taskId}`)
}

export const deleteLearnerAnalyze = (taskId) => {
  return api.delete(`/dashboard/learner/analyze/${taskId}`)
}
