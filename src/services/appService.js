import { initializeConfig } from './configService'
import { initializeDefaultData } from './todoService'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useTodosStore } from '@/stores/useTodosStore'
import { useAppStore } from '@/stores/useAppStore'
import { globalConfig } from '@/composables/useConfig'

/**
 * 应用初始化服务
 * 统一管理整个应用的启动流程，确保初始化的正确时序
 */
export class AppService {
  static isInitialized = false
  static isInitializing = false

  /**
   * 初始化应用
   * @param {Object} options - 初始化选项
   * @param {boolean} options.force - 是否强制重新初始化
   * @returns {Promise<void>}
   */
  static async initializeApp(options = {}) {
    const { force = false } = options

    // 防止重复初始化
    if (this.isInitialized && !force) {
      return
    }

    // 防止并发初始化
    if (this.isInitializing) {
      return new Promise((resolve) => {
        const checkInitialized = () => {
          if (this.isInitialized) {
            resolve()
          } else {
            setTimeout(checkInitialized, 50)
          }
        }
        checkInitialized()
      })
    }

    this.isInitializing = true

    try {
      // 1. 初始化配置
      await initializeConfig()

      // 2. 初始化全局配置 composable
      await globalConfig.initializeConfig()

      // 3. 初始化默认数据
      await initializeDefaultData()

      // 4. 初始化 stores 数据
      await this.initializeStores()

      this.isInitialized = true
      console.log('✅ [AppService] 应用初始化完成')
    } catch (error) {
      console.error('❌ [AppService] 应用初始化失败:', error)
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  /**
   * 初始化 stores 数据
   * 确保正确的加载顺序和依赖关系
   */
  static async initializeStores() {
    const categoriesStore = useCategoriesStore()
    const todosStore = useTodosStore()
    const appStore = useAppStore()

    // 并行加载基础数据
    await Promise.all([
      categoriesStore.loadCategories(),
      todosStore.loadTodos()
    ])

    // 基于加载的数据初始化应用状态
    appStore.initializeSelection(categoriesStore.categories)
  }

  /**
   * 重新加载应用数据
   * 用于配置更新、数据导入等场景
   */
  static async reloadAppData() {
    const categoriesStore = useCategoriesStore()
    const todosStore = useTodosStore()
    const appStore = useAppStore()

    // 清除配置缓存并重新加载
    globalConfig.clearCache()
    await globalConfig.initializeConfig()

    // 重新加载数据
    await Promise.all([
      categoriesStore.loadCategories(),
      todosStore.loadTodos()
    ])

    // 重新初始化应用状态
    appStore.initializeSelection(categoriesStore.categories)
  }

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
    this.isInitialized = false
    this.isInitializing = false
  }

  /**
   * 获取应用初始化状态
   */
  static getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing
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