/**
 * 统一错误处理工具
 * 提供一致的错误处理和用户友好的错误信息
 */

/**
 * 错误类型枚举
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  STORAGE: 'STORAGE',
  VALIDATION: 'VALIDATION',
  BUSINESS: 'BUSINESS',
  UNKNOWN: 'UNKNOWN'
}

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, originalError = null) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.originalError = originalError
    this.timestamp = new Date().toISOString()
  }
}

/**
 * 错误信息映射
 */
const ERROR_MESSAGES = {
  [ErrorTypes.STORAGE]: '数据存储失败，请检查浏览器存储权限',
  [ErrorTypes.NETWORK]: '网络连接失败，请检查网络连接',
  [ErrorTypes.VALIDATION]: '数据验证失败，请检查输入内容',
  [ErrorTypes.BUSINESS]: '操作失败，请稍后重试',
  [ErrorTypes.UNKNOWN]: '未知错误，请联系技术支持'
}

/**
 * 获取用户友好的错误信息
 * @param {Error|AppError} error - 错误对象
 * @returns {string} 用户友好的错误信息
 */
export const getUserFriendlyMessage = (error) => {
  if (error instanceof AppError) {
    return error.message || ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ErrorTypes.UNKNOWN]
  }
  
  // 处理常见的浏览器错误
  if (error.name === 'QuotaExceededError') {
    return '存储空间不足，请清理浏览器数据后重试'
  }
  
  if (error.name === 'NetworkError') {
    return ERROR_MESSAGES[ErrorTypes.NETWORK]
  }
  
  return error.message || ERROR_MESSAGES[ErrorTypes.UNKNOWN]
}

/**
 * 包装异步函数，提供统一的错误处理
 * @param {Function} fn - 要包装的异步函数
 * @param {string} operation - 操作描述
 * @param {string} errorType - 错误类型
 * @returns {Function} 包装后的函数
 */
export const withErrorHandling = (fn, operation, errorType = ErrorTypes.UNKNOWN) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error(`❌ [${operation}] 操作失败:`, error)
      
      // 包装为统一的错误格式
      const appError = new AppError(
        `${operation}失败: ${getUserFriendlyMessage(error)}`,
        errorType,
        error
      )
      
      throw appError
    }
  }
}

/**
 * 记录错误日志
 * @param {Error|AppError} error - 错误对象
 * @param {string} context - 错误上下文
 */
export const logError = (error, context = '') => {
  const errorInfo = {
    message: error.message,
    type: error.type || 'Unknown',
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack
  }
  
  console.error('🚨 [ErrorHandler]', errorInfo)
  
  // 在生产环境中，这里可以发送错误到监控服务
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorMonitoring(errorInfo)
  // }
}
