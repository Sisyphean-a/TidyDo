import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  // 状态
  const selectedCategoryId = ref(null)
  const viewAllMode = ref(false) // 查看全部模式
  const sortBy = ref('endDate') // 当前排序字段
  const sortOrder = ref('asc') // 排序顺序: 'asc' | 'desc'

  // Getters (计算属性) - 移除了依赖其他stores的计算属性，这些将在组件中处理

  // 表格列配置
  const tableColumns = computed(() => {
    const isFilterOrViewAllMode = viewAllMode.value
    const columns = [
      { cols: 1, align: 'center', title: '编号' },
      { cols: 5, align: 'left', title: '标题' },
      { cols: 2, align: 'center', title: '截止日期' },
      { cols: isFilterOrViewAllMode ? 1 : 2, align: 'center', title: '状态' },
    ]

    // 在查看全部模式下，在操作列前添加分类列
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
  }

  // 退出查看全部模式
  const exitViewAllMode = () => {
    viewAllMode.value = false
    // 这里不能直接访问categoriesStore，需要在组件中处理分类选择
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

  return {
    // 状态
    selectedCategoryId,
    viewAllMode,
    sortBy,
    sortOrder,

    // Getters
    tableColumns,

    // Actions
    selectCategory,
    handleCategoryUpdated,
    enterViewAllMode,
    exitViewAllMode,
    toggleSort,
    initializeSelection,
  }
})
