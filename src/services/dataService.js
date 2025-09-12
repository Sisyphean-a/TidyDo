import { keys, get, set, clear } from 'idb-keyval'
import { TODO_CATEGORIES_KEY, TODO_ITEMS_KEY } from './todoService'

/**
 * 数据备份和恢复服务类
 * 提供数据的导入导出功能，支持备份和恢复应用数据
 */
export class DataService {
  /**
   * 导出所有数据
   * @returns {Promise<Object>} 包含版本信息、时间戳和数据的导出对象
   * @throws {Error} 当导出失败时抛出错误
   */
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

  /**
   * 导入数据
   * @param {Object} importData - 要导入的数据对象
   * @param {Object} options - 导入选项
   * @param {boolean} options.clearExisting - 是否清除现有数据，默认为false
   * @param {boolean} options.mergeData - 是否合并数据，默认为true
   * @returns {Promise<Object>} 导入结果对象
   * @throws {Error} 当导入失败时抛出错误
   */
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

  // 下载数据为JSON文件（传统方式）
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

  /**
   * 使用现代文件系统API保存文件到指定位置
   * @param {Object} data - 要保存的数据
   * @param {string} filename - 文件名
   * @param {FileSystemDirectoryHandle} directoryHandle - 目录句柄（可选）
   * @returns {Promise<boolean>} 保存是否成功
   */
  static async saveFileWithSystemAPI(data, filename = `tidydo-backup-${new Date().toISOString().split('T')[0]}.json`, directoryHandle = null) {
    try {
      // 检查是否支持 File System Access API
      if (!window.showSaveFilePicker) {
        console.warn('浏览器不支持 File System Access API，使用传统下载方式')
        return this.downloadAsJSON(data, filename)
      }

      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })

      let fileHandle
      
      if (directoryHandle) {
        // 如果有目录句柄，在指定目录中创建文件
        try {
          fileHandle = await directoryHandle.getFileHandle(filename, { create: true })
        } catch (error) {
          console.warn('无法在指定目录创建文件，使用文件选择器:', error)
          fileHandle = await this.showSaveFilePickerWithFallback(filename)
        }
      } else {
        // 使用文件选择器让用户选择保存位置
        fileHandle = await this.showSaveFilePickerWithFallback(filename)
      }

      // 写入文件
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()

      console.log('✅ 文件已保存到:', fileHandle.name)
      return true
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('用户取消了文件保存')
        return false
      }
      console.error('保存文件失败：', error)
      // 如果现代API失败，回退到传统下载方式
      console.warn('回退到传统下载方式')
      return this.downloadAsJSON(data, filename)
    }
  }

  /**
   * 显示保存文件选择器，带回退机制
   * @param {string} filename - 建议的文件名
   * @returns {Promise<FileSystemFileHandle>} 文件句柄
   */
  static async showSaveFilePickerWithFallback(filename) {
    try {
      return await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'JSON 文件',
          accept: { 'application/json': ['.json'] }
        }]
      })
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error // 用户取消，向上传递
      }
      console.warn('showSaveFilePicker 失败，回退到传统下载方式')
      throw new Error('文件选择器不可用')
    }
  }

  /**
   * 检查是否支持现代文件系统API
   * @returns {boolean} 是否支持
   */
  static isFileSystemAccessSupported() {
    return 'showSaveFilePicker' in window && 'showDirectoryPicker' in window
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