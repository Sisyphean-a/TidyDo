<template>
  <v-app>
    <!-- 侧边栏 -->
    <TodoSidebar
      ref="sidebarRef"
      :selected-category-id="selectedCategoryId"
      :todo-counts="todoCounts"
      @category-select="handleCategorySelect"
      @category-updated="handleCategoryUpdated"
      @view-all="handleViewAll"
    />

    <!-- 主内容区域 -->
    <v-main>
      <v-container
        fluid
        class="pa-0 h-100"
      >
        <!-- 头部工具栏 -->
        <v-toolbar
          flat
          class="border-b"
        >
          <v-toolbar-title class="d-flex align-center">
            <v-icon class="me-2">{{
              viewAllMode ? 'mdi-view-list' : selectedCategory?.icon || 'mdi-folder'
            }}</v-icon>
            {{ viewAllMode ? '全部待办' : selectedCategory?.name || '请选择分类' }}
            <v-chip
              v-if="currentTodos.length > 0"
              size="small"
              class="ms-2"
              color="primary"
              variant="tonal"
            >
              {{ currentTodos.length }}
            </v-chip>
            <v-chip
              v-if="selectedCategory?.isFilterCategory"
              size="small"
              class="ms-2"
              color="warning"
              variant="tonal"
            >
              筛选类
            </v-chip>
          </v-toolbar-title>

          <v-spacer />

          <!-- 工具按钮 -->
          <v-btn-group
            variant="outlined"
            density="comfortable"
          >
            <v-btn
              v-if="viewAllMode"
              prepend-icon="mdi-close"
              @click="exitViewAllMode"
              color="warning"
            >
              退出全部视图
            </v-btn>
            <v-btn
              prepend-icon="mdi-plus"
              @click="handleCreateTodo"
              :disabled="(!selectedCategory && !viewAllMode) || selectedCategory?.isFilterCategory"
            >
              新增待办
            </v-btn>
            <v-btn
              @click="toggleShowArchived"
              :prepend-icon="showArchived ? 'mdi-eye-off' : 'mdi-eye'"
            >
              {{ showArchived ? '隐藏归档' : '显示归档' }}
            </v-btn>
            <v-btn
              icon="mdi-refresh"
              @click="loadTodos"
              :loading="todosLoading"
            />
          </v-btn-group>
        </v-toolbar>

        <!-- Todo列表内容 -->
        <div class="todo-content">
          <v-container
            v-if="!selectedCategory && !viewAllMode"
            class="text-center pa-12"
          >
            <v-icon
              size="64"
              color="grey-lighten-2"
              >mdi-arrow-left</v-icon
            >
            <h3 class="text-h6 mt-4 text-medium-emphasis">请从左侧选择一个分类</h3>
            <p class="text-body-2 text-medium-emphasis">
              选择分类后可以查看和管理该分类下的待办事项
            </p>
          </v-container>

          <v-container
            v-else-if="currentTodos.length === 0"
            class="text-center pa-12"
          >
            <v-icon
              size="64"
              color="grey-lighten-2"
              >mdi-clipboard-check</v-icon
            >
            <h3 class="text-h6 mt-4 text-medium-emphasis">还没有待办事项</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">点击"新增待办"创建第一个待办事项</p>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="handleCreateTodo"
            >
              新增待办
            </v-btn>
          </v-container>

          <div
            v-else
            class="todo-list"
          >
            <!-- 表头 -->
            <TableRow
              :columns="tableColumns"
              :isHeader="true"
            >
              <!-- 截止日期列自定义表头（包含排序功能） -->
              <template #column-2>
                <v-btn
                  variant="text"
                  density="compact"
                  class="text-body-2 font-weight-bold"
                  @click="handleSortToggle('endDate')"
                >
                  截止日期
                  <v-icon
                    v-if="sortBy === 'endDate'"
                    size="small"
                    class="ms-1"
                  >
                    {{ sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                  </v-icon>
                </v-btn>
              </template>
            </TableRow>

            <!-- Todo项列表 -->
            <div class="bg-white">
              <TodoItem
                v-for="item in sortedTodos"
                :key="item.id"
                :itemData="item"
                :columns="tableColumns"
                :categories="categories"
                :viewAllMode="viewAllMode || selectedCategory?.isFilterCategory"
                @edit="handleEditTodo"
                @status-change="handleStatusChange"
                @copy="handleCopy"
                @archive="handleArchive"
              />
            </div>
          </div>
        </div>
      </v-container>
    </v-main>

    <!-- 编辑弹窗 -->
    <TodoEditDialog
      v-model="todoEditDialog.visible.value"
      :item="todoEditDialog.data.value"
      :category-id="selectedCategoryId"
      :categories="categories"
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
import { ref, computed, onMounted } from 'vue'
import TodoSidebar from '@/components/TodoSidebar.vue'
import TodoItem from './components/TodoItem.vue'
import TodoEditDialog from '@/model/TodoEditDialog.vue'
import TableRow from './components/TableRow.vue'
import { initializeDefaultData } from '@/services/todoService'
import { useCategories } from '@/composables/useCategories'
import { useTodos } from '@/composables/useTodos'
import { useNotification } from '@/composables/useNotification'
import { useDialog } from '@/composables/useDialog'

// 使用组合式API
const { categories, getCategoryById } = useCategories()
const {
  todos,
  isLoading: todosLoading,
  loadTodos: loadAllTodos,
  getTodosByCategoryId,
  createTodo,
  updateTodo,
  deleteTodo,
  updateTodoStatus,
  toggleTodoArchived,
  getTodoCounts,
  showArchived,
  toggleShowArchived,
} = useTodos()

// 通用状态管理
const { notification, showSuccess, showError } = useNotification()
const todoEditDialog = useDialog()

// 响应式数据
const selectedCategoryId = ref(null)
const sidebarRef = ref(null)
const viewAllMode = ref(false) // 查看全部模式

// 排序状态
const sortBy = ref('endDate') // 当前排序字段
const sortOrder = ref('asc') // 排序顺序: 'asc' | 'desc'

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

// 计算属性
const selectedCategory = computed(() => {
  return getCategoryById(selectedCategoryId.value)
})

const currentTodos = computed(() => {
  if (viewAllMode.value) {
    // 查看全部模式：返回所有待办事项（根据 showArchived 状态过滤）
    return todos.value.filter((todo) => showArchived.value || !todo.archived)
  }

  if (!selectedCategoryId.value) return []

  // 如果是筛选类，应用筛选条件
  if (selectedCategory.value?.isFilterCategory) {
    const filterConditions = selectedCategory.value.filterConditions || {}
    return todos.value.filter((todo) => {
      // 归档状态过滤
      if (!showArchived.value && todo.archived) return false

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
  }

  // 普通分类：返回该分类下的待办事项
  return getTodosByCategoryId(selectedCategoryId.value)
})

// 排序后的待办事项（按截止日期排序）
const sortedTodos = computed(() => {
  const sorted = [...currentTodos.value].sort((a, b) => {
    if (sortBy.value === 'endDate') {
      // 优先显示有截止日期的事项
      if (!a.endDate && !b.endDate) return 0
      if (!a.endDate) return 1
      if (!b.endDate) return -1

      // 按截止日期排序
      const dateA = new Date(a.endDate)
      const dateB = new Date(b.endDate)

      if (sortOrder.value === 'asc') {
        return dateA - dateB
      } else {
        return dateB - dateA
      }
    }
    return 0
  })

  return sorted
})

const todoCounts = getTodoCounts

// 数据加载
const loadTodos = async () => {
  try {
    await loadAllTodos()
  } catch (error) {
    showError('加载待办事项失败')
  }
}

// 分类相关操作
const handleCategorySelect = (category) => {
  selectedCategoryId.value = category ? category.id : null
  // 如果在查看全部模式下选择了分类，退出查看全部模式
  if (viewAllMode.value && category) {
    viewAllMode.value = false
  }
}

const handleCategoryUpdated = (updatedCategories) => {
  categories.value = updatedCategories

  // 如果没有选中分类且有分类，选中第一个
  if (!selectedCategoryId.value && categories.value.length > 0) {
    selectedCategoryId.value = categories.value[0].id
  }

  // 如果当前选中的分类不存在了，清空选择
  if (
    selectedCategoryId.value &&
    !categories.value.find((cat) => cat.id === selectedCategoryId.value)
  ) {
    selectedCategoryId.value = categories.value.length > 0 ? categories.value[0].id : null
  }
}

// Todo相关操作
const handleCreateTodo = () => {
  if (viewAllMode.value) {
    // 在查看全部模式下，创建时需要用户选择分类
    // 默认选择第一个分类
    const defaultCategoryId = categories.value.length > 0 ? categories.value[0].id : null
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
    await updateTodoStatus(item, newStatus)
    showSuccess('状态更新成功')
  } catch (error) {
    showError('状态更新失败')
  }
}

const handleSaveTodo = async (todoData) => {
  try {
    if (todoEditDialog.data.value) {
      // 编辑模式
      await updateTodo(todoData)
      showSuccess('更新待办成功')
    } else {
      // 创建模式
      await createTodo(todoData)
      showSuccess('创建待办成功')
    }

    todoEditDialog.hide()
  } catch (error) {
    showError('保存待办失败')
  }
}

const handleDeleteTodo = async (item) => {
  try {
    await deleteTodo(item.id)
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

// 处理排序切换
const handleSortToggle = (field) => {
  if (sortBy.value === field) {
    // 切换排序顺序
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 更改排序字段
    sortBy.value = field
    sortOrder.value = 'asc'
  }
}

// 处理查看全部
const handleViewAll = () => {
  viewAllMode.value = true
  selectedCategoryId.value = null // 清除分类选择
}

// 退出查看全部模式
const exitViewAllMode = () => {
  viewAllMode.value = false
  // 选择第一个分类
  if (categories.value.length > 0) {
    selectedCategoryId.value = categories.value[0].id
  }
}

// 处理归档事件
const handleArchive = async (item) => {
  try {
    await toggleTodoArchived(item)
    showSuccess(item.archived ? '取消归档成功' : '归档成功')
  } catch (error) {
    showError('归档操作失败')
  }
}

// 组件挂载
onMounted(async () => {
  await initializeDefaultData()
  await loadTodos()
})
</script>

<style lang="scss" scoped>
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.todo-content {
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.todo-list {
  height: 100%;
}

.v-toolbar {
  background: white !important;
}
</style>
