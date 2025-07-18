<template>
  <div class="todo-content">
    <!-- 未选择分类状态 -->
    <v-container
      v-if="!appStore.selectedCategory && !appStore.viewAllMode"
      class="text-center pa-12"
    >
      <v-icon
        size="64"
        color="grey-lighten-2"
        >mdi-arrow-left</v-icon
      >
      <h3 class="text-h6 mt-4 text-medium-emphasis">请从左侧选择一个分类</h3>
      <p class="text-body-2 text-medium-emphasis">选择分类后可以查看和管理该分类下的待办事项</p>
    </v-container>

    <!-- 空列表状态 -->
    <v-container
      v-else-if="appStore.currentTodos.length === 0"
      class="text-center pa-12"
    >
      <!-- 搜索无结果状态 -->
      <template v-if="appStore.searchQuery">
        <v-icon
          size="64"
          color="grey-lighten-2"
          >mdi-magnify</v-icon
        >
        <h3 class="text-h6 mt-4 text-medium-emphasis">未找到搜索结果</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          没有找到包含"<span class="font-weight-bold">{{ appStore.searchQuery }}</span
          >"的待办事项
        </p>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="appStore.clearSearch"
        >
          清除搜索
        </v-btn>
      </template>

      <!-- 普通空列表状态 -->
      <template v-else>
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
      </template>
    </v-container>

    <!-- Todo列表 -->
    <div
      v-else
      class="todo-list"
    >
      <!-- 表格视图 -->
      <div v-if="appStore.viewMode === 'table'">
        <!-- 表头 -->
        <TableRow
          :columns="appStore.tableColumns"
          :isHeader="true"
        >
          <!-- 截止日期列自定义表头（包含排序功能） -->
          <template #column-2>
            <v-btn
              variant="text"
              density="compact"
              class="text-body-2 font-weight-bold"
              @click="appStore.toggleSort('endDate')"
            >
              截止日期
              <v-icon
                v-if="appStore.sortBy === 'endDate'"
                size="small"
                class="ms-1"
              >
                {{ appStore.sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
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
            :columns="appStore.tableColumns"
            :categories="categoriesStore.categories"
            :viewAllMode="appStore.viewAllMode || appStore.selectedCategory?.isFilterCategory"
            :searchQuery="appStore.searchQuery"
            @edit="handleEditTodo"
            @status-change="handleStatusChange"
            @copy="handleCopy"
            @archive="handleArchive"
          />
        </div>
      </div>

      <!-- 时间线视图 -->
      <TodoTimeline
        v-else
        :todos="appStore.currentTodos"
        :viewAllMode="appStore.viewAllMode || appStore.selectedCategory?.isFilterCategory"
        :searchQuery="appStore.searchQuery"
      />
    </div>

    <!-- 编辑弹窗 -->
    <TodoEditDialog
      :model-value="todoEditDialog.visible.value"
      @update:model-value="todoEditDialog.visible.value = $event"
      :item="todoEditDialog.data.value"
      :category-id="appStore.selectedCategoryId"
      :categories="categoriesStore.categories"
      @save="handleSaveTodo"
      @delete="handleDeleteTodo"
    />

    <!-- 通知 -->
    <v-snackbar
      v-model="notification.visible"
      :color="notification.color"
      :timeout="notification.timeout"
      location="top"
    >
      {{ notification.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TodoItem from './TodoItem.vue'
import TableRow from './TableRow.vue'
import TodoTimeline from './TodoTimeline.vue'
import TodoEditDialog from '@/model/TodoEditDialog.vue'
import { useAppStore } from '@/stores/useAppStore'
import { useTodosStore } from '@/stores/useTodosStore'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useNotification } from '@/composables/useNotification'
import { useDialog } from '@/composables/useDialog'

// 使用stores
const appStore = useAppStore()
const todosStore = useTodosStore()
const categoriesStore = useCategoriesStore()

// 通知和弹窗管理
const { notification, showSuccess, showError } = useNotification()
const todoEditDialog = useDialog()

// 计算排序后的待办事项
const sortedTodos = computed(() => {
  const sorted = [...appStore.currentTodos].sort((a, b) => {
    if (appStore.sortBy === 'endDate') {
      // 优先显示有截止日期的事项
      if (!a.endDate && !b.endDate) return 0
      if (!a.endDate) return 1
      if (!b.endDate) return -1

      const dateA = new Date(a.endDate)
      const dateB = new Date(b.endDate)

      return appStore.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    }

    // 默认按创建时间排序
    const timeA = new Date(a.createdAt || 0)
    const timeB = new Date(b.createdAt || 0)

    return appStore.sortOrder === 'asc' ? timeA - timeB : timeB - timeA
  })

  return sorted
})

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

// 暴露方法给父组件（保持向上兼容）
defineExpose({
  handleCreateTodo
})
</script>

<style scoped>
.todo-content {
  height: calc(100vh - 65px);
  overflow-y: auto;
}

.todo-list {
  height: 100%;
}

.table-row {
  border-bottom: 1px solid #f0f0f0;
}

.table-row:hover {
  background-color: #f8f9fa;
}
</style>
