import { keys, get, set, clear } from 'idb-keyval'
import { TODO_CATEGORIES_KEY, TODO_ITEMS_KEY } from './todoService'

// 数据备份和恢复服务
export class DataService {
  // 导出所有数据
  static async exportAllData() {
    try {
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {}
      }

      // 获取所有存储的键
      const allKeys = await keys()
      
      // 导出所有数据
      for (const key of allKeys) {
        const value = await get(key)
        exportData.data[key] = value
      }

      return exportData
    } catch (error) {
      console.error('导出数据失败：', error)
      throw new Error('数据导出失败')
    }
  }

  // 导入数据
  static async importData(importData, options = {}) {
    try {
      const { clearExisting = false, mergeData = true } = options

      // 验证数据格式
      if (!importData || !importData.data) {
        throw new Error('无效的数据格式')
      }

      // 如果选择清除现有数据
      if (clearExisting) {
        await clear()
      }

      // 导入数据
      for (const [key, value] of Object.entries(importData.data)) {
        if (mergeData && !clearExisting) {
          // 合并模式：对于数组类型的数据，需要智能合并
          const existingValue = await get(key)
          if (existingValue && Array.isArray(existingValue) && Array.isArray(value)) {
            // 对于类别和待办项，按ID合并，避免重复
            const mergedValue = this.mergeArrayData(existingValue, value, key)
            await set(key, mergedValue)
          } else {
            await set(key, value)
          }
        } else {
          await set(key, value)
        }
      }

      return {
        success: true,
        message: '数据导入成功',
        importedKeys: Object.keys(importData.data)
      }
    } catch (error) {
      console.error('导入数据失败：', error)
      throw new Error(`数据导入失败：${error.message}`)
    }
  }

  // 智能合并数组数据
  static mergeArrayData(existingData, newData, key) {
    if (key === TODO_CATEGORIES_KEY || key === TODO_ITEMS_KEY) {
      // 对于有ID的数据，按ID去重合并
      const existingIds = new Set(existingData.map(item => item.id))
      const uniqueNewData = newData.filter(item => !existingIds.has(item.id))
      return [...existingData, ...uniqueNewData]
    }
    
    // 其他情况直接替换
    return newData
  }

  // 下载数据为JSON文件
  static downloadAsJSON(data, filename = `tidydo-backup-${new Date().toISOString().split('T')[0]}.json`) {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('下载文件失败：', error)
      throw new Error('文件下载失败')
    }
  }

  // 从文件读取JSON数据
  static readJSONFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('未选择文件'))
        return
      }

      if (!file.name.endsWith('.json')) {
        reject(new Error('请选择JSON格式的文件'))
        return
      }

      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          resolve(data)
        } catch (error) {
          reject(new Error('文件格式错误，请确保是有效的JSON文件'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsText(file)
    })
  }

  // 获取数据统计信息
  static async getDataStats() {
    try {
      const allKeys = await keys()
      const stats = {
        totalKeys: allKeys.length,
        details: {}
      }

      for (const key of allKeys) {
        const value = await get(key)
        if (Array.isArray(value)) {
          stats.details[key] = {
            type: 'array',
            count: value.length
          }
        } else if (typeof value === 'object') {
          stats.details[key] = {
            type: 'object',
            keys: Object.keys(value).length
          }
        } else {
          stats.details[key] = {
            type: typeof value,
            value: value
          }
        }
      }

      return stats
    } catch (error) {
      console.error('获取数据统计失败：', error)
      throw new Error('获取数据统计失败')
    }
  }
} 