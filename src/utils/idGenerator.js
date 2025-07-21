/**
 * ID生成工具
 * 提供统一的ID生成策略
 */

/**
 * 生成唯一ID
 * 使用时间戳和随机字符串组合，确保唯一性
 * @returns {string} 生成的唯一ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/**
 * 生成带前缀的ID
 * @param {string} prefix - ID前缀
 * @returns {string} 带前缀的唯一ID
 */
export const generateIdWithPrefix = (prefix) => {
  return `${prefix}_${generateId()}`
}

/**
 * 验证ID格式
 * @param {string} id - 要验证的ID
 * @returns {boolean} ID是否有效
 */
export const isValidId = (id) => {
  return typeof id === 'string' && id.length > 0
}
