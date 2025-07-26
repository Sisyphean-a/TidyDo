import { get, set } from 'idb-keyval'
import { generateId } from '@/utils/idGenerator'
import { withErrorHandling, ErrorTypes } from '@/utils/errorHandler'

// 数据存储键定义
export const SIMPLE_TODO_ITEMS_KEY = 'simple-todo-items'

/**
 * 创建简单Todo项数据结构
 * @param {string} id - Todo项ID
 * @param {string} categoryId - 所属分类ID
 * @param {string} title - 标题
 * @param {string} status - 状态：'todo' | 'doing' | 'done' | 'paused'
 * @returns {Object} 简单Todo项对象
 */
export const createSimpleTodoItem = (
  id,
  categoryId,
  title,
  status = 'todo'
) => ({
  id,
  categoryId,
  title,
  status, // todo, doing, done, paused
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

/**
 * 简单Todo项服务类
 * 负责简单Todo项数据的CRUD操作和持久化存储
 */
export class SimpleTodoService {
  /**
   * 获取所有简单Todo项
   * @returns {Promise<Array>} 简单Todo项列表
   */
  static getAll = withErrorHandling(async () => {
    const items = (await get(SIMPLE_TODO_ITEMS_KEY)) || []
    return items
  }, '获取简单Todo项列表', ErrorTypes.STORAGE)

  /**
   * 根据分类ID获取简单Todo项
   * @param {string} categoryId - 分类ID
   * @returns {Promise<Array>} 该分类下的简单Todo项列表
   */
  static async getByCategoryId(categoryId) {
    const items = await this.getAll()
    return items.filter((item) => item.categoryId === categoryId)
  }

  /**
   * 根据ID获取简单Todo项
   * @param {string} id - Todo项ID
   * @returns {Promise<Object|undefined>} 简单Todo项对象
   */
  static async getById(id) {
    const items = await this.getAll()
    return items.find((item) => item.id === id)
  }

  /**
   * 保存简单Todo项
   * @param {Object} item - 简单Todo项对象
   * @returns {Promise<Object>} 保存后的简单Todo项对象
   */
  static save = withErrorHandling(async (item) => {
    const items = await this.getAll()
    const existingIndex = items.findIndex((i) => i.id === item.id)

    // 确保数据能被正确序列化
    const sanitizedItem = {
      id: item.id,
      categoryId: item.categoryId,
      title: item.title || '',
      status: item.status || 'todo',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      items[existingIndex] = sanitizedItem
    } else {
      items.push(sanitizedItem)
    }

    await set(SIMPLE_TODO_ITEMS_KEY, items)
    return sanitizedItem
  }, '保存简单Todo项', ErrorTypes.STORAGE)

  /**
   * 删除简单Todo项
   * @param {string} id - Todo项ID
   * @returns {Promise<void>}
   */
  static delete = withErrorHandling(async (id) => {
    const items = await this.getAll()
    const filtered = items.filter((item) => item.id !== id)
    await set(SIMPLE_TODO_ITEMS_KEY, filtered)
  }, '删除简单Todo项', ErrorTypes.STORAGE)

  /**
   * 根据分类ID删除所有简单Todo项
   * @param {string} categoryId - 分类ID
   * @returns {Promise<void>}
   */
  static deleteByCategoryId = withErrorHandling(async (categoryId) => {
    const items = await this.getAll()
    const filtered = items.filter((item) => item.categoryId !== categoryId)
    await set(SIMPLE_TODO_ITEMS_KEY, filtered)
  }, '删除分类下的简单Todo项', ErrorTypes.STORAGE)

  /**
   * 更新简单Todo项状态
   * @param {string} id - Todo项ID
   * @param {string} newStatus - 新状态
   * @returns {Promise<Object>} 更新后的简单Todo项对象
   */
  static updateStatus = withErrorHandling(async (id, newStatus) => {
    const item = await this.getById(id)
    if (!item) {
      throw new Error('简单Todo项不存在')
    }

    const updatedItem = {
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }

    return await this.save(updatedItem)
  }, '更新简单Todo项状态', ErrorTypes.STORAGE)

  /**
   * 批量更新简单Todo项状态
   * @param {Array<{id: string, status: string}>} updates - 更新列表
   * @returns {Promise<Array>} 更新后的简单Todo项列表
   */
  static batchUpdateStatus = withErrorHandling(async (updates) => {
    const items = await this.getAll()
    const updateMap = new Map(updates.map(u => [u.id, u.status]))
    
    const updatedItems = items.map(item => {
      if (updateMap.has(item.id)) {
        return {
          ...item,
          status: updateMap.get(item.id),
          updatedAt: new Date().toISOString(),
        }
      }
      return item
    })

    await set(SIMPLE_TODO_ITEMS_KEY, updatedItems)
    return updatedItems.filter(item => updateMap.has(item.id))
  }, '批量更新简单Todo项状态', ErrorTypes.STORAGE)

  /**
   * 生成唯一ID
   * @returns {string} 生成的唯一ID
   */
  static generateId() {
    return generateId()
  }
}

/**
 * 简单Todo状态定义
 */
export const SIMPLE_TODO_STATUSES = {
  TODO: 'todo',
  DOING: 'doing', 
  DONE: 'done',
  PAUSED: 'paused'
}

/**
 * 简单Todo状态配置
 */
export const SIMPLE_TODO_STATUS_CONFIG = {
  [SIMPLE_TODO_STATUSES.TODO]: {
    label: '待办',
    color: '#E3F2FD',
    textColor: '#1976D2',
    icon: 'mdi-clipboard-text-outline'
  },
  [SIMPLE_TODO_STATUSES.DOING]: {
    label: '进行中',
    color: '#FFF3E0',
    textColor: '#F57C00',
    icon: 'mdi-clock-outline'
  },
  [SIMPLE_TODO_STATUSES.DONE]: {
    label: '已完成',
    color: '#E8F5E8',
    textColor: '#388E3C',
    icon: 'mdi-check-circle-outline'
  },
  [SIMPLE_TODO_STATUSES.PAUSED]: {
    label: '暂停',
    color: '#F5F5F5',
    textColor: '#757575',
    icon: 'mdi-pause-circle-outline'
  }
}

/**
 * 获取状态配置
 * @param {string} status - 状态值
 * @returns {Object} 状态配置对象
 */
export const getSimpleTodoStatusConfig = (status) => {
  return SIMPLE_TODO_STATUS_CONFIG[status] || SIMPLE_TODO_STATUS_CONFIG[SIMPLE_TODO_STATUSES.TODO]
}
