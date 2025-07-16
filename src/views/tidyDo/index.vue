<template>
  <v-app>
    <!-- 侧边栏 -->
    <TodoSidebar
      ref="sidebarRef"
      :selected-category-id="appStore.selectedCategoryId"
      :todo-counts="todosStore.todoCounts"
      @category-select="appStore.selectCategory"
      @category-updated="appStore.handleCategoryUpdated"
      @view-all="appStore.enterViewAllMode"
    />

    <!-- 主内容区域 -->
    <v-main>
      <v-container
        fluid
        class="pa-0 h-100"
      >
        <!-- 头部工具栏 -->
        <TodoHeader
          :selected-category="selectedCategory"
          :view-all-mode="appStore.viewAllMode"
          :current-todos-count="currentTodos.length"
          :show-archived="todosStore.showArchived"
          :todos-loading="todosStore.isLoading"
          :search-value="searchQuery"
          @create-todo="handleCreateTodo"
          @toggle-archived="todosStore.toggleShowArchived"
          @refresh="todosStore.loadTodos"
          @exit-view-all="handleExitViewAll"
          @search="handleSearch"
        />

        <!-- Todo列表内容 -->
        <TodoContent
          :selected-category="selectedCategory"
          :view-all-mode="appStore.viewAllMode"
          :current-todos="currentTodos"
          :table-columns="tableColumns"
          :categories="categoriesStore.categories"
          :sort-by="appStore.sortBy"
          :sort-order="appStore.sortOrder"
          :search-query="searchQuery"
          @edit-todo="handleEditTodo"
          @status-change="handleStatusChange"
          @copy="handleCopy"
          @archive="handleArchive"
          @create-todo="handleCreateTodo"
          @sort-toggle="appStore.toggleSort"
          @clear-search="handleClearSearch"
        />
      </v-container>
    </v-main>

    <!-- 编辑弹窗 -->
    <TodoEditDialog
      v-model="todoEditDialog.visible.value"
      :item="todoEditDialog.data.value"
      :category-id="appStore.selectedCategoryId"
      :categories="categoriesStore.categories"
      @save="handleSaveTodo"
      @delete="handleDeleteTodo"
    />

    <!-- 全局提示 -->
    <v-snackbar
      v-model="notification.visible"
      :color="notification.color"
      :timeout="notification.timeout"
      location="top"
    >
      {{ notification.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import TodoSidebar from '@/components/TodoSidebar.vue'
import TodoHeader from './components/TodoHeader.vue'
import TodoContent from './components/TodoContent.vue'
import TodoEditDialog from '@/model/TodoEditDialog.vue'
import { initializeDefaultData } from '@/services/todoService'
import { useNotification } from '@/composables/useNotification'
import { useDialog } from '@/composables/useDialog'

// 使用Pinia stores
import { useTodosStore } from '@/stores/useTodosStore'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useAppStore } from '@/stores/useAppStore'

// Store实例
const todosStore = useTodosStore()
const categoriesStore = useCategoriesStore()
const appStore = useAppStore()

// 通用状态管理（保留，因为这些是局部UI状态）
const { notification, showSuccess, showError } = useNotification()
const todoEditDialog = useDialog()

// 响应式数据
const sidebarRef = ref(null)

// 搜索相关状态
const searchQuery = ref('')

// 计算属性 - 从stores中计算得出
const selectedCategory = computed(() => {
  if (!appStore.selectedCategoryId) return null
  return categoriesStore.getCategoryById(appStore.selectedCategoryId)
})

const currentTodos = computed(() => {
  let filteredTodos = []
  
  if (appStore.viewAllMode) {
    // 查看全部模式：返回所有待办事项（根据 showArchived 状态过滤）
    filteredTodos = todosStore.showArchived ? todosStore.todos : todosStore.activeTodos
  } else if (!appStore.selectedCategoryId) {
    filteredTodos = []
  } else if (selectedCategory.value?.isFilterCategory) {
    // 如果是筛选类，应用筛选条件
    const filterConditions = selectedCategory.value.filterConditions || {}
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
    filteredTodos = todosStore.getTodosByCategoryId(appStore.selectedCategoryId)
  }

  // 应用搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    filteredTodos = filteredTodos.filter(todo => 
      todo.title?.toLowerCase().includes(query) ||
      todo.description?.toLowerCase().includes(query) ||
      todo.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return filteredTodos
})

// 扩展的表格列配置
const tableColumns = computed(() => {
  const isFilterOrViewAllMode = appStore.viewAllMode || selectedCategory.value?.isFilterCategory
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

// 数据加载
const loadData = async () => {
  try {
    await Promise.all([categoriesStore.loadCategories(), todosStore.loadTodos()])
    // 初始化选择状态
    appStore.initializeSelection(categoriesStore.categories)
  } catch (error) {
    showError('加载数据失败')
  }
}

// Todo相关操作
const handleCreateTodo = () => {
  if (appStore.viewAllMode) {
    // 在查看全部模式下，创建时需要用户选择分类
    // 默认选择第一个分类
    const defaultCategoryId =
      categoriesStore.categories.length > 0 ? categoriesStore.categories[0].id : null
    todoEditDialog.show({ categoryId: defaultCategoryId })
  } else {
    todoEditDialog.show(null)
  }
}

const handleEditTodo = (item) => {
  todoEditDialog.show(item)
}

// 处理状态变更
const handleStatusChange = async ({ item, newStatus }) => {
  try {
    await todosStore.updateTodoStatus(item, newStatus)
    showSuccess('状态更新成功')
  } catch (error) {
    showError('状态更新失败')
  }
}

const handleSaveTodo = async (todoData) => {
  try {
    if (todoEditDialog.data.value) {
      // 编辑模式
      await todosStore.updateTodo(todoData)
      showSuccess('更新待办成功')
    } else {
      // 创建模式
      await todosStore.createTodo(todoData)
      showSuccess('创建待办成功')
    }

    todoEditDialog.hide()
  } catch (error) {
    showError('保存待办失败')
  }
}

const handleDeleteTodo = async (item) => {
  try {
    await todosStore.deleteTodo(item.id)
    todoEditDialog.hide()
    showSuccess('删除待办成功')
  } catch (error) {
    showError('删除待办失败')
  }
}

// 处理复制事件
const handleCopy = ({ text, type }) => {
  if (type === 'error') {
    showError(text)
  } else {
    showSuccess(`复制成功：${text}`)
  }
}

// 处理归档事件
const handleArchive = async (item) => {
  try {
    await todosStore.toggleTodoArchived(item)
    showSuccess(item.archived ? '取消归档成功' : '归档成功')
  } catch (error) {
    showError('归档操作失败')
  }
}

// 处理搜索事件
const handleSearch = (query) => {
  searchQuery.value = query
}

// 处理清除搜索
const handleClearSearch = () => {
  searchQuery.value = ''
}

// 处理退出查看全部模式
const handleExitViewAll = () => {
  appStore.exitViewAllMode()
  // 清空搜索
  searchQuery.value = ''
  // 选择第一个分类
  if (categoriesStore.categories.length > 0) {
    appStore.selectCategory(categoriesStore.categories[0])
  }
}

// 组件挂载
onMounted(async () => {
  await initializeDefaultData()
  await loadData()
})
</script>
