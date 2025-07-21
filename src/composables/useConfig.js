import { ref, computed } from 'vue'
import { ConfigService } from '@/services/configService'

// 状态字段映射 - 统一数据库存储格式和显示格式
const STATUS_FIELD_MAP = {
  // 数据库存储格式 -> 配置键名
  pending: 'pending',
  in_progress: 'inProgress', // 数据库中可能是 in_progress
  inProgress: 'inProgress', // 配置中是 inProgress
  completed: 'completed',
  cancelled: 'cancelled',
}

// 反向映射 - 配置键名 -> 数据库存储格式
const CONFIG_TO_DB_MAP = {
  pending: 'pending',
  inProgress: 'inProgress', // 统一使用 inProgress
  completed: 'completed',
  cancelled: 'cancelled',
}

// 全局响应式状态 - 使用单例模式确保状态共享
const globalState = {
  statusConfig: ref({}),
  priorityConfig: ref({}),
  fieldConfig: ref({}),
  systemConfig: ref({}),
  isLoading: ref(false),
  isInitialized: ref(false)
}

/**
 * 配置管理组合式函数
 * 提供响应式的配置状态管理和便捷的配置访问方法
 * @returns {Object} 配置相关的状态和方法
 */
export const useConfig = () => {
  const { statusConfig, priorityConfig, fieldConfig, systemConfig, isLoading, isInitialized } = globalState

  // 初始化配置
  const initializeConfig = async () => {
    if (isInitialized.value) {
      return
    }

    isLoading.value = true
    try {
      // 并行加载所有配置
      const [status, priority, field, system] = await Promise.all([
        ConfigService.getStatusConfig(),
        ConfigService.getPriorityConfig(),
        ConfigService.getFieldConfig(),
        ConfigService.getSystemConfig(),
      ])

      statusConfig.value = status
      priorityConfig.value = priority
      fieldConfig.value = field
      systemConfig.value = system
      isInitialized.value = true

      console.log('✅ [useConfig] 配置初始化完成')
    } catch (error) {
      console.error('❌ [useConfig] 配置初始化失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取状态配置
   * @param {string} statusKey - 状态键名
   * @returns {Object} 状态配置对象，包含text和color属性
   */
  const getStatusConfig = (statusKey) => {
    // 先尝试直接匹配
    if (statusConfig.value[statusKey]) {
      return statusConfig.value[statusKey]
    }

    // 使用字段映射
    const mappedKey = STATUS_FIELD_MAP[statusKey]
    if (mappedKey && statusConfig.value[mappedKey]) {
      return statusConfig.value[mappedKey]
    }

    // 如果还没有配置，尝试异步初始化（但不等待结果）
    if (!isInitialized.value) {
      console.warn('⚠️ [useConfig] 配置未初始化，尝试异步初始化配置...')
      initializeConfig().catch(console.error)
    }

    // 默认返回
    return {
      text: '未知',
      color: 'grey',
    }
  }

  // 获取状态颜色
  const getStatusColor = (status) => {
    return getStatusConfig(status).color || 'grey'
  }

  // 获取状态文本
  const getStatusText = (status) => {
    return getStatusConfig(status).text || '未知'
  }

  // 获取状态图标
  const getStatusIcon = (status) => {
    // 根据状态返回合适的图标
    const iconMap = {
      pending: 'mdi-clock-outline',
      inProgress: 'mdi-progress-clock',
      completed: 'mdi-check-circle',
      cancelled: 'mdi-cancel',
    }

    const mappedKey = STATUS_FIELD_MAP[status] || status
    return iconMap[mappedKey] || 'mdi-help-circle'
  }

  /**
   * 获取优先级配置
   * @param {string} priority - 优先级键名
   * @returns {Object} 优先级配置对象，包含text、color和icon属性
   */
  const getPriorityConfig = (priority) => {
    // 如果还没有配置，尝试异步初始化（但不等待结果）
    if (!isInitialized.value) {
      initializeConfig().catch(console.error)
    }

    return (
      priorityConfig.value[priority] || {
        text: '普通',
        color: 'grey',
        icon: 'mdi-minus',
      }
    )
  }

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    return getPriorityConfig(priority).color || 'grey'
  }

  // 获取优先级文本
  const getPriorityText = (priority) => {
    return getPriorityConfig(priority).text || '普通'
  }

  // 获取优先级图标
  const getPriorityIcon = (priority) => {
    return getPriorityConfig(priority).icon || 'mdi-minus'
  }

  // 获取所有可用状态
  const availableStatuses = computed(() => {
    return Object.keys(statusConfig.value).map((key) => ({
      key,
      value: CONFIG_TO_DB_MAP[key] || key,
      ...statusConfig.value[key],
    }))
  })

  // 获取所有可用优先级
  const availablePriorities = computed(() => {
    return Object.keys(priorityConfig.value).map((key) => ({
      key,
      value: key,
      ...priorityConfig.value[key],
    }))
  })

  // 清除缓存（用于配置更新后）
  const clearCache = () => {
    statusConfig.value = {}
    priorityConfig.value = {}
    fieldConfig.value = {}
    systemConfig.value = {}
    isInitialized.value = false
  }

  return {
    // 响应式状态
    statusConfig,
    priorityConfig,
    fieldConfig,
    systemConfig,
    isLoading,

    // 初始化方法
    initializeConfig,
    clearCache,
    isInitialized,

    // 状态相关方法
    getStatusConfig,
    getStatusColor,
    getStatusText,
    getStatusIcon,

    // 优先级相关方法
    getPriorityConfig,
    getPriorityColor,
    getPriorityText,
    getPriorityIcon,

    // 计算属性
    availableStatuses,
    availablePriorities,
  }
}

// 创建全局实例
export const globalConfig = useConfig()

// 在模块加载时尝试初始化配置
if (typeof window !== 'undefined') {
  // 确保在浏览器环境中执行
  globalConfig.initializeConfig().catch(error => {
    console.warn('全局配置初始化失败:', error)
  })
}
