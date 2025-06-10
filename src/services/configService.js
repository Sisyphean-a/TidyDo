import { get, set } from 'idb-keyval'

// 配置数据的Key
export const CONFIG_KEY = 'app-config'

// 默认配置
export const DEFAULT_CONFIG = {
  // 状态配置
  statusConfig: {
    pending: {
      text: '待办',
      color: 'warning',
    },
    inProgress: {
      text: '进行中',
      color: 'info',
    },
    completed: {
      text: '完成',
      color: 'success',
    },
    cancelled: {
      text: '取消',
      color: 'error',
    },
  },

  // 优先级配置
  priorityConfig: {
    low: {
      text: '低优先级',
      color: 'success',
      icon: 'mdi-chevron-down',
    },
    medium: {
      text: '中优先级',
      color: 'warning',
      icon: 'mdi-chevron-up',
    },
    high: {
      text: '高优先级',
      color: 'error',
      icon: 'mdi-chevron-double-up',
    },
  },

  // 字段显示配置
  fieldConfig: {
    endDate: {
      label: '结束日期',
      required: true,
    },
    dueDate: {
      label: '截止日期',
      required: false,
    },
    assignee: {
      label: '分配人',
      required: false,
    },
    tags: {
      label: '标签',
      required: false,
    },
  },

  // 系统设置
  systemConfig: {
    theme: 'light',
    language: 'zh-CN',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
  },
}

// 配置服务类
export class ConfigService {
  // 获取完整配置
  static async getConfig() {
    const config = await get(CONFIG_KEY)
    if (!config) {
      // 如果没有配置，返回默认配置并保存
      await this.saveConfig(DEFAULT_CONFIG)
      return DEFAULT_CONFIG
    }

    // 合并默认配置和已保存的配置，确保新增的配置项能被包含
    return this.mergeConfig(DEFAULT_CONFIG, config)
  }

  // 保存配置
  static async saveConfig(config) {
    const mergedConfig = this.mergeConfig(DEFAULT_CONFIG, config)
    await set(CONFIG_KEY, mergedConfig)
    return mergedConfig
  }

  // 获取状态配置
  static async getStatusConfig() {
    const config = await this.getConfig()
    return config.statusConfig
  }

  // 获取优先级配置
  static async getPriorityConfig() {
    const config = await this.getConfig()
    return config.priorityConfig
  }

  // 获取字段配置
  static async getFieldConfig() {
    const config = await this.getConfig()
    return config.fieldConfig
  }

  // 获取系统配置
  static async getSystemConfig() {
    const config = await this.getConfig()
    return config.systemConfig
  }

  // 更新特定配置
  static async updateStatusConfig(statusConfig) {
    const config = await this.getConfig()
    config.statusConfig = { ...config.statusConfig, ...statusConfig }
    return await this.saveConfig(config)
  }

  static async updatePriorityConfig(priorityConfig) {
    const config = await this.getConfig()
    config.priorityConfig = { ...config.priorityConfig, ...priorityConfig }
    return await this.saveConfig(config)
  }

  static async updateFieldConfig(fieldConfig) {
    const config = await this.getConfig()
    config.fieldConfig = { ...config.fieldConfig, ...fieldConfig }
    return await this.saveConfig(config)
  }

  static async updateSystemConfig(systemConfig) {
    const config = await this.getConfig()
    config.systemConfig = { ...config.systemConfig, ...systemConfig }
    return await this.saveConfig(config)
  }

  // 重置为默认配置
  static async resetToDefault() {
    await this.saveConfig(DEFAULT_CONFIG)
    return DEFAULT_CONFIG
  }

  // 深度合并配置对象
  static mergeConfig(defaultConfig, userConfig) {
    const result = {}

    for (const key in defaultConfig) {
      if (
        typeof defaultConfig[key] === 'object' &&
        defaultConfig[key] !== null &&
        !Array.isArray(defaultConfig[key])
      ) {
        result[key] = this.mergeConfig(defaultConfig[key], userConfig[key] || {})
      } else {
        result[key] = userConfig[key] !== undefined ? userConfig[key] : defaultConfig[key]
      }
    }

    // 添加用户配置中额外的属性
    for (const key in userConfig) {
      if (!(key in defaultConfig)) {
        result[key] = userConfig[key]
      }
    }

    return result
  }
}

// 初始化配置
export const initializeConfig = async () => {
  await ConfigService.getConfig()
}
