export const HttpStatus = {
  SUCCESS: { code: 200, message: '操作成功' },
  BUSINESS_ERROR: { code: 400, message: '功能异常' },
  UNAUTHORIZED: { code: 401, message: '暂未登录或Token已经过期' },
  FORBIDDEN: { code: 403, message: '没有相关权限' },
  SYSTEM_ERROR: { code: 500, message: '系统内部错误' }
}

export const ResponseStatus = {
  SUCCESS: 'SUCCESS',
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
}
