import { ref, computed } from 'vue'
import { TodoItemService, CategoryService } from '@/services/todoService'

// 全局状态
const todos = ref([])
const categories = ref([])
const isLoading = ref(false)

// 视图状态
const viewState = ref({
  selectedCategoryId: null,
  viewMode: 'table', // table, card, grid
  showArchived: false,
  sortConfig: { field: 'endDate', order: 'asc' },
  filterConfig: {},
  sidebarCollapsed: false,
})

// UI状态
const uiState = ref({
  selectedTodos: [],
  editingTodo: null,
  editingCategory: null,
  showEditDialog: false,
  showCategoryDialog: false,
  showSettingsDialog: false,
})

/**
 * Todo状态管理
 */
export function useTodoStore() {
  // 计算属性
  const selectedCategory = computed(() => {
    if (!viewState.value.selectedCategoryId) return null
    return categories.value.find(cat => cat.id === viewState.value.selectedCategoryId)
  })

  const todoCounts = computed(() => {
    const counts = {}
    todos.value
      .filter(todo => !todo.archived)
      .forEach(todo => {
        counts[todo.categoryId] = (counts[todo.categoryId] || 0) + 1
      })
    return counts
  })

  const filteredTodos = computed(() => {
    let result = todos.value

    // 归档过滤
    if (!viewState.value.showArchived) {
      result = result.filter(todo => !todo.archived)
    }

    // 分类过滤
    if (viewState.value.selectedCategoryId) {
      const category = selectedCategory.value
      if (category?.isFilterCategory) {
        result = applyFilterConditions(result, category.filterConditions)
      } else {
        result = result.filter(todo => todo.categoryId === viewState.value.selectedCategoryId)
      }
    }

    // 自定义过滤
    if (viewState.value.filterConfig) {
      result = applyFilterConditions(result, viewState.value.filterConfig)
    }

    // 排序
    return applySorting(result, viewState.value.sortConfig)
  })

  // 数据操作
  const loadTodos = async () => {
    try {
      isLoading.value = true
      todos.value = await TodoItemService.getAll()
    } catch (error) {
      console.error('加载待办事项失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const loadCategories = async () => {
    try {
      categories.value = await CategoryService.getAll()
    } catch (error) {
      console.error('加载分类失败:', error)
      throw error
    }
  }

  const createTodo = async (todoData) => {
    try {
      const newTodo = await TodoItemService.save({
        ...todoData,
        id: TodoItemService.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      await loadTodos()
      return newTodo
    } catch (error) {
      console.error('创建待办事项失败:', error)
      throw error
    }
  }

  const updateTodo = async (todoData) => {
    try {
      const updatedTodo = await TodoItemService.save({
        ...todoData,
        updatedAt: new Date().toISOString(),
      })
      await loadTodos()
      return updatedTodo
    } catch (error) {
      console.error('更新待办事项失败:', error)
      throw error
    }
  }

  const deleteTodo = async (todoId) => {
    try {
      await TodoItemService.delete(todoId)
      await loadTodos()
    } catch (error) {
      console.error('删除待办事项失败:', error)
      throw error
    }
  }

  const createCategory = async (categoryData) => {
    try {
      const newCategory = await CategoryService.save({
        ...categoryData,
        id: TodoItemService.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      await loadCategories()
      return newCategory
    } catch (error) {
      console.error('创建分类失败:', error)
      throw error
    }
  }

  const updateCategory = async (categoryData) => {
    try {
      const updatedCategory = await CategoryService.save({
        ...categoryData,
        updatedAt: new Date().toISOString(),
      })
      await loadCategories()
      return updatedCategory
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  }

  const deleteCategory = async (categoryId) => {
    try {
      await CategoryService.delete(categoryId)
      await loadCategories()
      if (viewState.value.selectedCategoryId === categoryId) {
        viewState.value.selectedCategoryId = null
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }

  // 视图操作
  const setSelectedCategory = (categoryId) => {
    viewState.value.selectedCategoryId = categoryId
  }

  const setViewMode = (mode) => {
    viewState.value.viewMode = mode
  }

  const toggleArchived = () => {
    viewState.value.showArchived = !viewState.value.showArchived
  }

  const setSortConfig = (config) => {
    viewState.value.sortConfig = { ...config }
  }

  const setFilterConfig = (config) => {
    viewState.value.filterConfig = { ...config }
  }

  const toggleSidebar = () => {
    viewState.value.sidebarCollapsed = !viewState.value.sidebarCollapsed
  }

  // UI操作
  const setSelectedTodos = (todoIds) => {
    uiState.value.selectedTodos = [...todoIds]
  }

  const showEditTodoDialog = (todo = null) => {
    uiState.value.editingTodo = todo
    uiState.value.showEditDialog = true
  }

  const hideEditTodoDialog = () => {
    uiState.value.editingTodo = null
    uiState.value.showEditDialog = false
  }

  const showEditCategoryDialog = (category = null) => {
    uiState.value.editingCategory = category
    uiState.value.showCategoryDialog = true
  }

  const hideEditCategoryDialog = () => {
    uiState.value.editingCategory = null
    uiState.value.showCategoryDialog = false
  }

  const showSettingsDialog = () => {
    uiState.value.showSettingsDialog = true
  }

  const hideSettingsDialog = () => {
    uiState.value.showSettingsDialog = false
  }

  // 初始化
  const initialize = async () => {
    await Promise.all([loadTodos(), loadCategories()])
    // 如果没有选中分类且有分类，选中第一个
    if (!viewState.value.selectedCategoryId && categories.value.length > 0) {
      viewState.value.selectedCategoryId = categories.value[0].id
    }
  }

  return {
    // 状态
    todos: computed(() => todos.value),
    categories: computed(() => categories.value),
    isLoading: computed(() => isLoading.value),
    viewState: computed(() => viewState.value),
    uiState: computed(() => uiState.value),

    // 计算属性
    selectedCategory,
    todoCounts,
    filteredTodos,

    // 数据操作
    loadTodos,
    loadCategories,
    createTodo,
    updateTodo,
    deleteTodo,
    createCategory,
    updateCategory,
    deleteCategory,

    // 视图操作
    setSelectedCategory,
    setViewMode,
    toggleArchived,
    setSortConfig,
    setFilterConfig,
    toggleSidebar,

    // UI操作
    setSelectedTodos,
    showEditTodoDialog,
    hideEditTodoDialog,
    showEditCategoryDialog,
    hideEditCategoryDialog,
    showSettingsDialog,
    hideSettingsDialog,

    // 初始化
    initialize,
  }
}

// 辅助函数
function applyFilterConditions(todos, conditions) {
  if (!conditions) return todos

  return todos.filter(todo => {
    // 日期范围过滤
    if (conditions.endDateFrom || conditions.endDateTo) {
      if (!todo.endDate) return false
      const todoDate = new Date(todo.endDate)
      if (conditions.endDateFrom && todoDate < new Date(conditions.endDateFrom)) return false
      if (conditions.endDateTo && todoDate > new Date(conditions.endDateTo)) return false
    }

    // 状态过滤
    if (conditions.statuses?.length > 0) {
      if (!conditions.statuses.includes(todo.status)) return false
    }

    // 分类过滤
    if (conditions.categories?.length > 0) {
      if (!conditions.categories.includes(todo.categoryId)) return false
    }

    // 标签过滤
    if (conditions.tags?.length > 0) {
      if (!todo.tags || !todo.tags.some(tag => conditions.tags.includes(tag))) return false
    }

    return true
  })
}

function applySorting(todos, sortConfig) {
  if (!sortConfig || !sortConfig.field) return todos

  const { field, order } = sortConfig

  return [...todos].sort((a, b) => {
    let aValue = a[field]
    let bValue = b[field]

    // 特殊处理日期字段
    if (field === 'endDate') {
      if (!aValue && !bValue) return 0
      if (!aValue) return 1
      if (!bValue) return -1
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }

    // 特殊处理字符串字段
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
} 