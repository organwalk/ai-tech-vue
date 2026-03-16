import { api } from '@/shared/api/index.js'

export const startDiagnosis = (windowId) => {
  return api.get(`/self-study/diagnose/${windowId}`)
}

export const getDiagnosisStatus = (windowId) => {
  return api.get(`/self-study/diagnosis/status/${windowId}`)
}

export const getDiagnosisDetail = (diagnosisId) => {
  return api.get(`/self-study/diagnosis/${diagnosisId}`)
}

export const deleteDiagnosis = (diagnosisId) => {
  return api.delete(`/self-study/diagnosis/${diagnosisId}`)
}
