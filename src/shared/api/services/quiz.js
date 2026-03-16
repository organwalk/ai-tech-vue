import { api } from '@/shared/api/index.js'

export const generateQuiz = (data) => {
  return api.post('/quiz/generate', data)
}

export const getQuizDetail = (quizId) => {
  return api.get(`/quiz/${quizId}`)
}

export const submitQuiz = (data) => {
  return api.post('/quiz/submit', data)
}

export const getQuizAnalysis = (recordId) => {
  return api.get(`/quiz/analysis/${recordId}`)
}

export const deleteQuizAnalysis = (recordId) => {
  return api.delete(`/quiz/analysis/${recordId}`)
}

export const getQuizRecords = (params) => {
  return api.get('/quiz/record', { params })
}

export const deleteQuiz = (quizId) => {
  return api.delete(`/quiz/${quizId}`)
}
