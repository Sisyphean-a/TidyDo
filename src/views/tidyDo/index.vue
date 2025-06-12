<template>
  <v-app>
    <!-- 侧边栏 -->
    <TodoSidebar
      ref="sidebarRef"
      :selected-category-id="selectedCategoryId"
      :todo-counts="todoCounts"
      @category-select="handleCategorySelect"
      @category-updated="handleCategoryUpdated"
      @show-about="showAbout = true"
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
            <v-icon class="me-2">{{ selectedCategory?.icon || 'mdi-folder' }}</v-icon>
            {{ selectedCategory?.name || '请选择分类' }}
            <v-chip
              v-if="currentTodos.length > 0"
              size="small"
              class="ms-2"
              color="primary"
              variant="tonal"
            >
              {{ currentTodos.length }}
            </v-chip>
          </v-toolbar-title>

          <v-spacer />

          <!-- 工具按钮 -->
          <v-btn-group
            variant="outlined"
            density="comfortable"
          >
            <v-btn
              prepend-icon="mdi-plus"
              @click="handleCreateTodo"
              :disabled="!selectedCategory"
            >
              新增待办
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
            v-if="!selectedCategory"
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
                :item="item"
                @edit="handleEditTodo"
                @status-change="handleStatusChange"
                @copy="handleCopy"
              />
            </div>
          </div>
        </div>
      </v-container>
    </v-main>

    <!-- 编辑弹窗 -->
    <TodoEditDialog
      v-model="editDialog.visible"
      :item="editDialog.item"
      :category-id="selectedCategoryId"
      :categories="categories"
      @save="handleSaveTodo"
      @delete="handleDeleteTodo"
    />

    <!-- 全局提示 -->
    <v-snackbar
      v-model="snackbar.visible"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TodoSidebar from './components/TodoSidebar.vue'
import TodoItem from './components/TodoItem.vue'
import TodoEditDialog from './components/TodoEditDialog.vue'
import TableRow from './components/TableRow.vue'
import { initializeDefaultData } from '@/services/todoService'
import { useCategories } from './composables/useCategories'
import { useTodos } from './composables/useTodos'

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
  getTodoCounts,
} = useTodos()

// 响应式数据
const selectedCategoryId = ref(null)
const sidebarRef = ref(null)

// 排序状态
const sortBy = ref('endDate') // 当前排序字段
const sortOrder = ref('asc') // 排序顺序: 'asc' | 'desc'

// 表格列配置
const tableColumns = ref([
  { cols: 1, align: 'center', title: '编号' },
  { cols: 5, align: 'center', title: '标题' },
  { cols: 2, align: 'center', title: '截止日期' },
  { cols: 2, align: 'center', title: '状态' },
  { cols: 2, align: 'center', title: '操作' }
])

// 弹窗状态
const editDialog = ref({
  visible: false,
  item: null,
})

const showAbout = ref(false)

// 提示消息
const snackbar = ref({
  visible: false,
  message: '',
  color: 'success',
})

// 计算属性
const selectedCategory = computed(() => {
  return getCategoryById(selectedCategoryId.value)
})

const currentTodos = computed(() => {
  if (!selectedCategoryId.value) return []
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
    showMessage('加载待办事项失败', 'error')
  }
}

// 分类相关操作
const handleCategorySelect = (category) => {
  selectedCategoryId.value = category ? category.id : null
}

const handleCategoryUpdated = (updatedCategories) => {
  categories.value = updatedCategories
  
  // 如果没有选中分类且有分类，选中第一个
  if (!selectedCategoryId.value && categories.value.length > 0) {
    selectedCategoryId.value = categories.value[0].id
  }
  
  // 如果当前选中的分类不存在了，清空选择
  if (selectedCategoryId.value && !categories.value.find(cat => cat.id === selectedCategoryId.value)) {
    selectedCategoryId.value = categories.value.length > 0 ? categories.value[0].id : null
  }
}

// Todo相关操作
const handleCreateTodo = () => {
  editDialog.value = {
    visible: true,
    item: null,
  }
}

const handleEditTodo = (item) => {
  editDialog.value = {
    visible: true,
    item,
  }
}

// 处理状态变更
const handleStatusChange = async ({ item, newStatus }) => {
  try {
    await updateTodoStatus(item, newStatus)
    showMessage('状态更新成功', 'success')
  } catch (error) {
    showMessage('状态更新失败', 'error')
  }
}

const handleSaveTodo = async (todoData) => {
  try {
    if (editDialog.value.item) {
      // 编辑模式
      await updateTodo(todoData)
      showMessage('更新待办成功', 'success')
    } else {
      // 创建模式
      await createTodo(todoData)
      showMessage('创建待办成功', 'success')
    }

    editDialog.value.visible = false
  } catch (error) {
    showMessage('保存待办失败', 'error')
  }
}

const handleDeleteTodo = async (item) => {
  try {
    await deleteTodo(item.id)
    editDialog.value.visible = false
    showMessage('删除待办成功', 'success')
  } catch (error) {
    showMessage('删除待办失败', 'error')
  }
}

// 处理复制事件
const handleCopy = ({ text, type }) => {
  showMessage(type === 'error' ? text : `复制成功：${text}`, type === 'error' ? 'error' : 'success')
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

// 工具方法
const showMessage = (message, color = 'success') => {
  snackbar.value = {
    visible: true,
    message,
    color,
    timeout: 2000,
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
