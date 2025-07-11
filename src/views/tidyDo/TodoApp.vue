<template>
  <v-app class="todo-app">
    <!-- 侧边栏 -->
    <TodoSidebar
      :categories="categories"
      :selected-category-id="selectedCategoryId"
      :is-view-all-mode="isViewAllMode"
    />

    <!-- 主内容区 -->
    <v-main class="todo-main">
      <!-- 工具栏 -->
      <TodoToolbar
        :title="toolbarTitle"
        :title-icon="toolbarIcon"
        :item-count="filteredTodos.length"
        :show-filter-badge="isFilterCategory"
        :search-query="searchQuery"
        :view-mode="viewMode"
        :show-archived="showArchived"
        :can-create="canCreateTodo"
        :loading="isLoading"
        @update:search-query="handleSearchUpdate"
        @update:view-mode="handleViewModeChange"
        @update:show-archived="handleShowArchivedChange"
        @search="handleSearch"
        @create="handleCreateTodo"
        @refresh="handleRefresh"
        @select-all="handleSelectAll"
        @export="handleExport"
      >
        <!-- 自定义工具栏按钮 -->
        <template #custom-buttons>
          <v-btn
            v-if="isViewAllMode"
            prepend-icon="mdi-close"
            color="warning"
            @click="handleExitViewAll"
          >
            退出全部视图
          </v-btn>
        </template>
      </TodoToolbar>

      <!-- 主要内容 -->
      <div class="todo-content">
        <!-- 无选中分类的提示 -->
        <EmptyState
          v-if="!selectedCategory && !isViewAllMode"
          icon="mdi-arrow-left"
          title="请选择一个分类"
          description="从左侧选择分类后可以查看和管理该分类下的待办事项"
        />

        <!-- Todo列表 -->
        <TodoListView
          v-else
          :todos="displayTodos"
          :categories="categories"
          :view-mode="viewMode"
          :show-category="shouldShowCategory"
          :selectable="true"
          :selected-todos="selectedTodos"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          :loading="isLoading"
          :empty-state-config="emptyStateConfig"
          @edit="handleEditTodo"
          @status-change="handleStatusChange"
          @archive="handleArchive"
          @copy="handleCopy"
          @click="handleTodoClick"
          @select="handleTodoSelect"
          @sort="handleSort"
          @empty-action="handleCreateTodo"
          @batch-update-status="handleBatchUpdateStatus"
          @batch-archive="handleBatchArchive"
        />
      </div>
    </v-main>

    <!-- 模态框 -->
    <TodoEditModal
      v-model="uiState.showEditDialog"
      :editing-todo="uiState.editingTodo"
      :categories="categories"
      :default-category-id="selectedCategoryId"
      :loading="isLoading"
      @save="handleSaveTodo"
      @delete="handleDeleteTodo"
      @close="store.hideEditTodoDialog"
    />

    <!-- 设置对话框 -->
    <ConfigDialog
      v-model="uiState.showSettingsDialog"
      @close="store.hideSettingsDialog"
    />

    <!-- 全局提示 -->
    <v-snackbar
      v-model="notification.visible"
      :color="notification.color"
      :timeout="notification.timeout"
      location="top"
    >
      {{ notification.message }}
      <template #actions>
        <v-btn
          variant="text"
          @click="notification.visible = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTodoStore } from '@/stores/todoStore'
import { TodoBusinessService } from '@/services/todoBusinessService'

// 组件导入
import TodoSidebar from '@/components/layout/TodoSidebar.vue'
import TodoToolbar from '@/components/layout/TodoToolbar.vue'
import TodoListView from '@/components/todo/TodoListView.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import TodoEditModal from '@/components/modal/TodoEditModal.vue'
import ConfigDialog from '@/components/ConfigDialog.vue'

// 状态管理
const store = useTodoStore()

// 本地状态
const searchQuery = ref('')
const notification = ref({
  visible: false,
  message: '',
  color: 'success',
  timeout: 3000,
})

// 计算属性
const { todos, categories, isLoading, viewState, uiState, selectedCategory, filteredTodos } = store

// 视图状态
const selectedCategoryId = computed(() => viewState.value.selectedCategoryId)
const viewMode = computed(() => viewState.value.viewMode)
const showArchived = computed(() => viewState.value.showArchived)
const sortBy = computed(() => viewState.value.sortConfig.field)
const sortOrder = computed(() => viewState.value.sortConfig.order)
const selectedTodos = computed(() => uiState.value.selectedTodos)

// 视图逻辑
const isViewAllMode = computed(() => !selectedCategoryId.value)
const isFilterCategory = computed(() => selectedCategory.value?.isFilterCategory || false)
const shouldShowCategory = computed(() => isViewAllMode.value || isFilterCategory.value)

// 工具栏配置
const toolbarTitle = computed(() => {
  if (isViewAllMode.value) return '全部待办'
  return selectedCategory.value?.name || '请选择分类'
})

const toolbarIcon = computed(() => {
  if (isViewAllMode.value) return 'mdi-view-list'
  return selectedCategory.value?.icon || 'mdi-folder'
})

const canCreateTodo = computed(() => {
  if (isViewAllMode.value) return true
  return TodoBusinessService.canCreateTodo(selectedCategory.value).canCreate
})

// 显示的待办事项
const displayTodos = computed(() => {
  let result = filteredTodos.value

  // 搜索过滤
  if (searchQuery.value) {
    result = TodoBusinessService.searchTodos(result, searchQuery.value)
  }

  return result
})

// 空状态配置
const emptyStateConfig = computed(() => {
  if (isViewAllMode.value) {
    return {
      icon: 'mdi-clipboard-check',
      title: '还没有待办事项',
      description: '开始创建你的第一个待办事项吧',
      showAction: true,
      actionText: '新增待办',
      actionIcon: 'mdi-plus',
    }
  }

  return {
    icon: 'mdi-clipboard-check',
    title: '分类下还没有待办事项',
    description: '点击"新增待办"创建第一个待办事项',
    showAction: true,
    actionText: '新增待办',
    actionIcon: 'mdi-plus',
  }
})

const handleExitViewAll = () => {
  const firstCategory = categories.value[0]
  if (firstCategory) {
    store.setSelectedCategory(firstCategory.id)
  }
}

const handleSearchUpdate = (query) => {
  searchQuery.value = query
}

const handleSearch = (query) => {
  // 搜索逻辑已在 displayTodos 中处理
}

const handleViewModeChange = (mode) => {
  store.setViewMode(mode)
}

const handleShowArchivedChange = (show) => {
  store.toggleArchived()
}

const handleCreateTodo = () => {
  if (isViewAllMode.value) {
    // 在全部视图模式下，选择第一个分类
    const firstCategory = categories.value.find((cat) => !cat.isFilterCategory)
    if (firstCategory) {
      store.showEditTodoDialog({ categoryId: firstCategory.id })
    } else {
      showNotification('请先创建一个分类', 'warning')
    }
  } else {
    store.showEditTodoDialog({ categoryId: selectedCategoryId.value })
  }
}

const handleEditTodo = (todo) => {
  store.showEditTodoDialog(todo)
}

const handleStatusChange = async ({ todo, newStatus }) => {
  try {
    await TodoBusinessService.quickUpdateStatus(todo, newStatus, store.updateTodo)
    showNotification('状态更新成功', 'success')
  } catch (error) {
    showNotification('状态更新失败', 'error')
  }
}

const handleArchive = async (todo) => {
  try {
    const result = await TodoBusinessService.quickToggleArchive(todo, store.updateTodo)
    showNotification(result.message, result.success ? 'success' : 'error')
  } catch (error) {
    showNotification('操作失败', 'error')
  }
}

const handleCopy = ({ type, data }) => {
  try {
    if (type === 'full') {
      showNotification('已复制完整信息到剪贴板', 'success')
    } else {
      showNotification('已复制到剪贴板', 'success')
    }
  } catch (error) {
    showNotification('复制失败', 'error')
  }
}

const handleTodoClick = (todo) => {
  // 可以在这里添加点击待办事项的逻辑
}

const handleTodoSelect = (selectedItems) => {
  store.setSelectedTodos(selectedItems)
}

const handleSort = ({ field, order }) => {
  store.setSortConfig({ field, order })
}

const handleRefresh = async () => {
  try {
    await store.initialize()
    showNotification('刷新成功', 'success')
  } catch (error) {
    showNotification('刷新失败', 'error')
  }
}

const handleSelectAll = () => {
  store.setSelectedTodos([...displayTodos.value])
  showNotification(`已选择 ${displayTodos.value.length} 项`, 'info')
}

const handleExport = () => {
  try {
    const data = TodoBusinessService.exportTodos(displayTodos.value)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `待办事项-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showNotification('导出成功', 'success')
  } catch (error) {
    showNotification('导出失败', 'error')
  }
}

// 批量操作
const handleBatchUpdateStatus = async ({ todos, status }) => {
  try {
    const results = await TodoBusinessService.batchUpdateStatus(todos, status, store.updateTodo)
    const successCount = results.filter((r) => r.result.success).length
    showNotification(`成功更新 ${successCount} 项状态`, 'success')
    store.setSelectedTodos([])
  } catch (error) {
    showNotification('批量更新失败', 'error')
  }
}

const handleBatchArchive = async ({ todos, archived }) => {
  try {
    const results = await TodoBusinessService.batchArchive(todos, archived, store.updateTodo)
    const successCount = results.filter((r) => r.success).length
    const action = archived ? '归档' : '取消归档'
    showNotification(`成功${action} ${successCount} 项`, 'success')
    store.setSelectedTodos([])
  } catch (error) {
    showNotification('批量操作失败', 'error')
  }
}

// 模态框事件处理
const handleSaveTodo = async (todoData) => {
  try {
    if (todoData.id) {
      // 更新
      await store.updateTodo(todoData)
      showNotification('更新待办成功', 'success')
    } else {
      // 创建
      await store.createTodo(todoData)
      showNotification('创建待办成功', 'success')
    }
    store.hideEditTodoDialog()
  } catch (error) {
    showNotification('保存待办失败', 'error')
  }
}

const handleDeleteTodo = async (todo) => {
  try {
    await store.deleteTodo(todo.id)
    showNotification('删除待办成功', 'success')
    store.hideEditTodoDialog()
  } catch (error) {
    showNotification('删除待办失败', 'error')
  }
}

// 通知系统
const showNotification = (message, type = 'info', timeout = 3000) => {
  const colorMap = {
    success: 'green',
    error: 'red',
    warning: 'orange',
    info: 'blue',
  }

  notification.value = {
    visible: true,
    message,
    color: colorMap[type] || 'blue',
    timeout,
  }
}

// 生命周期
onMounted(async () => {
  try {
    // 并行初始化store和业务服务配置
    await Promise.all([
      store.initialize(),
      TodoBusinessService.initialize()
    ])
  } catch (error) {
    showNotification('应用初始化失败', 'error')
  }
})
</script>

<style lang="scss" scoped>
.todo-app {
  height: 100vh;
  overflow: hidden;
}

.todo-main {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.todo-content {
  flex: 1;
  overflow: hidden;
  background: #f5f5f5;
}
</style>
