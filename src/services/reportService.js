/**
 * 报表数据服务
 * 提供数据统计分析功能，包括项目数量、状态分布、时间趋势等统计逻辑
 */

import { TodoItemService, CategoryService } from './todoService'
import { SimpleTodoService } from './simpleTodoService'
import { withErrorHandling, ErrorTypes } from '@/utils/errorHandler'

/**
 * 报表数据服务类
 */
export class ReportService {
  /**
   * 获取项目数量统计
   * @returns {Promise<Object>} 项目数量统计数据
   */
  static getProjectCountStats = withErrorHandling(async () => {
    const [todos, simpleTodos, categories] = await Promise.all([
      TodoItemService.getAll(),
      SimpleTodoService.getAll(),
      CategoryService.getAll()
    ])

    // 过滤活跃项目（未归档）
    const activeTodos = todos.filter(todo => !todo.archived)
    
    // 按分类统计普通Todo
    const todosByCategory = {}
    activeTodos.forEach(todo => {
      if (!todosByCategory[todo.categoryId]) {
        todosByCategory[todo.categoryId] = 0
      }
      todosByCategory[todo.categoryId]++
    })

    // 按分类统计简单Todo
    const simpleTodosByCategory = {}
    simpleTodos.forEach(todo => {
      if (!simpleTodosByCategory[todo.categoryId]) {
        simpleTodosByCategory[todo.categoryId] = 0
      }
      simpleTodosByCategory[todo.categoryId]++
    })

    // 获取分类信息
    const categoryMap = {}
    categories.forEach(cat => {
      categoryMap[cat.id] = cat
    })

    // 构建分类统计数据
    const categoryStats = categories.map(category => {
      const todoCount = todosByCategory[category.id] || 0
      const simpleTodoCount = simpleTodosByCategory[category.id] || 0
      
      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        isSimpleTodo: category.isSimpleTodo,
        isFilterCategory: category.isFilterCategory,
        todoCount,
        simpleTodoCount,
        totalCount: todoCount + simpleTodoCount
      }
    })

    return {
      totalTodos: activeTodos.length,
      totalSimpleTodos: simpleTodos.length,
      totalProjects: activeTodos.length + simpleTodos.length,
      totalCategories: categories.length,
      regularCategories: categories.filter(cat => !cat.isFilterCategory && !cat.isSimpleTodo).length,
      filterCategories: categories.filter(cat => cat.isFilterCategory).length,
      simpleTodoCategories: categories.filter(cat => cat.isSimpleTodo).length,
      categoryStats,
      archivedTodos: todos.filter(todo => todo.archived).length
    }
  }, '获取项目数量统计', ErrorTypes.BUSINESS)

  /**
   * 获取状态分布统计
   * @returns {Promise<Object>} 状态分布统计数据
   */
  static getStatusDistributionStats = withErrorHandling(async () => {
    const [todos, simpleTodos] = await Promise.all([
      TodoItemService.getAll(),
      SimpleTodoService.getAll()
    ])

    // 普通Todo状态统计
    const todoStatusStats = {}
    const activeTodos = todos.filter(todo => !todo.archived)
    
    activeTodos.forEach(todo => {
      const status = todo.status || 'pending'
      todoStatusStats[status] = (todoStatusStats[status] || 0) + 1
    })

    // 简单Todo状态统计
    const simpleTodoStatusStats = {}
    simpleTodos.forEach(todo => {
      const status = todo.status || 'todo'
      simpleTodoStatusStats[status] = (simpleTodoStatusStats[status] || 0) + 1
    })

    return {
      todoStatusStats,
      simpleTodoStatusStats,
      totalActiveTodos: activeTodos.length,
      totalSimpleTodos: simpleTodos.length
    }
  }, '获取状态分布统计', ErrorTypes.BUSINESS)

  /**
   * 获取完成情况统计
   * @returns {Promise<Object>} 完成情况统计数据
   */
  static getCompletionStats = withErrorHandling(async () => {
    const [todos, simpleTodos] = await Promise.all([
      TodoItemService.getAll(),
      SimpleTodoService.getAll()
    ])

    const activeTodos = todos.filter(todo => !todo.archived)
    
    // 普通Todo完成统计
    const completedTodos = activeTodos.filter(todo => todo.status === 'completed').length
    const todoCompletionRate = activeTodos.length > 0 ? (completedTodos / activeTodos.length) * 100 : 0

    // 简单Todo完成统计
    const completedSimpleTodos = simpleTodos.filter(todo => todo.status === 'done').length
    const simpleTodoCompletionRate = simpleTodos.length > 0 ? (completedSimpleTodos / simpleTodos.length) * 100 : 0

    // 总体完成率
    const totalProjects = activeTodos.length + simpleTodos.length
    const totalCompleted = completedTodos + completedSimpleTodos
    const overallCompletionRate = totalProjects > 0 ? (totalCompleted / totalProjects) * 100 : 0

    return {
      todoStats: {
        total: activeTodos.length,
        completed: completedTodos,
        completionRate: todoCompletionRate
      },
      simpleTodoStats: {
        total: simpleTodos.length,
        completed: completedSimpleTodos,
        completionRate: simpleTodoCompletionRate
      },
      overallStats: {
        total: totalProjects,
        completed: totalCompleted,
        completionRate: overallCompletionRate
      },
      archivedCount: todos.filter(todo => todo.archived).length
    }
  }, '获取完成情况统计', ErrorTypes.BUSINESS)

  /**
   * 获取时间趋势统计
   * @param {number} days - 统计天数，默认30天
   * @returns {Promise<Object>} 时间趋势统计数据
   */
  static getTimeTrendStats = withErrorHandling(async (days = 30) => {
    const [todos, simpleTodos] = await Promise.all([
      TodoItemService.getAll(),
      SimpleTodoService.getAll()
    ])

    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // 生成日期范围
    const dateRange = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      dateRange.push(date.toISOString().split('T')[0])
    }

    // 统计每日创建的项目数量
    const dailyCreated = {}
    const dailyCompleted = {}

    // 初始化日期数据
    dateRange.forEach(date => {
      dailyCreated[date] = { todos: 0, simpleTodos: 0, total: 0 }
      dailyCompleted[date] = { todos: 0, simpleTodos: 0, total: 0 }
    })

    // 统计普通Todo创建和完成趋势
    todos.forEach(todo => {
      const createdDate = new Date(todo.createdAt).toISOString().split('T')[0]
      if (dailyCreated[createdDate]) {
        dailyCreated[createdDate].todos++
        dailyCreated[createdDate].total++
      }

      // 统计完成趋势（如果有完成时间）
      if (todo.status === 'completed' && todo.updatedAt) {
        const completedDate = new Date(todo.updatedAt).toISOString().split('T')[0]
        if (dailyCompleted[completedDate]) {
          dailyCompleted[completedDate].todos++
          dailyCompleted[completedDate].total++
        }
      }
    })

    // 统计简单Todo创建和完成趋势
    simpleTodos.forEach(todo => {
      const createdDate = new Date(todo.createdAt).toISOString().split('T')[0]
      if (dailyCreated[createdDate]) {
        dailyCreated[createdDate].simpleTodos++
        dailyCreated[createdDate].total++
      }

      // 统计完成趋势
      if (todo.status === 'done' && todo.updatedAt) {
        const completedDate = new Date(todo.updatedAt).toISOString().split('T')[0]
        if (dailyCompleted[completedDate]) {
          dailyCompleted[completedDate].simpleTodos++
          dailyCompleted[completedDate].total++
        }
      }
    })

    return {
      dateRange,
      dailyCreated,
      dailyCompleted,
      period: days
    }
  }, '获取时间趋势统计', ErrorTypes.BUSINESS)

  /**
   * 获取优先级分布统计
   * @returns {Promise<Object>} 优先级分布统计数据
   */
  static getPriorityDistributionStats = withErrorHandling(async () => {
    const todos = await TodoItemService.getAll()
    const activeTodos = todos.filter(todo => !todo.archived)

    const priorityStats = {}
    activeTodos.forEach(todo => {
      const priority = todo.priority || 'medium'
      priorityStats[priority] = (priorityStats[priority] || 0) + 1
    })

    return {
      priorityStats,
      totalTodos: activeTodos.length
    }
  }, '获取优先级分布统计', ErrorTypes.BUSINESS)

  /**
   * 获取综合报表数据
   * @param {Object} options - 选项参数
   * @returns {Promise<Object>} 综合报表数据
   */
  static getComprehensiveReport = withErrorHandling(async (options = {}) => {
    const { trendDays = 30 } = options

    const [
      projectCountStats,
      statusDistributionStats,
      completionStats,
      timeTrendStats,
      priorityDistributionStats
    ] = await Promise.all([
      ReportService.getProjectCountStats(),
      ReportService.getStatusDistributionStats(),
      ReportService.getCompletionStats(),
      ReportService.getTimeTrendStats(trendDays),
      ReportService.getPriorityDistributionStats()
    ])

    return {
      projectCount: projectCountStats,
      statusDistribution: statusDistributionStats,
      completion: completionStats,
      timeTrend: timeTrendStats,
      priorityDistribution: priorityDistributionStats,
      generatedAt: new Date().toISOString()
    }
  }, '获取综合报表数据', ErrorTypes.BUSINESS)
}
