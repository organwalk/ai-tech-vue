import { api } from '@/shared/api/index.js'
import { downloadFileByUrl, uploadFileToUrl } from '@/shared/api/core/fetchClient.js'

export const getFileList = (params) => {
  return api.get('/knowledge/list', { params })
}

export const getPresignUploadUrl = (params) => {
  return api.get('/knowledge/presign-upload', { params })
}

export const confirmFileParse = (fileId) => {
  return api.post('/knowledge/confirm', null, {
    params: { fileId }
  })
}

export const deleteFile = (fileId) => {
  return api.delete(`/knowledge/${fileId}`)
}

export const uploadFileToStorage = (uploadUrl, file, contentType) => {
  return uploadFileToUrl(uploadUrl, file, contentType)
}

export const fetchDownloadFile = (url) => {
  return downloadFileByUrl(url)
}
