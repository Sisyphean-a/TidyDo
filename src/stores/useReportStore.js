/**
 * 报表状态管理
 * 管理报表数据的响应式状态和业务逻辑
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ReportService } from '@/services/reportService'

export const useReportStore = defineStore('report', () => {
  // 状态
  const isLoading = ref(false)
  const reportData = ref(null)
  const lastUpdated = ref(null)
  const trendDays = ref(30) // 趋势分析天数
  const autoRefresh = ref(false) // 自动刷新开关
  const refreshInterval = ref(null) // 刷新定时器

  // 计算属性

  // 项目数量统计
  const projectCountStats = computed(() => {
    return reportData.value?.projectCount || null
  })

  // 状态分布统计
  const statusDistributionStats = computed(() => {
    return reportData.value?.statusDistribution || null
  })

  // 完成情况统计
  const completionStats = computed(() => {
    return reportData.value?.completion || null
  })

  // 时间趋势统计
  const timeTrendStats = computed(() => {
    return reportData.value?.timeTrend || null
  })

  // 优先级分布统计
  const priorityDistributionStats = computed(() => {
    return reportData.value?.priorityDistribution || null
  })

  // 是否有数据
  const hasData = computed(() => {
    return reportData.value !== null
  })

  // 数据是否过期（超过5分钟）
  const isDataStale = computed(() => {
    if (!lastUpdated.value) return true
    const now = new Date()
    const updated = new Date(lastUpdated.value)
    const diffMinutes = (now - updated) / (1000 * 60)
    return diffMinutes > 5
  })

  // 格式化的最后更新时间
  const formattedLastUpdated = computed(() => {
    if (!lastUpdated.value) return '从未更新'
    return new Date(lastUpdated.value).toLocaleString('zh-CN')
  })

  // Actions (方法)

  /**
   * 加载报表数据
   * @param {Object} options - 选项参数
   * @returns {Promise<void>}
   */
  const loadReportData = async (options = {}) => {
    try {
      isLoading.value = true
      const { trendDays: customTrendDays } = options
      
      const reportOptions = {
        trendDays: customTrendDays || trendDays.value
      }

      const data = await ReportService.getComprehensiveReport(reportOptions)
      reportData.value = data
      lastUpdated.value = new Date().toISOString()
      
      return data
    } catch (error) {
      console.error('加载报表数据失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刷新报表数据
   * @returns {Promise<void>}
   */
  const refreshReportData = async () => {
    return await loadReportData()
  }

  /**
   * 设置趋势分析天数
   * @param {number} days - 天数
   */
  const setTrendDays = (days) => {
    if (days > 0 && days <= 365) {
      trendDays.value = days
    }
  }

  /**
   * 启动自动刷新
   * @param {number} intervalMinutes - 刷新间隔（分钟）
   */
  const startAutoRefresh = (intervalMinutes = 5) => {
    stopAutoRefresh() // 先停止现有的定时器
    
    autoRefresh.value = true
    refreshInterval.value = setInterval(async () => {
      try {
        await refreshReportData()
      } catch (error) {
        console.error('自动刷新报表数据失败:', error)
      }
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * 停止自动刷新
   */
  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
    autoRefresh.value = false
  }

  /**
   * 获取特定类型的统计数据
   * @param {string} type - 统计类型
   * @returns {Promise<Object>}
   */
  const getSpecificStats = async (type) => {
    try {
      isLoading.value = true
      
      switch (type) {
        case 'projectCount':
          return await ReportService.getProjectCountStats()
        case 'statusDistribution':
          return await ReportService.getStatusDistributionStats()
        case 'completion':
          return await ReportService.getCompletionStats()
        case 'timeTrend':
          return await ReportService.getTimeTrendStats(trendDays.value)
        case 'priorityDistribution':
          return await ReportService.getPriorityDistributionStats()
        default:
          throw new Error(`未知的统计类型: ${type}`)
      }
    } catch (error) {
      console.error(`获取${type}统计数据失败:`, error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除报表数据
   */
  const clearReportData = () => {
    reportData.value = null
    lastUpdated.value = null
    stopAutoRefresh()
  }

  /**
   * 重置状态
   */
  const resetState = () => {
    isLoading.value = false
    reportData.value = null
    lastUpdated.value = null
    trendDays.value = 30
    stopAutoRefresh()
  }

  /**
   * 导出报表数据
   * @param {string} format - 导出格式 ('json' | 'csv')
   * @returns {Object} 导出的数据
   */
  const exportReportData = (format = 'json') => {
    if (!hasData.value) {
      throw new Error('没有可导出的报表数据')
    }

    const exportData = {
      ...reportData.value,
      exportedAt: new Date().toISOString(),
      exportFormat: format
    }

    if (format === 'json') {
      return exportData
    } else if (format === 'csv') {
      // 这里可以实现CSV格式转换逻辑
      // 暂时返回JSON格式
      return exportData
    }

    return exportData
  }

  return {
    // 状态
    isLoading,
    reportData,
    lastUpdated,
    trendDays,
    autoRefresh,

    // 计算属性
    projectCountStats,
    statusDistributionStats,
    completionStats,
    timeTrendStats,
    priorityDistributionStats,
    hasData,
    isDataStale,
    formattedLastUpdated,

    // 方法
    loadReportData,
    refreshReportData,
    setTrendDays,
    startAutoRefresh,
    stopAutoRefresh,
    getSpecificStats,
    clearReportData,
    resetState,
    exportReportData
  }
})
