import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { TodoItemService, createTodoItem } from '@/services/todoService'

export const useTodosStore = defineStore('todos', () => {
  // 状态
  const todos = ref([])
  const isLoading = ref(false)
  const showArchived = ref(false) // 是否显示已归档的项目

  // Getters (计算属性)
  const allTodos = computed(() => todos.value)

  const activeTodos = computed(() => todos.value.filter((todo) => !todo.archived))

  const archivedTodos = computed(() => todos.value.filter((todo) => todo.archived))

  const totalTodosCount = computed(() => activeTodos.value.length)

  // 根据分类ID获取待办事项（根据 showArchived 状态过滤）
  const getTodosByCategoryId = computed(() => (categoryId) => {
    return todos.value.filter((todo) => {
      const matchCategory = todo.categoryId === categoryId
      const matchArchiveStatus = showArchived.value || !todo.archived
      return matchCategory && matchArchiveStatus
    })
  })

  // 计算分类下的待办事项数量（只统计未归档的）
  const todoCounts = computed(() => {
    const counts = {}
    activeTodos.value.forEach((todo) => {
      counts[todo.categoryId] = (counts[todo.categoryId] || 0) + 1
    })
    return counts
  })

  // Actions (方法)

  // 加载所有待办事项
  const loadTodos = async () => {
    try {
      isLoading.value = true
      todos.value = await TodoItemService.getAll()
      return todos.value
    } catch (error) {
      console.error('Load todos error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 创建待办事项
  const createTodo = async (todoData) => {
    try {
      const newItem = createTodoItem(
        TodoItemService.generateId(),
        todoData.categoryId,
        todoData.title,
        todoData.customNumber,
        todoData.description,
        todoData.priority,
        todoData.status,
      )

      // 合并其他字段
      Object.assign(newItem, {
        tags: Array.isArray(todoData.tags) ? [...todoData.tags] : [],
        endDate: todoData.endDate,
        assignee: todoData.assignee,
        attachments: Array.isArray(todoData.attachments) ? [...todoData.attachments] : [],
      })

      const savedItem = await TodoItemService.save(newItem)
      await loadTodos()
      return savedItem
    } catch (error) {
      console.error('Create todo error:', error)
      throw error
    }
  }

  // 更新待办事项
  const updateTodo = async (todoData) => {
    try {
      const savedItem = await TodoItemService.save(todoData)
      await loadTodos()
      return savedItem
    } catch (error) {
      console.error('Update todo error:', error)
      throw error
    }
  }

  // 删除待办事项
  const deleteTodo = async (todoId) => {
    try {
      await TodoItemService.delete(todoId)
      await loadTodos()
      return true
    } catch (error) {
      console.error('Delete todo error:', error)
      throw error
    }
  }

  // 更新待办事项状态
  const updateTodoStatus = async (todo, newStatus) => {
    try {
      const updatedItem = { ...todo, status: newStatus }
      await TodoItemService.save(updatedItem)
      await loadTodos()
      return updatedItem
    } catch (error) {
      console.error('Update todo status error:', error)
      throw error
    }
  }

  // 切换待办事项的归档状态
  const toggleTodoArchived = async (todo) => {
    try {
      const updatedItem = { ...todo, archived: !todo.archived }
      await TodoItemService.save(updatedItem)
      await loadTodos()
      return updatedItem
    } catch (error) {
      console.error('Toggle todo archived error:', error)
      throw error
    }
  }

  // 切换显示归档状态
  const toggleShowArchived = () => {
    showArchived.value = !showArchived.value
  }

  // 重置状态
  const resetState = () => {
    todos.value = []
    isLoading.value = false
    showArchived.value = false
  }

  return {
    // 状态
    todos: allTodos,
    isLoading,
    showArchived,

    // Getters
    activeTodos,
    archivedTodos,
    totalTodosCount,
    getTodosByCategoryId,
    todoCounts,

    // Actions
    loadTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    updateTodoStatus,
    toggleTodoArchived,
    toggleShowArchived,
    resetState,
  }
})
