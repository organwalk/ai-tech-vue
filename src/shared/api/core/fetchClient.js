import { getToken } from '@/shared/api/utils/helpers.js'
import { API_BASE_URL } from '@/shared/api/core/config.js'

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item))
        }
      })
      return
    }

    searchParams.append(key, String(value))
  })

  return searchParams.toString()
}

const buildApiUrl = (path, params) => {
  const queryString = buildQueryString(params)
  return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`
}

const createHeaders = ({ headers = {}, includeJson = false, includeStream = false, includeAuth = true } = {}) => {
  const mergedHeaders = new Headers(headers)

  if (includeAuth) {
    const token = getToken()
    if (token && !mergedHeaders.has('Authorization')) {
      mergedHeaders.set('Authorization', `Bearer ${token}`)
    }
  }

  if (includeJson && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  if (includeStream && !mergedHeaders.has('Accept')) {
    mergedHeaders.set('Accept', 'text/event-stream')
  }

  return mergedHeaders
}

const normalizeBody = (body) => {
  if (body === undefined || body === null) {
    return undefined
  }

  if (typeof body === 'string' || body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams) {
    return body
  }

  return JSON.stringify(body)
}

export const fetchApiJson = async (path, options = {}) => {
  const {
    method = 'GET',
    params,
    body,
    headers,
    includeAuth = true
  } = options

  const response = await fetch(buildApiUrl(path, params), {
    method,
    headers: createHeaders({
      headers,
      includeJson: body !== undefined && body !== null,
      includeAuth
    }),
    body: normalizeBody(body)
  })

  return response.json()
}

export const fetchApiStream = (path, options = {}) => {
  const {
    method = 'POST',
    params,
    body,
    headers,
    includeAuth = true
  } = options

  return fetch(buildApiUrl(path, params), {
    method,
    headers: createHeaders({
      headers,
      includeJson: body !== undefined && body !== null,
      includeStream: true,
      includeAuth
    }),
    body: normalizeBody(body)
  })
}

export const uploadFileToUrl = (uploadUrl, file, contentType) => {
  const headers = contentType ? { 'Content-Type': contentType } : {}

  return fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: file
  })
}

export const downloadFileByUrl = (url, options = {}) => {
  const { includeAuth = true, headers } = options

  return fetch(url, {
    headers: createHeaders({
      headers,
      includeAuth,
      includeJson: false
    })
  })
}
