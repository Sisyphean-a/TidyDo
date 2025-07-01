import { get, set, del, keys } from 'idb-keyval'

// 数据结构设计
export const TODO_CATEGORIES_KEY = 'todo-categories'
export const TODO_ITEMS_KEY = 'todo-items'

// 分类数据结构
export const createCategory = (id, name, icon = 'mdi-folder', isExpanded = true) => ({
  id,
  name,
  icon,
  isExpanded,
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
    return categories
  }

  static async getById(id) {
    const categories = await this.getAll()
    return categories.find((cat) => cat.id === id)
  }

  static async save(category) {
    const categories = await this.getAll()
    const existingIndex = categories.findIndex((cat) => cat.id === category.id)

    if (existingIndex >= 0) {
      categories[existingIndex] = { ...category, updatedAt: new Date().toISOString() }
    } else {
      categories.push(category)
    }

    await set(TODO_CATEGORIES_KEY, categories)
    return category
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
    )
    await CategoryService.save(defaultCategory)
  }
}
