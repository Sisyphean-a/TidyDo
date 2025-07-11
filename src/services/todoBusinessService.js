/**
 * Todo业务服务层
 * 封装业务逻辑和规则
 * 包含:
 * - 业务规则验证
 * - 数据转换和格式化
 * - 状态和优先级管理
 * - 日期计算
 * - 表格配置
 * - 快速操作
 * - 批量操作
 * - 数据统计
 * - 搜索和过滤
 * - 数据导出
 */

import { ConfigService } from './configService'

export class TodoBusinessService {
  // 配置缓存
  static _statusConfig = null
  static _priorityConfig = null
  static _initialized = false

  /**
   * 初始化配置
   * ConfigService保证了配置永远有值，所以这里无需处理错误情况
   */
  static async initialize() {
    if (this._initialized) return

    [this._statusConfig, this._priorityConfig] = await Promise.all([
      ConfigService.getStatusConfig(),
      ConfigService.getPriorityConfig(),
    ])
    
    this._initialized = true
  }

  /**
   * 获取状态配置
   */
  static getStatusConfig() {
    return this._statusConfig
  }

  static getPriorityConfig() {
    return this._priorityConfig
  }

  /**
   * 业务规则验证
   */
  static canCreateTodo(category, user = null) {
    if (!category) return { canCreate: false, reason: '请选择分类' }
    if (category.isFilterCategory) return { canCreate: false, reason: '筛选类不能创建待办事项' }
    return { canCreate: true }
  }

  static canEditTodo(todo, user = null) {
    if (!todo) return { canEdit: false, reason: '待办事项不存在' }
    if (todo.archived) return { canEdit: false, reason: '已归档的待办事项不能编辑' }
    return { canEdit: true }
  }

  static canDeleteTodo(todo, user = null) {
    if (!todo) return { canDelete: false, reason: '待办事项不存在' }
    return { canDelete: true }
  }

  static canDeleteCategory(category, todos = []) {
    if (!category) return { canDelete: false, reason: '分类不存在' }
    const categoryTodos = todos.filter(todo => todo.categoryId === category.id)
    if (categoryTodos.length > 0) {
      return { canDelete: false, reason: `分类下还有 ${categoryTodos.length} 个待办事项` }
    }
    return { canDelete: true }
  }

  /**
   * 数据转换和格式化
   */
  static formatTodoForDisplay(todo, category = null) {
    return {
      ...todo,
      displayNumber: todo.customNumber || `#${todo.id.slice(-8).toUpperCase()}`,
      formattedEndDate: todo.endDate ? new Date(todo.endDate).toLocaleDateString() : null,
      categoryName: category?.name || '未分类',
      categoryIcon: category?.icon || 'mdi-folder',
      statusText: this._statusConfig?.[todo.status]?.text || '未知状态',
      statusColor: this._statusConfig?.[todo.status]?.color || 'grey',
      priorityText: this._priorityConfig?.[todo.priority]?.text || '中',
      priorityIcon: this._priorityConfig?.[todo.priority]?.icon || 'mdi-minus',
      isOverdue: todo.endDate && new Date(todo.endDate) < new Date(),
      remainingDays: todo.endDate ? this.calculateRemainingDays(todo.endDate) : null,
    }
  }

  static enhanceTodoForDisplay(todo, category = null) {
    return this.formatTodoForDisplay(todo, category)
  }

  static formatCategoryForDisplay(category, todoCount = 0) {
    return {
      ...category,
      todoCount,
      displayName: category.name,
      displayIcon: category.icon || 'mdi-folder',
    }
  }

  /**
   * 状态和优先级相关方法
   */
  static getStatusText(status) {
    return this._statusConfig?.[status]?.text || '未知状态'
  }

  static getStatusColor(status) {
    return this._statusConfig?.[status]?.color || 'grey'
  }

  static getPriorityText(priority) {
    return this._priorityConfig?.[priority]?.text || '中'
  }

  static getPriorityIcon(priority) {
    return this._priorityConfig?.[priority]?.icon || 'mdi-minus'
  }

  /**
   * 日期计算
   */
  static calculateRemainingDays(endDate) {
    if (!endDate) return null
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `逾期${Math.abs(diffDays)}天`
    if (diffDays === 0) return '今天到期'
    if (diffDays === 1) return '明天到期'
    return `${diffDays}天后到期`
  }

  /**
   * 表格列配置
   */
  static getTableColumns(viewMode = 'list', showCategory = false) {
    const baseColumns = [
      { key: 'number', title: '编号', cols: 1, align: 'center' },
      { key: 'title', title: '标题', cols: 3, align: 'left' },
      { key: 'endDate', title: '截止日期', cols: 1, align: 'center', sortable: true },
      { key: 'status', title: '状态', cols: 1, align: 'center' },
    ]

    if (showCategory) {
      baseColumns.push({ key: 'category', title: '分类', cols: 1, align: 'center' })
    }

    baseColumns.push({ key: 'actions', title: '操作', cols: 1, align: 'center' })

    return baseColumns
  }

  /**
   * 快速操作
   */
  static async quickUpdateStatus(todo, newStatus, updateTodoFn) {
    try {
      const updatedTodo = { ...todo, status: newStatus }
      await updateTodoFn(updatedTodo)
      return { success: true, message: '状态更新成功' }
    } catch (error) {
      console.error('快速更新状态失败:', error)
      return { success: false, message: '状态更新失败' }
    }
  }

  static async quickToggleArchive(todo, toggleArchiveFn) {
    try {
      const updatedTodo = { ...todo, archived: !todo.archived }
      await toggleArchiveFn(updatedTodo)
      return { 
        success: true, 
        message: todo.archived ? '取消归档成功' : '归档成功' 
      }
    } catch (error) {
      console.error('快速切换归档状态失败:', error)
      return { success: false, message: '操作失败' }
    }
  }

  /**
   * 批量操作
   */
  static async batchUpdateStatus(todos, newStatus, updateTodoFn) {
    const results = []
    for (const todo of todos) {
      const result = await this.quickUpdateStatus(todo, newStatus, updateTodoFn)
      results.push({ todo, result })
    }
    return results
  }

  static async batchArchive(todos, archive, updateTodoFn) {
    const results = []
    for (const todo of todos) {
      const updatedTodo = { ...todo, archived: archive }
      try {
        await updateTodoFn(updatedTodo)
        results.push({ todo, success: true })
      } catch (error) {
        results.push({ todo, success: false, error })
      }
    }
    return results
  }

  /**
   * 数据统计
   */
  static getTodoStatistics(todos) {
    const total = todos.length
    const completed = todos.filter(todo => todo.status === 'completed').length
    const pending = todos.filter(todo => todo.status === 'pending').length
    const inProgress = todos.filter(todo => todo.status === 'inProgress').length
    const overdue = todos.filter(todo => 
      todo.endDate && new Date(todo.endDate) < new Date() && todo.status !== 'completed'
    ).length
    const archived = todos.filter(todo => todo.archived).length

    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      archived,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  /**
   * 搜索和过滤
   */
  static searchTodos(todos, searchTerm) {
    if (!searchTerm) return todos
    
    const term = searchTerm.toLowerCase()
    return todos.filter(todo => 
      todo.title.toLowerCase().includes(term) ||
      todo.description?.toLowerCase().includes(term) ||
      todo.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      todo.customNumber?.toLowerCase().includes(term)
    )
  }

  /**
   * 导出数据
   */
  static exportTodos(todos, format = 'json') {
    const exportData = todos.map(todo => ({
      编号: todo.customNumber || todo.id,
      标题: todo.title,
      描述: todo.description || '',
      状态: this.getStatusText(todo.status),
      优先级: this.getPriorityText(todo.priority),
      截止日期: todo.endDate || '',
      标签: todo.tags?.join(', ') || '',
      创建时间: todo.createdAt,
      更新时间: todo.updatedAt,
    }))

    if (format === 'csv') {
      const csv = this.convertToCSV(exportData)
      return csv
    }

    return JSON.stringify(exportData, null, 2)
  }

  static convertToCSV(data) {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')

    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header]
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  }

  /**
   * 获取待办事项的完整信息
   */
  static getTodoFullInfo(todo) {
    const lines = [
      `编号: ${todo.displayNumber || todo.id}`,
      `标题: ${todo.title}`,
      `描述: ${todo.description || '无'}`,
      `状态: ${this.getStatusText(todo.status)}`,
      `优先级: ${this.getPriorityText(todo.priority)}`,
      `截止日期: ${todo.formattedEndDate || '未设置'}`,
      `分类: ${todo.categoryName || '未分类'}`,
      `标签: ${todo.tags?.join(', ') || '无'}`,
      `创建时间: ${todo.createdAt ? new Date(todo.createdAt).toLocaleString() : '未知'}`,
      `更新时间: ${todo.updatedAt ? new Date(todo.updatedAt).toLocaleString() : '未知'}`,
    ]
    return lines.join('\n')
  }
}

/**
 * 通知服务
 */
export class NotificationService {
  static success(message, options = {}) {
    return {
      type: 'success',
      message,
      timeout: 3000,
      ...options
    }
  }

  static error(message, options = {}) {
    return {
      type: 'error',
      message,
      timeout: 5000,
      ...options
    }
  }

  static warning(message, options = {}) {
    return {
      type: 'warning',
      message,
      timeout: 4000,
      ...options
    }
  }

  static info(message, options = {}) {
    return {
      type: 'info',
      message,
      timeout: 3000,
      ...options
    }
  }
}

/**
 * 工具函数
 */
export class TodoUtils {
  /**
   * 复制文本到剪贴板
   */
  static copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
    }
    
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return Promise.resolve()
  }

  /**
   * 格式化日期
   */
  static formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

  /**
   * 生成唯一ID
   */
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }

  /**
   * 防抖函数
   */
  static debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
} 