import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useTodosStore } from './useTodosStore'
import { useCategoriesStore } from './useCategoriesStore'

export const useAppStore = defineStore('app', () => {
  // 状态
  const selectedCategoryId = ref(null)
  const viewAllMode = ref(false) // 查看全部模式
  const sortBy = ref('endDate') // 当前排序字段
  const sortOrder = ref('asc') // 排序顺序: 'asc' | 'desc'
  const searchQuery = ref('') // 搜索查询

  // Getters (计算属性)

  // 当前选中的分类
  const selectedCategory = computed(() => {
    if (!selectedCategoryId.value) return null
    const categoriesStore = useCategoriesStore()
    return categoriesStore.getCategoryById(selectedCategoryId.value)
  })

  // 当前过滤后的todos
  const currentTodos = computed(() => {
    const todosStore = useTodosStore()
    const categoriesStore = useCategoriesStore()
    let filteredTodos = []

    if (viewAllMode.value) {
      // 查看全部模式：返回所有待办事项（根据 showArchived 状态过滤）
      filteredTodos = todosStore.showArchived ? todosStore.todos : todosStore.activeTodos
    } else if (!selectedCategoryId.value) {
      filteredTodos = []
    } else {
      const category = categoriesStore.getCategoryById(selectedCategoryId.value)
      if (category?.isFilterCategory) {
        // 如果是筛选类，应用筛选条件
        const filterConditions = category.filterConditions || {}
        filteredTodos = todosStore.todos.filter((todo) => {
          // 归档状态过滤
          if (!todosStore.showArchived && todo.archived) return false

          // 截止日期范围过滤
          if (filterConditions.endDateFrom || filterConditions.endDateTo) {
            if (!todo.endDate) return false
            const todoDate = new Date(todo.endDate)
            if (filterConditions.endDateFrom && todoDate < new Date(filterConditions.endDateFrom))
              return false
            if (filterConditions.endDateTo && todoDate > new Date(filterConditions.endDateTo))
              return false
          }

          // 状态过滤
          if (filterConditions.statuses?.length > 0) {
            if (!filterConditions.statuses.includes(todo.status)) return false
          }

          // 分类过滤
          if (filterConditions.categories?.length > 0) {
            if (!filterConditions.categories.includes(todo.categoryId)) return false
          }

          // 标签过滤
          if (filterConditions.tags?.length > 0) {
            if (!todo.tags || !todo.tags.some((tag) => filterConditions.tags.includes(tag)))
              return false
          }

          return true
        })
      } else {
        // 普通分类：返回该分类下的待办事项
        filteredTodos = todosStore.getTodosByCategoryId(selectedCategoryId.value)
      }
    }

    // 应用搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase().trim()
      filteredTodos = filteredTodos.filter(
        (todo) =>
          todo.title?.toLowerCase().includes(query) ||
          todo.description?.toLowerCase().includes(query) ||
          todo.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    return filteredTodos
  })

  // 表格列配置
  const tableColumns = computed(() => {
    const isFilterOrViewAllMode = viewAllMode.value || selectedCategory.value?.isFilterCategory
    const columns = [
      { cols: 1, align: 'center', title: '编号' },
      { cols: 5, align: 'left', title: '标题' },
      { cols: 2, align: 'center', title: '截止日期' },
      { cols: isFilterOrViewAllMode ? 1 : 2, align: 'center', title: '状态' },
    ]

    // 在查看全部模式或筛选类模式下，在操作列前添加分类列
    if (isFilterOrViewAllMode) {
      columns.push({ cols: 1, align: 'center', title: '分类' })
    }

    columns.push({ cols: 2, align: 'center', title: '操作' })

    return columns
  })

  // Actions (方法)

  // 选择分类
  const selectCategory = (category) => {
    selectedCategoryId.value = category ? category.id : null
    // 如果在查看全部模式下选择了分类，退出查看全部模式
    if (viewAllMode.value && category) {
      viewAllMode.value = false
    }
    // 切换分类时清空搜索
    searchQuery.value = ''
  }

  // 处理分类更新
  const handleCategoryUpdated = (updatedCategories) => {
    // 如果没有选中分类且有分类，选中第一个
    if (!selectedCategoryId.value && updatedCategories.length > 0) {
      selectedCategoryId.value = updatedCategories[0].id
    }

    // 如果当前选中的分类不存在了，清空选择
    if (
      selectedCategoryId.value &&
      !updatedCategories.find((cat) => cat.id === selectedCategoryId.value)
    ) {
      selectedCategoryId.value = updatedCategories.length > 0 ? updatedCategories[0].id : null
    }
  }

  // 处理查看全部
  const enterViewAllMode = () => {
    viewAllMode.value = true
    selectedCategoryId.value = null // 清除分类选择
    searchQuery.value = '' // 清空搜索
  }

  // 退出查看全部模式
  const exitViewAllMode = () => {
    viewAllMode.value = false
    searchQuery.value = '' // 清空搜索
    // 选择第一个分类
    const categoriesStore = useCategoriesStore()
    if (categoriesStore.categories.length > 0) {
      selectedCategoryId.value = categoriesStore.categories[0].id
    }
  }

  // 处理排序切换
  const toggleSort = (field) => {
    if (sortBy.value === field) {
      // 切换排序顺序
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      // 更改排序字段
      sortBy.value = field
      sortOrder.value = 'asc'
    }
  }

  // 初始化：如果有分类但没有选中分类，自动选择第一个
  const initializeSelection = (categories) => {
    if (!selectedCategoryId.value && categories && categories.length > 0) {
      selectedCategoryId.value = categories[0].id
    }
  }

  // 重置应用状态
  const resetState = () => {
    selectedCategoryId.value = null
    viewAllMode.value = false
    sortBy.value = 'endDate'
    sortOrder.value = 'asc'
    searchQuery.value = ''
  }

  // 搜索功能
  const setSearchQuery = (query) => {
    searchQuery.value = query
  }

  const clearSearch = () => {
    searchQuery.value = ''
  }

  return {
    // 状态
    selectedCategoryId,
    viewAllMode,
    sortBy,
    sortOrder,
    searchQuery,

    // Getters
    selectedCategory,
    currentTodos,
    tableColumns,

    // Actions
    selectCategory,
    handleCategoryUpdated,
    enterViewAllMode,
    exitViewAllMode,
    toggleSort,
    initializeSelection,
    resetState,
    setSearchQuery,
    clearSearch,
  }
})
