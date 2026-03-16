import { api } from '@/shared/api/index.js'

export const getWindowList = (params = {}) => {
  const { pageNum = 1, pageSize = 20 } = params
  return api.get('/window/list', { params: { pageNum, pageSize } })
}

export const getWindowDetail = (windowId) => {
  return api.get(`/window/detail/${windowId}`)
}

export const createWindow = (data) => {
  return api.post('/window/create', data)
}

export const updateWindow = (data) => {
  return api.put('/window/update', data)
}

export const batchDeleteWindow = (ids) => {
  const stringIds = ids.map(id => String(id))
  return api.delete('/window/batch', {
    data: { ids: stringIds }
  })
}

export const deleteWindow = (id) => {
  return batchDeleteWindow([String(id)])
}

export const joinWindow = (inviteCode) => {
  return api.post('/window/join', { inviteCode })
}
