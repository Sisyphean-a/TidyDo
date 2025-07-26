import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { 
  SimpleTodoService, 
  createSimpleTodoItem,
  SIMPLE_TODO_STATUSES 
} from '@/services/simpleTodoService'

export const useSimpleTodosStore = defineStore('simpleTodos', () => {
  // 状态
  const simpleTodos = ref([])
  const isLoading = ref(false)

  // Getters (计算属性)
  const allSimpleTodos = computed(() => simpleTodos.value)

  const totalSimpleTodosCount = computed(() => simpleTodos.value.length)

  // 根据分类ID获取简单Todo项
  const getSimpleTodosByCategoryId = computed(() => (categoryId) => {
    return simpleTodos.value.filter((todo) => todo.categoryId === categoryId)
  })

  // 根据分类ID和状态获取简单Todo项
  const getSimpleTodosByCategoryAndStatus = computed(() => (categoryId, status) => {
    return simpleTodos.value.filter((todo) => 
      todo.categoryId === categoryId && todo.status === status
    )
  })

  // 根据分类ID获取各状态的简单Todo数量统计
  const getSimpleTodoCountsByCategoryId = computed(() => (categoryId) => {
    const categoryTodos = simpleTodos.value.filter((todo) => todo.categoryId === categoryId)
    
    return {
      [SIMPLE_TODO_STATUSES.TODO]: categoryTodos.filter(t => t.status === SIMPLE_TODO_STATUSES.TODO).length,
      [SIMPLE_TODO_STATUSES.DOING]: categoryTodos.filter(t => t.status === SIMPLE_TODO_STATUSES.DOING).length,
      [SIMPLE_TODO_STATUSES.DONE]: categoryTodos.filter(t => t.status === SIMPLE_TODO_STATUSES.DONE).length,
      [SIMPLE_TODO_STATUSES.PAUSED]: categoryTodos.filter(t => t.status === SIMPLE_TODO_STATUSES.PAUSED).length,
      total: categoryTodos.length
    }
  })

  // 所有分类的简单Todo数量统计
  const simpleTodoCounts = computed(() => {
    const counts = {}
    
    simpleTodos.value.forEach((todo) => {
      if (!counts[todo.categoryId]) {
        counts[todo.categoryId] = {
          [SIMPLE_TODO_STATUSES.TODO]: 0,
          [SIMPLE_TODO_STATUSES.DOING]: 0,
          [SIMPLE_TODO_STATUSES.DONE]: 0,
          [SIMPLE_TODO_STATUSES.PAUSED]: 0,
          total: 0
        }
      }
      
      counts[todo.categoryId][todo.status]++
      counts[todo.categoryId].total++
    })
    
    return counts
  })

  // Actions (方法)

  // 加载简单Todo数据
  const loadSimpleTodos = async () => {
    try {
      isLoading.value = true
      const data = await SimpleTodoService.getAll()
      simpleTodos.value = data
    } catch (error) {
      console.error('Load simple todos error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 创建简单Todo项
  const createSimpleTodo = async (todoData) => {
    try {
      const newItem = createSimpleTodoItem(
        SimpleTodoService.generateId(),
        todoData.categoryId,
        todoData.title,
        todoData.status || SIMPLE_TODO_STATUSES.TODO
      )

      const savedItem = await SimpleTodoService.save(newItem)
      await loadSimpleTodos()
      return savedItem
    } catch (error) {
      console.error('Create simple todo error:', error)
      throw error
    }
  }

  // 更新简单Todo项
  const updateSimpleTodo = async (todoData) => {
    try {
      const savedItem = await SimpleTodoService.save(todoData)
      await loadSimpleTodos()
      return savedItem
    } catch (error) {
      console.error('Update simple todo error:', error)
      throw error
    }
  }

  // 更新简单Todo项状态
  const updateSimpleTodoStatus = async (todoId, newStatus) => {
    try {
      const updatedItem = await SimpleTodoService.updateStatus(todoId, newStatus)
      await loadSimpleTodos()
      return updatedItem
    } catch (error) {
      console.error('Update simple todo status error:', error)
      throw error
    }
  }

  // 批量更新简单Todo项状态（用于拖拽操作）
  const batchUpdateSimpleTodoStatus = async (updates) => {
    try {
      const updatedItems = await SimpleTodoService.batchUpdateStatus(updates)
      await loadSimpleTodos()
      return updatedItems
    } catch (error) {
      console.error('Batch update simple todo status error:', error)
      throw error
    }
  }

  // 删除简单Todo项
  const deleteSimpleTodo = async (todoId) => {
    try {
      await SimpleTodoService.delete(todoId)
      await loadSimpleTodos()
    } catch (error) {
      console.error('Delete simple todo error:', error)
      throw error
    }
  }

  // 根据分类ID删除所有简单Todo项
  const deleteSimpleTodosByCategoryId = async (categoryId) => {
    try {
      await SimpleTodoService.deleteByCategoryId(categoryId)
      await loadSimpleTodos()
    } catch (error) {
      console.error('Delete simple todos by category error:', error)
      throw error
    }
  }

  // 重置状态
  const resetState = () => {
    simpleTodos.value = []
    isLoading.value = false
  }

  return {
    // 状态
    simpleTodos,
    isLoading,
    
    // 计算属性
    allSimpleTodos,
    totalSimpleTodosCount,
    getSimpleTodosByCategoryId,
    getSimpleTodosByCategoryAndStatus,
    getSimpleTodoCountsByCategoryId,
    simpleTodoCounts,
    
    // 方法
    loadSimpleTodos,
    createSimpleTodo,
    updateSimpleTodo,
    updateSimpleTodoStatus,
    batchUpdateSimpleTodoStatus,
    deleteSimpleTodo,
    deleteSimpleTodosByCategoryId,
    resetState
  }
})
