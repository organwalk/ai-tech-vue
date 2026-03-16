import { ElMessage } from 'element-plus'
import { HttpStatus } from '@/shared/api/constants/httpCode.js'

export const showMessage = (message, type = 'error') => {
  ElMessage({
    message,
    type
  })
}

export const showErrorMessage = (response) => {
  const { code, message } = response || {}
  if (code === HttpStatus.BUSINESS_ERROR.code) {
    showMessage(message || HttpStatus.BUSINESS_ERROR.message, 'warning')
  } else if (code === HttpStatus.UNAUTHORIZED.code) {
    showMessage(message || HttpStatus.UNAUTHORIZED.message, 'error')
  } else if (code === HttpStatus.FORBIDDEN.code) {
    showMessage(message || HttpStatus.FORBIDDEN.message, 'warning')
  } else if (code === HttpStatus.SYSTEM_ERROR.code) {
    showMessage(message || HttpStatus.SYSTEM_ERROR.message, 'error')
  } else {
    showMessage(message || '请求失败', 'error')
  }
}

export const clearAuthData = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
}

export const redirectToLogin = (fullPath = window.location.pathname) => {
  clearAuthData()
  window.location.href = `/ai-tech/login?redirect=${encodeURIComponent(fullPath)}`
}

export const getToken = () => {
  return localStorage.getItem('token')
}

export const setToken = (token) => {
  localStorage.setItem('token', token)
}

export const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

export const setUserInfo = (userInfo) => {
  localStorage.setItem('userInfo', JSON.stringify(userInfo))
}
