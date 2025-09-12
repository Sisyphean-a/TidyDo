import { get, set } from 'idb-keyval'
import { withErrorHandling, ErrorTypes } from '@/utils/errorHandler'

// 目录句柄存储的Key
const DIRECTORY_HANDLES_KEY = 'directory-handles'

/**
 * 目录句柄服务类
 * 管理 FileSystemDirectoryHandle 的存储和访问
 * 由于句柄不能序列化，需要特殊处理
 */
export class DirectoryHandleService {
  // 内存中的句柄缓存
  static #handleCache = new Map()

  /**
   * 显示目录选择器
   * @returns {Promise<{handle: FileSystemDirectoryHandle, path: string}>} 目录句柄和路径信息
   */
  static showDirectoryPicker = withErrorHandling(async () => {
    if (!window.showDirectoryPicker) {
      throw new Error('浏览器不支持目录选择功能，请使用 Chrome 86+ 或 Edge 86+')
    }

    try {
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite' // 需要读写权限
      })

      // 获取目录名称作为显示路径
      const displayPath = directoryHandle.name

      return {
        handle: directoryHandle,
        path: displayPath
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('用户取消了目录选择')
      }
      throw error
    }
  }, '选择备份目录', ErrorTypes.BUSINESS)

  /**
   * 存储目录句柄
   * @param {string} key - 存储键名
   * @param {FileSystemDirectoryHandle} directoryHandle - 目录句柄
   * @param {string} displayPath - 显示路径
   */
  static storeDirectoryHandle = withErrorHandling(async (key, directoryHandle, displayPath) => {
    // 将句柄存储到内存缓存
    this.#handleCache.set(key, {
      handle: directoryHandle,
      path: displayPath,
      timestamp: Date.now()
    })

    // 存储显示路径到持久化存储（句柄本身不能序列化）
    const handleInfo = {
      path: displayPath,
      timestamp: Date.now(),
      hasHandle: true
    }

    const existingHandles = await get(DIRECTORY_HANDLES_KEY) || {}
    existingHandles[key] = handleInfo
    await set(DIRECTORY_HANDLES_KEY, existingHandles)

    console.log(`✅ [DirectoryHandle] 目录句柄已存储: ${displayPath}`)
  }, '存储目录句柄', ErrorTypes.STORAGE)

  /**
   * 获取目录句柄
   * @param {string} key - 存储键名
   * @returns {Promise<{handle: FileSystemDirectoryHandle|null, path: string}>} 目录句柄和路径
   */
  static getDirectoryHandle = withErrorHandling(async (key) => {
    // 先从内存缓存获取
    const cached = this.#handleCache.get(key)
    if (cached && cached.handle) {
      try {
        // 验证句柄是否仍然有效
        await cached.handle.requestPermission({ mode: 'readwrite' })
        return {
          handle: cached.handle,
          path: cached.path
        }
      } catch (error) {
        console.warn('缓存的目录句柄已失效:', error)
        this.#handleCache.delete(key)
      }
    }

    // 从持久化存储获取信息
    const existingHandles = await get(DIRECTORY_HANDLES_KEY) || {}
    const handleInfo = existingHandles[key]

    if (handleInfo) {
      return {
        handle: null,
        path: handleInfo.path
      }
    }

    return {
      handle: null,
      path: ''
    }
  }, '获取目录句柄', ErrorTypes.STORAGE)

  /**
   * 清除目录句柄
   * @param {string} key - 存储键名
   */
  static clearDirectoryHandle = withErrorHandling(async (key) => {
    // 从内存缓存清除
    this.#handleCache.delete(key)

    // 从持久化存储清除
    const existingHandles = await get(DIRECTORY_HANDLES_KEY) || {}
    delete existingHandles[key]
    await set(DIRECTORY_HANDLES_KEY, existingHandles)

    console.log(`🗑️ [DirectoryHandle] 目录句柄已清除: ${key}`)
  }, '清除目录句柄', ErrorTypes.STORAGE)

  /**
   * 验证目录句柄权限
   * @param {FileSystemDirectoryHandle} directoryHandle - 目录句柄
   * @returns {Promise<boolean>} 是否有权限
   */
  static async verifyPermission(directoryHandle) {
    if (!directoryHandle) return false

    try {
      const permission = await directoryHandle.requestPermission({ mode: 'readwrite' })
      return permission === 'granted'
    } catch (error) {
      console.warn('验证目录权限失败:', error)
      return false
    }
  }

  /**
   * 检查是否支持现代文件系统API
   * @returns {boolean} 是否支持
   */
  static isSupported() {
    return 'showDirectoryPicker' in window && 'showSaveFilePicker' in window
  }

  /**
   * 获取支持状态信息
   * @returns {Object} 支持状态详情
   */
  static getSupportInfo() {
    const hasShowDirectoryPicker = 'showDirectoryPicker' in window
    const hasShowSaveFilePicker = 'showSaveFilePicker' in window
    const isSupported = hasShowDirectoryPicker && hasShowSaveFilePicker

    return {
      isSupported,
      hasShowDirectoryPicker,
      hasShowSaveFilePicker,
      userAgent: navigator.userAgent,
      isChrome: navigator.userAgent.includes('Chrome'),
      isEdge: navigator.userAgent.includes('Edge')
    }
  }
}
