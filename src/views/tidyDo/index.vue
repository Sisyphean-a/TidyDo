<template>
  <v-app>
    <!-- 侧边栏 -->
    <TodoSidebar
      :categories="categories"
      :selected-category-id="selectedCategoryId"
      :todo-counts="todoCounts"
      @category-select="handleCategorySelect"
      @category-toggle-expanded="handleCategoryToggleExpanded"
      @create-category="handleCreateCategory"
      @edit-category="handleEditCategory"
      @delete-category="handleDeleteCategory"
      @show-settings="showSettings = true"
      @show-about="showAbout = true"
    />

    <!-- 主内容区域 -->
    <v-main>
      <v-container fluid class="pa-0 h-100">
        <!-- 头部工具栏 -->
        <v-toolbar flat class="border-b">
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
          <v-btn-group variant="outlined" density="comfortable">
            <v-btn
              prepend-icon="mdi-plus"
              @click="handleCreateTodo"
              :disabled="!selectedCategory"
            >
              新增待办
            </v-btn>
            <v-btn
              icon="mdi-refresh"
              @click="loadData"
              :loading="isLoading"
            />
          </v-btn-group>
        </v-toolbar>

        <!-- Todo列表内容 -->
        <div class="todo-content">
          <v-container v-if="!selectedCategory" class="text-center pa-12">
            <v-icon size="64" color="grey-lighten-2">mdi-arrow-left</v-icon>
            <h3 class="text-h6 mt-4 text-medium-emphasis">请从左侧选择一个分类</h3>
            <p class="text-body-2 text-medium-emphasis">选择分类后可以查看和管理该分类下的待办事项</p>
          </v-container>

          <v-container v-else-if="currentTodos.length === 0" class="text-center pa-12">
            <v-icon size="64" color="grey-lighten-2">mdi-clipboard-check</v-icon>
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

          <div v-else class="todo-list">
            <!-- 列表头部 -->
            <v-row class="todo-header ma-0 pa-4 bg-grey-lighten-4" no-gutters>
              <v-col cols="2" class="text-body-2 font-weight-bold">编号</v-col>
              <v-col cols="6" class="text-body-2 font-weight-bold">标题</v-col>
              <v-col cols="2" class="text-body-2 font-weight-bold">状态</v-col>
              <v-col cols="2" class="text-body-2 font-weight-bold text-end">操作</v-col>
            </v-row>

            <!-- Todo项列表 -->
            <div class="todo-items">
              <TodoItem
                v-for="item in currentTodos"
                :key="item.id"
                :item="item"
                @edit="handleEditTodo"
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
      timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TodoSidebar from '@/components/TodoSidebar.vue'
import TodoItem from '@/components/TodoItem.vue'
import TodoEditDialog from '@/components/TodoEditDialog.vue'
import {
  CategoryService,
  TodoItemService,
  createCategory,
  createTodoItem,
  initializeDefaultData
} from '@/services/todoService'

// 响应式数据
const categories = ref([])
const todos = ref([])
const selectedCategoryId = ref(null)
const isLoading = ref(false)

// 弹窗状态
const editDialog = ref({
  visible: false,
  item: null
})

const showSettings = ref(false)
const showAbout = ref(false)

// 提示消息
const snackbar = ref({
  visible: false,
  message: '',
  color: 'success'
})

// 计算属性
const selectedCategory = computed(() => {
  return categories.value.find(cat => cat.id === selectedCategoryId.value)
})

const currentTodos = computed(() => {
  if (!selectedCategoryId.value) return []
  return todos.value.filter(todo => todo.categoryId === selectedCategoryId.value)
})

const todoCounts = computed(() => {
  const counts = {}
  categories.value.forEach(category => {
    counts[category.id] = todos.value.filter(todo => todo.categoryId === category.id).length
  })
  return counts
})

// 数据加载
const loadData = async () => {
  isLoading.value = true
  try {
    categories.value = await CategoryService.getAll()
    todos.value = await TodoItemService.getAll()
    
    // 如果没有选中分类且有分类，选中第一个
    if (!selectedCategoryId.value && categories.value.length > 0) {
      selectedCategoryId.value = categories.value[0].id
    }
  } catch (error) {
    showMessage('加载数据失败', 'error')
    console.error('Load data error:', error)
  } finally {
    isLoading.value = false
  }
}

// 分类相关操作
const handleCategorySelect = (category) => {
  selectedCategoryId.value = category.id
}

const handleCategoryToggleExpanded = async (categoryId, isExpanded) => {
  try {
    await CategoryService.updateExpanded(categoryId, isExpanded)
    await loadData()
  } catch (error) {
    showMessage('更新分类状态失败', 'error')
  }
}

const handleCreateCategory = async () => {
  const name = prompt('请输入分类名称:')
  if (!name) return

  try {
    const newCategory = createCategory(
      TodoItemService.generateId(),
      name,
      'mdi-folder-outline'
    )
    await CategoryService.save(newCategory)
    await loadData()
    showMessage('创建分类成功', 'success')
  } catch (error) {
    showMessage('创建分类失败', 'error')
  }
}

const handleEditCategory = async (category) => {
  const name = prompt('请输入新的分类名称:', category.name)
  if (!name || name === category.name) return

  try {
    await CategoryService.save({ ...category, name })
    await loadData()
    showMessage('更新分类成功', 'success')
  } catch (error) {
    showMessage('更新分类失败', 'error')
  }
}

const handleDeleteCategory = async (category) => {
  if (!confirm(`确定要删除分类"${category.name}"吗？这将同时删除该分类下的所有待办事项。`)) {
    return
  }

  try {
    await CategoryService.delete(category.id)
    if (selectedCategoryId.value === category.id) {
      selectedCategoryId.value = null
    }
    await loadData()
    showMessage('删除分类成功', 'success')
  } catch (error) {
    showMessage('删除分类失败', 'error')
  }
}

// Todo相关操作
const handleCreateTodo = () => {
  editDialog.value = {
    visible: true,
    item: null
  }
}

const handleEditTodo = (item) => {
  editDialog.value = {
    visible: true,
    item
  }
}

const handleSaveTodo = async (todoData) => {
  try {
    let savedItem
    if (editDialog.value.item) {
      // 编辑模式
      savedItem = await TodoItemService.save(todoData)
      showMessage('更新待办成功', 'success')
    } else {
      // 创建模式
      const newItem = createTodoItem(
        TodoItemService.generateId(),
        todoData.categoryId,
        todoData.title,
        todoData.customNumber,
        todoData.description,
        todoData.priority,
        todoData.status
      )
      // 合并其他字段
      Object.assign(newItem, {
        tags: Array.isArray(todoData.tags) ? [...todoData.tags] : [],
        dueDate: todoData.dueDate,
        assignee: todoData.assignee,
        attachments: Array.isArray(todoData.attachments) ? [...todoData.attachments] : []
      })
      savedItem = await TodoItemService.save(newItem)
      showMessage('创建待办成功', 'success')
    }
    
    editDialog.value.visible = false
    await loadData()
  } catch (error) {
    showMessage('保存待办失败', 'error')
    console.error('Save todo error:', error)
  }
}

const handleDeleteTodo = async (item) => {
  try {
    await TodoItemService.delete(item.id)
    editDialog.value.visible = false
    await loadData()
    showMessage('删除待办成功', 'success')
  } catch (error) {
    showMessage('删除待办失败', 'error')
  }
}

// 工具方法
const showMessage = (message, color = 'success') => {
  snackbar.value = {
    visible: true,
    message,
    color
  }
}

// 组件挂载
onMounted(async () => {
  await initializeDefaultData()
  await loadData()
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

.todo-header {
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.todo-items {
  background: white;
}

.v-toolbar {
  background: white !important;
}
</style>
