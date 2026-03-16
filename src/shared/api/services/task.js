import { api } from '@/shared/api/index.js'

export const getActiveTasks = (params) => {
  return api.get('/tasks/active', { params })
}

export const getAllActiveTasks = (windowId) => {
  return api.get(`/tasks/active/all/${windowId}`)
}

export const updateTaskTitle = (taskId, title) => {
  return api.put(`/tasks/${taskId}/title`, { title })
}
