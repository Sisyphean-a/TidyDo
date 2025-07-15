import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { CategoryService, TodoItemService, createCategory } from '@/services/todoService'

export const useCategoriesStore = defineStore('categories', () => {
  // 状态
  const categories = ref([])
  const isLoading = ref(false)

  // Getters (计算属性)
  const allCategories = computed(() => categories.value)

  const regularCategories = computed(() => categories.value.filter((cat) => !cat.isFilterCategory))

  const filterCategories = computed(() => categories.value.filter((cat) => cat.isFilterCategory))

  const categoriesCount = computed(() => categories.value.length)

  // 根据ID获取分类
  const getCategoryById = computed(() => (id) => {
    return categories.value.find((cat) => cat.id === id)
  })

  // Actions (方法)

  // 加载分类数据
  const loadCategories = async () => {
    try {
      isLoading.value = true
      categories.value = await CategoryService.getAll()
      return categories.value
    } catch (error) {
      console.error('Load categories error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 创建分类
  const createNewCategory = async (
    name,
    icon = 'mdi-folder-outline',
    isFilterCategory = false,
    filterConditions = null,
  ) => {
    try {
      // 获取当前分类数量，用于设置新分类的排序值
      const currentCategories = await CategoryService.getAll()
      const newOrder = currentCategories.length
      
      const newCategory = createCategory(
        TodoItemService.generateId(),
        name,
        icon,
        true, // isExpanded
        isFilterCategory,
        filterConditions,
        newOrder, // order
      )
      await CategoryService.save(newCategory)
      await loadCategories()
      return newCategory
    } catch (error) {
      console.error('Create category error:', error)
      throw error
    }
  }

  // 更新分类
  const updateCategory = async (category, updates) => {
    try {
      // 确保数据可序列化
      const updatedCategory = {
        id: category.id,
        name: updates.name || category.name,
        icon: updates.icon || category.icon,
        isExpanded: updates.isExpanded !== undefined ? updates.isExpanded : category.isExpanded,
        isFilterCategory:
          updates.isFilterCategory !== undefined
            ? updates.isFilterCategory
            : category.isFilterCategory || false,
        filterConditions: updates.filterConditions
          ? {
              endDateFrom: updates.filterConditions.endDateFrom || null,
              endDateTo: updates.filterConditions.endDateTo || null,
              statuses: [...(updates.filterConditions.statuses || [])],
              categories: [...(updates.filterConditions.categories || [])],
              tags: [...(updates.filterConditions.tags || [])],
            }
          : category.filterConditions || {
              endDateFrom: null,
              endDateTo: null,
              statuses: [],
              categories: [],
              tags: [],
            },
        createdAt: category.createdAt,
        updatedAt: new Date().toISOString(),
      }
      await CategoryService.save(updatedCategory)
      await loadCategories()
      return updatedCategory
    } catch (error) {
      console.error('Update category error:', error)
      throw error
    }
  }

  // 删除分类
  const deleteCategory = async (categoryId) => {
    try {
      await CategoryService.delete(categoryId)
      await loadCategories()
      return true
    } catch (error) {
      console.error('Delete category error:', error)
      throw error
    }
  }

  // 移动分类（上移/下移）
  const moveCategoryOrder = async (categoryId, direction) => {
    try {
      const success = await CategoryService.updateOrder(categoryId, direction)
      if (success) {
        await loadCategories()
      }
      return success
    } catch (error) {
      console.error('Move category error:', error)
      throw error
    }
  }

  return {
    // 状态
    categories: allCategories,
    isLoading,

    // Getters
    regularCategories,
    filterCategories,
    categoriesCount,
    getCategoryById,

    // Actions
    loadCategories,
    createNewCategory,
    updateCategory,
    deleteCategory,
    moveCategoryOrder,
  }
})
