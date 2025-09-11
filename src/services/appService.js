import { ConfigService } from './configService'
import { initializeDefaultData } from './todoService'
import { AutoBackupService } from './autoBackupService'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useTodosStore } from '@/stores/useTodosStore'
import { useSimpleTodosStore } from '@/stores/useSimpleTodosStore'
import { useAppStore } from '@/stores/useAppStore'
import { globalConfig } from '@/composables/useConfig'
import { withErrorHandling, ErrorTypes } from '@/utils/errorHandler'

/**
 * 应用初始化服务
 * 统一管理整个应用的启动流程，确保初始化的正确时序
 */
export class AppService {
  static #isInitialized = false
  static #isInitializing = false

  /**
   * 初始化应用
   * @param {Object} options - 初始化选项
   * @param {boolean} options.force - 是否强制重新初始化
   * @returns {Promise<void>}
   */
  static initializeApp = withErrorHandling(async (options = {}) => {
    const { force = false } = options

    // 防止重复初始化
    if (this.#isInitialized && !force) {
      return
    }

    // 防止并发初始化
    if (this.#isInitializing) {
      return this.#waitForInitialization()
    }

    this.#isInitializing = true

    try {
      // 并行初始化基础服务
      await Promise.all([
        ConfigService.getConfig(), // 确保默认配置存在
        globalConfig.initializeConfig(), // 初始化全局配置
        initializeDefaultData() // 初始化默认数据
      ])

      // 初始化 stores 数据
      await this.initializeStores()

      this.#isInitialized = true
      console.log('✅ [AppService] 应用初始化完成')

      // 在应用完全初始化后，执行自主备份检查
      // 使用 setTimeout 确保在下一个事件循环中执行，避免阻塞初始化
      setTimeout(() => {
        this.performAutoBackupCheck()
      }, 1000) // 延迟1秒执行，确保UI渲染完成
    } finally {
      this.#isInitializing = false
    }
  }, '应用初始化', ErrorTypes.BUSINESS)

  /**
   * 等待初始化完成
   * @private
   */
  static #waitForInitialization() {
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (this.#isInitialized) {
          resolve()
        } else {
          setTimeout(checkInitialized, 50)
        }
      }
      checkInitialized()
    })
  }

  /**
   * 初始化 stores 数据
   * 确保正确的加载顺序和依赖关系
   */
  static initializeStores = withErrorHandling(async () => {
    const categoriesStore = useCategoriesStore()
    const todosStore = useTodosStore()
    const simpleTodosStore = useSimpleTodosStore()
    const appStore = useAppStore()

    // 并行加载基础数据
    await Promise.all([
      categoriesStore.loadCategories(),
      todosStore.loadTodos(),
      simpleTodosStore.loadSimpleTodos()
    ])

    // 基于加载的数据初始化应用状态
    appStore.initializeSelection(categoriesStore.categories)
  }, '初始化应用状态', ErrorTypes.BUSINESS)

  /**
   * 重新加载应用数据
   * 用于配置更新、数据导入等场景
   */
  static async reloadAppData() {
    const categoriesStore = useCategoriesStore()
    const todosStore = useTodosStore()
    const simpleTodosStore = useSimpleTodosStore()
    const appStore = useAppStore()

    // 清除配置缓存并重新加载
    globalConfig.clearCache()
    await globalConfig.initializeConfig()

    // 重新加载数据
    await Promise.all([
      categoriesStore.loadCategories(),
      todosStore.loadTodos(),
      simpleTodosStore.loadSimpleTodos()
    ])

    // 重新初始化应用状态
    appStore.initializeSelection(categoriesStore.categories)
  }

  /**
   * 执行自主备份检查
   * 在应用启动完成后调用，检查并执行自动备份
   */
  static performAutoBackupCheck = withErrorHandling(async () => {
    try {
      await AutoBackupService.performAutoBackup()
    } catch (error) {
      // 自主备份失败不应影响应用的正常使用
      console.warn('⚠️ [AppService] 自主备份检查失败:', error.message)
    }
  }, '自主备份检查', ErrorTypes.BUSINESS)

  /**
   * 重置应用状态
   * 用于数据导入、切换用户等场景
   */
  static resetAppState() {
    const categoriesStore = useCategoriesStore()
    const todosStore = useTodosStore()
    const appStore = useAppStore()

    // 清除配置缓存
    globalConfig.clearCache()

    // 重置所有store的状态
    categoriesStore.resetState()
    todosStore.resetState()
    appStore.resetState()

    // 重置初始化状态
    this.#isInitialized = false
    this.#isInitializing = false
  }

  /**
   * 获取应用初始化状态
   */
  static getInitializationStatus() {
    return {
      isInitialized: this.#isInitialized,
      isInitializing: this.#isInitializing
    }
  }
}

/**
 * 应用生命周期钩子
 */
export const useAppLifecycle = () => {
  const initialize = (options) => AppService.initializeApp(options)
  const reload = () => AppService.reloadAppData()
  const reset = () => AppService.resetAppState()
  const getStatus = () => AppService.getInitializationStatus()

  return {
    initialize,
    reload,
    reset,
    getStatus
  }
} 