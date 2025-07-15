import { get, set, del, keys } from 'idb-keyval'

// 数据结构设计
export const TODO_CATEGORIES_KEY = 'todo-categories'
export const TODO_ITEMS_KEY = 'todo-items'

// 分类数据结构
export const createCategory = (id, name, icon = 'mdi-folder', isExpanded = true, isFilterCategory = false, filterConditions = null, order = 0) => ({
  id,
  name,
  icon,
  isExpanded,
  isFilterCategory, // 是否为筛选类
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

// Todo项数据结构（设计为可扩展）
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

// 分类服务
export class CategoryService {
  static async getAll() {
    const categories = (await get(TODO_CATEGORIES_KEY)) || []
    // 按 order 字段排序，如果没有 order 字段则按创建时间排序
    return categories.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  }

  static async getById(id) {
    const categories = await this.getAll()
    return categories.find((cat) => cat.id === id)
  }

  static async save(category) {
    const categories = await this.getAll()
    const existingIndex = categories.findIndex((cat) => cat.id === category.id)

    // 确保分类数据可序列化
    const sanitizedCategory = {
      id: category.id,
      name: category.name,
      icon: category.icon || 'mdi-folder',
      isExpanded: category.isExpanded !== undefined ? category.isExpanded : true,
      isFilterCategory: category.isFilterCategory || false,
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
  }

  static async delete(id) {
    const categories = await this.getAll()
    const filtered = categories.filter((cat) => cat.id !== id)
    await set(TODO_CATEGORIES_KEY, filtered)

    // 同时删除该分类下的所有todo项
    await TodoItemService.deleteByCategoryId(id)
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
}

// Todo项服务
export class TodoItemService {
  static async getAll() {
    const items = (await get(TODO_ITEMS_KEY)) || []
    return items
  }

  static async getByCategoryId(categoryId) {
    const items = await this.getAll()
    return items.filter((item) => item.categoryId === categoryId)
  }

  static async getById(id) {
    const items = await this.getAll()
    return items.find((item) => item.id === id)
  }

  static async save(item) {
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
  }

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

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }
}

// 初始化默认数据
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
