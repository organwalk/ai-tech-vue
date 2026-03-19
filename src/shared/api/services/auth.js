import loginApi from '@/shared/api/core/loginInstance.js'
import { HttpStatus } from '@/shared/api/constants/httpCode.js'

export const sendCode = async (email) => {
  const response = await loginApi.post('/auth/send-code', { email })
  const responseData = response.data

  if (responseData?.code !== undefined && responseData.code !== HttpStatus.SUCCESS.code) {
    throw new Error(responseData.message || '发送验证码失败，请稍后重试')
  }

  return response
}

export const login = (email, code) => {
  return loginApi.post('/auth/login', { email, code })
}
