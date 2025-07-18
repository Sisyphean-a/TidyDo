import { ref, computed } from 'vue'
import { ConfigService } from '@/services/configService'

// 全局配置缓存
let configCache = null
let statusConfigCache = null
let priorityConfigCache = null

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

export const useConfig = () => {
  const statusConfig = ref({})
  const priorityConfig = ref({})
  const fieldConfig = ref({})
  const systemConfig = ref({})
  const isLoading = ref(false)

  // 初始化配置
  const initializeConfig = async () => {
    if (configCache) {
      // 使用缓存
      statusConfig.value = statusConfigCache
      priorityConfig.value = priorityConfigCache
      return
    }

    isLoading.value = true
    try {
      // 加载所有配置
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

      // 缓存配置
      statusConfigCache = status
      priorityConfigCache = priority
      configCache = true
    } catch (error) {
      console.error('Failed to initialize config:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 获取状态配置
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
    const config = getStatusConfig(status)
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

  // 获取优先级配置
  const getPriorityConfig = (priority) => {
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
    configCache = null
    statusConfigCache = null
    priorityConfigCache = null
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
