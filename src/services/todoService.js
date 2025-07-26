import { get, set, del, keys } from 'idb-keyval'
import { generateId } from '@/utils/idGenerator'
import { withErrorHandling, ErrorTypes } from '@/utils/errorHandler'

// 数据结构设计
export const TODO_CATEGORIES_KEY = 'todo-categories'
export const TODO_ITEMS_KEY = 'todo-items'

/**
 * 创建分类数据结构
 * @param {string} id - 分类ID
 * @param {string} name - 分类名称
 * @param {string} icon - 分类图标，默认为'mdi-folder'
 * @param {boolean} isExpanded - 是否展开，默认为true
 * @param {boolean} isFilterCategory - 是否为筛选类，默认为false
 * @param {boolean} isSimpleTodo - 是否为简单Todo大类，默认为false
 * @param {Object|null} filterConditions - 筛选条件，默认为null
 * @param {number} order - 排序值，默认为0
 * @returns {Object} 分类对象
 */
export const createCategory = (id, name, icon = 'mdi-folder', isExpanded = true, isFilterCategory = false, isSimpleTodo = false, filterConditions = null, order = 0) => ({
  id,
  name,
  icon,
  isExpanded,
  isFilterCategory, // 是否为筛选类
  isSimpleTodo, // 是否为简单Todo大类
  order, // 排序字段
  filterConditions: filterConditions || {
    endDateFrom: null,
    endDateTo: null,
    statuses: [],
    categories: [],
    tags: [],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

/**
 * 创建Todo项数据结构（设计为可扩展）
 * @param {string} id - Todo项ID
 * @param {string} categoryId - 所属分类ID
 * @param {string} title - 标题
 * @param {string} customNumber - 用户自定义编号，默认为空字符串
 * @param {string} description - 描述，默认为空字符串
 * @param {string} priority - 优先级（low, medium, high），默认为'medium'
 * @param {string} status - 状态（pending, completed, cancelled），默认为'pending'
 * @returns {Object} Todo项对象
 */
export const createTodoItem = (
  id,
  categoryId,
  title,
  customNumber = '',
  description = '',
  priority = 'medium',
  status = 'pending',
) => ({
  id,
  categoryId,
  title,
  customNumber, // 用户自定义编号
  description,
  priority, // low, medium, high
  status, // pending, completed, cancelled
  tags: [], // 扩展字段：标签
  endDate: null, // 扩展字段：结束日期（必填）
  assignee: null, // 扩展字段：分配人
  attachments: [], // 扩展字段：附件
  archived: false, // 扩展字段：是否归档
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

/**
 * 分类服务类
 * 负责分类数据的CRUD操作和持久化存储
 */
export class CategoryService {
  static getAll = withErrorHandling(async () => {
    const categories = (await get(TODO_CATEGORIES_KEY)) || []
    // 按 order 字段排序，如果没有 order 字段则按创建时间排序
    return categories.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  }, '获取分类列表', ErrorTypes.STORAGE)

  static async getById(id) {
    const categories = await this.getAll()
    return categories.find((cat) => cat.id === id)
  }

  static save = withErrorHandling(async (category) => {
    const categories = await this.getAll()
    const existingIndex = categories.findIndex((cat) => cat.id === category.id)

    // 确保分类数据可序列化
    const sanitizedCategory = {
      id: category.id,
      name: category.name,
      icon: category.icon || 'mdi-folder',
      isExpanded: category.isExpanded !== undefined ? category.isExpanded : true,
      isFilterCategory: category.isFilterCategory || false,
      isSimpleTodo: category.isSimpleTodo || false,
      order: category.order !== undefined ? category.order : 0,
      filterConditions: category.filterConditions ? {
        endDateFrom: category.filterConditions.endDateFrom || null,
        endDateTo: category.filterConditions.endDateTo || null,
        statuses: Array.isArray(category.filterConditions.statuses) ? [...category.filterConditions.statuses] : [],
        categories: Array.isArray(category.filterConditions.categories) ? [...category.filterConditions.categories] : [],
        tags: Array.isArray(category.filterConditions.tags) ? [...category.filterConditions.tags] : [],
      } : {
        endDateFrom: null,
        endDateTo: null,
        statuses: [],
        categories: [],
        tags: [],
      },
      createdAt: category.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      categories[existingIndex] = sanitizedCategory
    } else {
      categories.push(sanitizedCategory)
    }

    await set(TODO_CATEGORIES_KEY, categories)
    return sanitizedCategory
  }, '保存分类', ErrorTypes.STORAGE)

  static async delete(id) {
    const categories = await this.getAll()
    const categoryToDelete = categories.find((cat) => cat.id === id)
    const filtered = categories.filter((cat) => cat.id !== id)
    await set(TODO_CATEGORIES_KEY, filtered)

    // 根据分类类型删除相应的todo项
    if (categoryToDelete?.isSimpleTodo) {
      // 删除简单Todo项
      const { SimpleTodoService } = await import('./simpleTodoService')
      await SimpleTodoService.deleteByCategoryId(id)
    } else {
      // 删除普通Todo项
      await TodoItemService.deleteByCategoryId(id)
    }
  }

  static async updateExpanded(id, isExpanded) {
    const categories = await this.getAll()
    const category = categories.find((cat) => cat.id === id)
    if (category) {
      category.isExpanded = isExpanded
      category.updatedAt = new Date().toISOString()
      await set(TODO_CATEGORIES_KEY, categories)
    }
  }

  // 更新分类排序
  static async updateOrder(categoryId, direction) {
    const categories = await get(TODO_CATEGORIES_KEY) || []
    const currentIndex = categories.findIndex((cat) => cat.id === categoryId)

    if (currentIndex === -1) return false

    let targetIndex
    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1
    } else if (direction === 'down' && currentIndex < categories.length - 1) {
      targetIndex = currentIndex + 1
    } else {
      return false // 无法移动
    }

    // 交换位置
    [categories[currentIndex], categories[targetIndex]] = [categories[targetIndex], categories[currentIndex]]

    // 更新 order 字段
    categories.forEach((cat, index) => {
      cat.order = index
      cat.updatedAt = new Date().toISOString()
    })

    await set(TODO_CATEGORIES_KEY, categories)
    return true
  }

  // 拖拽排序 - 将分类移动到指定位置
  static async reorderByDrag(categoryId, targetIndex) {
    const categories = await get(TODO_CATEGORIES_KEY) || []
    const currentIndex = categories.findIndex((cat) => cat.id === categoryId)

    // 修复边界检查：允许 targetIndex 等于 categories.length（插入到末尾）
    if (currentIndex === -1 || targetIndex < 0 || targetIndex > categories.length) {
      return false
    }

    if (currentIndex === targetIndex) {
      return true // 位置没有变化
    }

    // 移除当前项
    const [movedCategory] = categories.splice(currentIndex, 1)

    // 插入到目标位置
    // 注意：移除元素后，如果 targetIndex > currentIndex，需要调整索引
    const adjustedTargetIndex = targetIndex > currentIndex ? targetIndex - 1 : targetIndex
    categories.splice(adjustedTargetIndex, 0, movedCategory)

    // 更新所有分类的 order 字段
    categories.forEach((cat, index) => {
      cat.order = index
      cat.updatedAt = new Date().toISOString()
    })

    await set(TODO_CATEGORIES_KEY, categories)
    return true
  }
}

/**
 * Todo项服务类
 * 负责待办事项数据的CRUD操作和持久化存储
 */
export class TodoItemService {
  static getAll = withErrorHandling(async () => {
    const items = (await get(TODO_ITEMS_KEY)) || []
    return items
  }, '获取待办事项列表', ErrorTypes.STORAGE)

  static async getByCategoryId(categoryId) {
    const items = await this.getAll()
    return items.filter((item) => item.categoryId === categoryId)
  }

  static async getById(id) {
    const items = await this.getAll()
    return items.find((item) => item.id === id)
  }

  static save = withErrorHandling(async (item) => {
    const items = await this.getAll()
    const existingIndex = items.findIndex((i) => i.id === item.id)

    // 确保数据能被正确序列化
    const sanitizedItem = {
      ...item,
      tags: Array.isArray(item.tags) ? [...item.tags] : [],
      attachments: Array.isArray(item.attachments) ? [...item.attachments] : [],
      updatedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      items[existingIndex] = sanitizedItem
    } else {
      items.push(sanitizedItem)
    }

    await set(TODO_ITEMS_KEY, items)
    return sanitizedItem
  }, '保存待办事项', ErrorTypes.STORAGE)

  static async delete(id) {
    const items = await this.getAll()
    const filtered = items.filter((item) => item.id !== id)
    await set(TODO_ITEMS_KEY, filtered)
  }

  static async deleteByCategoryId(categoryId) {
    const items = await this.getAll()
    const filtered = items.filter((item) => item.categoryId !== categoryId)
    await set(TODO_ITEMS_KEY, filtered)
  }

  /**
   * 生成唯一ID
   * @returns {string} 生成的唯一ID
   */
  static generateId() {
    return generateId()
  }
}

/**
 * 初始化默认数据
 * 如果没有分类数据，创建默认分类
 * @returns {Promise<void>}
 */
export const initializeDefaultData = async () => {
  const categories = await CategoryService.getAll()
  if (categories.length === 0) {
    // 创建默认分类
    const defaultCategory = createCategory(
      TodoItemService.generateId(),
      '默认分类',
      'mdi-folder-outline',
      true, // isExpanded
      false, // isFilterCategory
      null, // filterConditions
      0 // order
    )
    await CategoryService.save(defaultCategory)
  }
}
