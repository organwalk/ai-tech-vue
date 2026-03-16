import axios from 'axios'
import { HttpStatus } from '@/shared/api/constants/httpCode.js'
import { showErrorMessage, clearAuthData, redirectToLogin, getToken } from '@/shared/api/utils/helpers.js'
import { API_BASE_URL } from '@/shared/api/core/config.js'

const createAxiosInstance = (options = {}) => {
  const api = axios.create({
    baseURL: options.baseURL || API_BASE_URL,
    timeout: options.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const whiteList = options.whiteList || ['/login', '/captcha', '/register']

  api.interceptors.request.use(
    config => {
      const isWhiteListed = whiteList.some(path => config.url.includes(path))

      if (!isWhiteListed) {
        const token = getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )

  api.interceptors.response.use(
    response => {
      const res = response.data

      if (res.code === HttpStatus.SUCCESS.code) {
        return res
      }

      if (res.code === HttpStatus.BUSINESS_ERROR.code) {
        showErrorMessage(res)
        return Promise.reject(new Error(res.message || '业务异常'))
      }

      if (res.code === HttpStatus.UNAUTHORIZED.code) {
        showErrorMessage(res)
        clearAuthData()
        redirectToLogin()
        return Promise.reject(new Error(res.message || '未授权'))
      }

      if (res.code === HttpStatus.FORBIDDEN.code) {
        showErrorMessage(res)
        return Promise.reject(new Error(res.message || '无权限'))
      }

      if (res.code === HttpStatus.SYSTEM_ERROR.code) {
        showErrorMessage(res)
        return Promise.reject(new Error(res.message || '系统错误'))
      }

      return res
    },
    error => {
      if (error.response) {
        const { status, data } = error.response

        if (status === HttpStatus.UNAUTHORIZED.code) {
          showErrorMessage({ code: 401, message: '暂未登录或Token已经过期' })
          clearAuthData()
          redirectToLogin()
        } else if (status === HttpStatus.FORBIDDEN.code) {
          showErrorMessage({ code: 403, message: '没有相关权限' })
        } else if (status === HttpStatus.SYSTEM_ERROR.code) {
          showErrorMessage({ code: 500, message: '系统内部错误' })
        } else {
          showErrorMessage(data || { message: '网络请求失败' })
        }
      } else if (error.request) {
        showErrorMessage({ message: '网络连接失败，请检查网络' })
      } else {
        showErrorMessage({ message: error.message || '请求配置错误' })
      }

      return Promise.reject(error)
    }
  )

  return api
}

const api = createAxiosInstance()

export { createAxiosInstance }
export default api
