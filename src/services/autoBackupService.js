import { ConfigService } from './configService'
import { DataService } from './dataService'
import { DirectoryHandleService } from './directoryHandleService'
import { withErrorHandling, ErrorTypes } from '@/utils/errorHandler'

/**
 * 自主备份服务类
 * 提供自动备份功能，支持目录扫描和定期备份
 */
export class AutoBackupService {
  /**
   * 检查并执行自主备份
   * 在应用启动后调用，检查是否需要执行备份
   * @returns {Promise<void>}
   */
  static performAutoBackup = withErrorHandling(async () => {
    const backupConfig = await ConfigService.getAutoBackupConfig()
    
    // 如果未启用自主备份，直接返回
    if (!backupConfig.enabled) {
      console.log('🔄 [AutoBackup] 自主备份未启用')
      return
    }

    // 检查备份路径是否设置
    if (!backupConfig.backupPath || backupConfig.backupPath.trim() === '') {
      console.warn('⚠️ [AutoBackup] 备份路径未设置，跳过自动备份')
      return
    }

    console.log('🔄 [AutoBackup] 开始检查自主备份条件...')

    // 检查今日是否已备份
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD格式
    const needsBackup = await this.checkIfBackupNeeded(today, backupConfig)

    if (needsBackup) {
      console.log('📦 [AutoBackup] 开始执行自动备份...')
      await this.executeBackup(backupConfig.backupPath, today)
      
      // 更新最后备份日期
      await ConfigService.updateAutoBackupConfig({
        lastBackupDate: today
      })
      
      console.log('✅ [AutoBackup] 自动备份完成')
    } else {
      console.log('⏭️ [AutoBackup] 今日已备份，跳过')
    }
  }, '执行自主备份', ErrorTypes.BUSINESS)

  /**
   * 检查是否需要备份
   * @param {string} today - 今日日期 (YYYY-MM-DD)
   * @param {Object} backupConfig - 备份配置
   * @returns {Promise<boolean>} 是否需要备份
   */
  static checkIfBackupNeeded = withErrorHandling(async (today, backupConfig) => {
    // 如果从未备份过，需要备份
    if (!backupConfig.lastBackupDate) {
      console.log('📝 [AutoBackup] 首次备份，需要执行')
      return true
    }

    // 如果最后备份日期不是今天，需要备份
    if (backupConfig.lastBackupDate !== today) {
      console.log(`📝 [AutoBackup] 上次备份: ${backupConfig.lastBackupDate}，今日: ${today}，需要备份`)
      return true
    }

    // 检查目录中是否存在今日的备份文件
    try {
      const todayBackupExists = await this.checkTodayBackupExists(backupConfig.backupPath, today)
      if (!todayBackupExists) {
        console.log('📝 [AutoBackup] 目录中不存在今日备份文件，需要备份')
        return true
      }
    } catch (error) {
      console.warn('⚠️ [AutoBackup] 检查备份目录失败，仍然执行备份:', error.message)
      return true
    }

    return false
  }, '检查备份需求', ErrorTypes.BUSINESS)

  /**
   * 检查今日备份文件是否存在
   * 注意：由于浏览器安全限制，无法直接访问文件系统
   * 这里采用配置记录的方式来判断
   * @param {string} backupPath - 备份路径
   * @param {string} today - 今日日期
   * @returns {Promise<boolean>} 文件是否存在
   */
  static checkTodayBackupExists = withErrorHandling(async (backupPath, today) => {
    // 由于浏览器安全限制，无法直接检查文件系统
    // 这里主要依靠配置中的 lastBackupDate 来判断
    // 在实际的桌面应用中，可以使用 Node.js 的 fs 模块来检查文件
    
    // 生成今日备份文件名
    const expectedFileName = `tidydo-backup-${today}.json`
    
    console.log(`🔍 [AutoBackup] 检查备份文件: ${backupPath}/${expectedFileName}`)
    
    // 由于浏览器限制，这里总是返回 false，让系统依赖 lastBackupDate 判断
    // 在实际使用中，用户可以手动设置备份目录，系统会在该目录下创建备份文件
    return false
  }, '检查备份文件存在性', ErrorTypes.STORAGE)

  /**
   * 执行备份操作
   * @param {string} backupPath - 备份路径（显示用）
   * @param {string} today - 今日日期
   * @returns {Promise<void>}
   */
  static executeBackup = withErrorHandling(async (backupPath, today) => {
    // 导出所有数据
    const exportData = await DataService.exportAllData()
    
    // 生成备份文件名（与导出所有数据的文件名格式一致）
    const fileName = `tidydo-backup-${today}.json`
    
    console.log(`💾 [AutoBackup] 开始备份到: ${backupPath}`)
    
    try {
      // 获取目录句柄
      const { handle: directoryHandle } = await DirectoryHandleService.getDirectoryHandle('autoBackup')
      
      if (directoryHandle && await DirectoryHandleService.verifyPermission(directoryHandle)) {
        // 使用现代API保存到指定目录
        const success = await DataService.saveFileWithSystemAPI(exportData, fileName, directoryHandle)
        if (success) {
          console.log(`✅ [AutoBackup] 备份文件已保存到: ${backupPath}/${fileName}`)
          return
        }
      }
      
      // 如果没有目录句柄或权限验证失败，使用文件选择器
      console.log(`📁 [AutoBackup] 使用文件选择器保存备份文件: ${fileName}`)
      await DataService.saveFileWithSystemAPI(exportData, fileName, null)
      
    } catch (error) {
      console.warn('现代API备份失败，使用传统下载方式:', error)
      // 回退到传统下载方式
      DataService.downloadAsJSON(exportData, fileName)
      console.log(`💾 [AutoBackup] 备份文件已下载: ${fileName}`)
      console.log(`📁 [AutoBackup] 请手动将文件移动到: ${backupPath}`)
    }
  }, '执行备份操作', ErrorTypes.BUSINESS)

  /**
   * 验证备份路径
   * @param {string} path - 备份路径
   * @returns {boolean} 路径是否有效
   */
  static validateBackupPath(path) {
    if (!path || typeof path !== 'string') {
      return false
    }
    
    const trimmedPath = path.trim()
    if (trimmedPath === '') {
      return false
    }
    
    // 基本路径格式验证
    // Windows: C:\path\to\folder 或 D:\backup
    // Unix/Linux: /path/to/folder 或 ~/backup
    const windowsPathRegex = /^[A-Za-z]:\\[^<>:"|?*]*$/
    const unixPathRegex = /^(\/|~\/)[^<>:"|?*]*$/
    const relativePathRegex = /^[^<>:"|?*\\\/]+([\\\/][^<>:"|?*\\\/]+)*$/
    
    return windowsPathRegex.test(trimmedPath) || 
           unixPathRegex.test(trimmedPath) || 
           relativePathRegex.test(trimmedPath)
  }

  /**
   * 获取自主备份状态信息
   * @returns {Promise<Object>} 备份状态信息
   */
  static getBackupStatus = withErrorHandling(async () => {
    const backupConfig = await ConfigService.getAutoBackupConfig()
    const today = new Date().toISOString().split('T')[0]
    
    return {
      enabled: backupConfig.enabled,
      backupPath: backupConfig.backupPath,
      lastBackupDate: backupConfig.lastBackupDate,
      needsBackupToday: backupConfig.lastBackupDate !== today,
      isPathValid: this.validateBackupPath(backupConfig.backupPath),
      expectedFileName: `tidydo-backup-${today}.json`
    }
  }, '获取备份状态', ErrorTypes.BUSINESS)

  /**
   * 手动触发备份
   * 用于用户手动执行备份操作
   * @returns {Promise<void>}
   */
  static manualBackup = withErrorHandling(async () => {
    const backupConfig = await ConfigService.getAutoBackupConfig()
    
    if (!backupConfig.enabled) {
      throw new Error('自主备份功能未启用')
    }
    
    const today = new Date().toISOString().split('T')[0]
    await this.executeBackup(backupConfig.backupPath || '用户选择的目录', today)
    
    // 更新最后备份日期
    await ConfigService.updateAutoBackupConfig({
      lastBackupDate: today
    })
    
    console.log('✅ [AutoBackup] 手动备份完成')
  }, '手动备份', ErrorTypes.BUSINESS)

  /**
   * 选择并设置备份目录
   * @returns {Promise<{success: boolean, path: string}>} 选择结果
   */
  static selectBackupDirectory = withErrorHandling(async () => {
    if (!DirectoryHandleService.isSupported()) {
      throw new Error('浏览器不支持目录选择功能，请使用 Chrome 86+ 或 Edge 86+')
    }

    try {
      const { handle, path } = await DirectoryHandleService.showDirectoryPicker()
      
      // 存储目录句柄
      await DirectoryHandleService.storeDirectoryHandle('autoBackup', handle, path)
      
      // 更新配置
      await ConfigService.updateAutoBackupConfig({
        backupPath: path,
        useModernAPI: true
      })

      console.log('✅ [AutoBackup] 备份目录已设置:', path)
      return { success: true, path }
    } catch (error) {
      if (error.message.includes('取消')) {
        return { success: false, path: '' }
      }
      throw error
    }
  }, '选择备份目录', ErrorTypes.BUSINESS)
}
