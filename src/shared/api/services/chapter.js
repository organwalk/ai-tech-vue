import { api } from '@/shared/api/index.js'

export const getChapterList = (windowId) => {
  return api.get(`/course/chapter/list/${windowId}`)
}

export const createChapter = (data) => {
  return api.post('/course/chapter/create', data)
}

export const updateChapter = (data) => {
  return api.put('/course/chapter/update', data)
}

export const deleteChapter = (chapterId) => {
  return api.delete(`/course/chapter/delete/${chapterId}`)
}
