import { api } from '@/shared/api/index.js'
import { fetchApiStream } from '@/shared/api/core/fetchClient.js'

export const getChatHistory = (data) => {
  return api.post('/chat/history', data)
}

export const sendChatMessageStream = (data) => {
  return fetchApiStream('/chat/send', { body: data })
}

export const sendToolChatMessageStream = (data) => {
  return fetchApiStream('/chat/send/tool', { body: data })
}
