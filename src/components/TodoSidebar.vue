<template>
  <div>
    <v-navigation-drawer
      v-model="isDrawerOpen"
      :rail="isRailMode"
      permanent
      class="todo-sidebar"
      width="280"
      rail-width="72"
    >
      <!-- 侧边栏头部 -->
      <v-list-item class="sidebar-header">
        <template v-slot:prepend>
          <v-icon>mdi-clipboard-check-multiple</v-icon>
        </template>
        <v-list-item-title class="text-h6 font-weight-bold"> TidyDo </v-list-item-title>
      </v-list-item>

      <v-divider></v-divider>

      <!-- 分类列表 -->
      <div class="category-list-container">
        <!-- 拖拽指示线 -->
        <div
          v-if="dragState.dropLinePosition?.visible"
          class="drag-drop-line"
          :style="{ top: `${dragState.dropLinePosition.top}px` }"
        />

        <v-list
          density="compact"
          nav
        >
          <!-- 分类项 -->
          <div
            v-for="(category, index) in categories"
            :key="category.id"
            :data-category-id="category.id"
            :data-category-index="index"
            class="category-wrapper"
            :class="{ 'dragging': dragState.isDragging && dragState.draggedCategoryId === category.id }"
          >
            <v-list-item
              :prepend-icon="category.icon"
              :title="category.name"
              :active="selectedCategoryId === category.id"
              @click="handleCategoryClick(category)"
              class="category-item"
            >
              <template
                v-slot:append
                v-if="!isRailMode"
              >
                <div class="category-actions">
                  <span
                    v-if="!category.isFilterCategory"
                    class="text-caption"
                  >
                    {{ getCategoryTodoCount(category.id) }}
                  </span>

                  <!-- 分类菜单 -->
                  <v-menu
                    location="bottom end"
                    :disabled="dragState.isDragging"
                  >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        icon
                        size="x-small"
                        variant="text"
                        v-bind="props"
                        @click.stop
                        @mousedown="handleMenuMouseDown(category, $event)"
                        @mouseup="handleMenuMouseUp"
                        @mouseleave="handleMenuMouseLeave"
                        @touchstart="handleMenuTouchStart(category, $event)"
                        @touchend="handleMenuTouchEnd"
                        class="category-menu-btn"
                        :class="{ 'drag-handle': dragState.isDragging && dragState.draggedCategoryId === category.id }"
                      >
                        <v-icon size="small">mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item
                        prepend-icon="mdi-arrow-up"
                        title="上移"
                        @click="handleMoveCategoryUp(category)"
                        :disabled="isFirstCategory(category.id)"
                      />
                      <v-list-item
                        prepend-icon="mdi-arrow-down"
                        title="下移"
                        @click="handleMoveCategoryDown(category)"
                        :disabled="isLastCategory(category.id)"
                      />
                      <v-divider />
                      <v-list-item
                        prepend-icon="mdi-pencil"
                        title="编辑"
                        @click="handleEditCategory(category)"
                      />
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="删除"
                        @click="handleDeleteCategory(category)"
                      />
                    </v-list>
                  </v-menu>
                </div>
              </template>
            </v-list-item>
          </div>
        </v-list>
      </div>

      <!-- 底部工具栏 -->
      <template v-slot:append>
        <v-divider></v-divider>
        <v-list density="compact">
          <!-- 新建分类按钮 - 现在在两种模式下都显示 -->
          <v-list-item
            prepend-icon="mdi-plus"
            :title="isRailMode ? '' : '新建分类'"
            @click="handleCreateCategory"
            class="create-category-btn"
          />
          <v-divider
            v-if="!isRailMode"
            class="my-1"
          />
          <v-list-item
            prepend-icon="mdi-view-list"
            :title="isRailMode ? '' : '查看全部'"
            @click="$emit('view-all')"
            class="view-all-btn"
          />
          <v-list-item
            prepend-icon="mdi-chevron-double-left"
            :title="isRailMode ? '' : '收起侧边栏'"
            @click="toggleRailMode"
          >
            <template v-slot:prepend>
              <v-icon>{{
                isRailMode ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'
              }}</v-icon>
            </template>
          </v-list-item>
          <v-list-item
            prepend-icon="mdi-cog"
            :title="isRailMode ? '' : '设置'"
            @click="handleSettingsClick"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- 配置对话框 -->
    <config-dialog
      v-model="isConfigDialogVisible"
      @config-updated="handleConfigUpdated"
    />

    <!-- 分类编辑对话框 -->
    <category-edit-dialog
      v-model="isCategoryDialogVisible"
      :category="editingCategory"
      :categories="categories"
      @save="handleSaveCategory"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ConfigDialog from '@/model/ConfigDialog.vue'
import CategoryEditDialog from '@/model/CategoryEditDialog.vue'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useDragSort } from '@/composables/useDragSort'

const props = defineProps({
  selectedCategoryId: {
    type: String,
    default: null,
  },
  todoCounts: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'category-select',
  'category-updated', // 当分类数据发生变化时触发
  'show-about',
  'view-all',
])

// 使用分类管理 Pinia Store
const categoriesStore = useCategoriesStore()

// 本地计算属性
const categories = computed(() => categoriesStore.categories)

// 内部状态
const isDrawerOpen = ref(true)
const isRailMode = ref(false)
const isConfigDialogVisible = ref(false)
const isCategoryDialogVisible = ref(false)
const editingCategory = ref(null)

// 提示消息
const snackbar = ref({
  visible: false,
  message: '',
  color: 'success',
  timeout: 2000,
})

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} color - 消息颜色类型
 */
const showMessage = (message, color = 'success') => {
  snackbar.value = {
    visible: true,
    message,
    color,
    timeout: 2000,
  }
}

// 拖拽排序功能
const { dragState, startLongPress, cancelLongPress, cleanup } = useDragSort({
  onReorder: async (categoryId, targetIndex) => {
    await categoriesStore.reorderCategoriesByDrag(categoryId, targetIndex)
    emit('category-updated', categories.value)
  },
  onMessage: showMessage
})

// 创建分类
const handleCreateCategory = async () => {
  editingCategory.value = null
  isCategoryDialogVisible.value = true
}

// 编辑分类
const handleEditCategory = async (category) => {
  editingCategory.value = category
  isCategoryDialogVisible.value = true
}

// 删除分类
const handleDeleteCategory = async (category) => {
  if (!confirm(`确定要删除分类"${category.name}"吗？这将同时删除该分类下的所有待办事项。`)) {
    return
  }

  try {
    await categoriesStore.deleteCategory(category.id)

    // 如果删除的是当前选中的分类，需要通知父组件
    if (props.selectedCategoryId === category.id) {
      const newCategory = categories.value.length > 0 ? categories.value[0] : null
      emit('category-select', newCategory)
    }

    // 通知父组件分类数据已更新
    emit('category-updated', categories.value)
    showMessage('删除分类成功', 'success')
  } catch (error) {
    showMessage('删除分类失败', 'error')
  }
}

// 上移分类
const handleMoveCategoryUp = async (category) => {
  try {
    const success = await categoriesStore.moveCategoryOrder(category.id, 'up')
    if (success) {
      // 通知父组件分类数据已更新
      emit('category-updated', categories.value)
      showMessage('分类上移成功', 'success')
    } else {
      showMessage('无法上移该分类', 'warning')
    }
  } catch (error) {
    showMessage('分类上移失败', 'error')
  }
}

// 下移分类
const handleMoveCategoryDown = async (category) => {
  try {
    const success = await categoriesStore.moveCategoryOrder(category.id, 'down')
    if (success) {
      // 通知父组件分类数据已更新
      emit('category-updated', categories.value)
      showMessage('分类下移成功', 'success')
    } else {
      showMessage('无法下移该分类', 'warning')
    }
  } catch (error) {
    showMessage('分类下移失败', 'error')
  }
}

// 判断是否为第一个分类
const isFirstCategory = (categoryId) => {
  return categories.value.findIndex(cat => cat.id === categoryId) === 0
}

// 判断是否为最后一个分类
const isLastCategory = (categoryId) => {
  return categories.value.findIndex(cat => cat.id === categoryId) === categories.value.length - 1
}

// 切换轨道模式
const toggleRailMode = () => {
  isRailMode.value = !isRailMode.value
  // 确保drawer始终开启
  isDrawerOpen.value = true
}

// 处理分类点击
const handleCategoryClick = (category) => {
  emit('category-select', category)
}

// 处理配置更新
const handleConfigUpdated = () => {
  console.log('配置已更新')
}

// 获取分类下的todo数量
const getCategoryTodoCount = (categoryId) => {
  return props.todoCounts[categoryId] || 0
}

// 设置按钮点击处理
const handleSettingsClick = () => {
  isConfigDialogVisible.value = true
}

// 处理保存分类
const handleSaveCategory = async (categoryData) => {
  try {
    if (editingCategory.value) {
      // 编辑模式 - 确保数据结构正确
      const updates = {
        name: categoryData.name,
        icon: categoryData.icon,
        isFilterCategory: categoryData.isFilterCategory,
        isSimpleTodo: categoryData.isSimpleTodo,
        filterConditions: categoryData.filterConditions,
      }
      await categoriesStore.updateCategory(editingCategory.value, updates)
      showMessage('更新分类成功', 'success')
    } else {
      // 新建模式
      await categoriesStore.createNewCategory(
        categoryData.name,
        categoryData.icon,
        categoryData.isFilterCategory,
        categoryData.isSimpleTodo,
        categoryData.filterConditions,
      )
      showMessage('创建分类成功', 'success')
    }
    // 通知父组件分类数据已更新
    emit('category-updated', categories.value)
  } catch (error) {
    console.error('保存分类失败：', error)
    showMessage(editingCategory.value ? '更新分类失败' : '创建分类失败', 'error')
  }
}

// ==================== 拖拽功能相关方法 ====================

/**
 * 处理菜单按钮的鼠标按下事件
 * @param {Object} category - 分类对象
 * @param {MouseEvent} event - 鼠标事件
 */
const handleMenuMouseDown = (category, event) => {
  startLongPress(category, event)
}

/**
 * 处理菜单按钮的鼠标抬起事件
 */
const handleMenuMouseUp = () => {
  cancelLongPress()
}

/**
 * 处理菜单按钮的鼠标离开事件
 */
const handleMenuMouseLeave = () => {
  cancelLongPress()
}

/**
 * 处理菜单按钮的触摸开始事件
 * @param {Object} category - 分类对象
 * @param {TouchEvent} event - 触摸事件
 */
const handleMenuTouchStart = (category, event) => {
  startLongPress(category, event)
}

/**
 * 处理菜单按钮的触摸结束事件
 */
const handleMenuTouchEnd = () => {
  cancelLongPress()
}

// 暴露方法给父组件使用
defineExpose({
  loadCategories: categoriesStore.loadCategories,
  categories,
})

// 组件挂载时确保分类数据已加载
onMounted(async () => {
  // 如果还没有分类数据，等待一下让应用初始化完成
  if (categories.value.length === 0) {
    setTimeout(() => {
      // 通知父组件分类数据已更新
      emit('category-updated', categories.value)
    }, 100)
  } else {
    // 立即通知父组件分类数据已更新
    emit('category-updated', categories.value)
  }
})

// 组件卸载时清理拖拽相关资源
onUnmounted(() => {
  cleanup()
})
</script>

<style lang="scss" scoped>
.todo-sidebar {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.create-category-btn {
  margin: 0 8px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }
}

.category-item {
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background-color: #eff6ff;
  }

  &.v-list-item--active {
    background-color: #dbeafe;
    color: #2563eb;
  }
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 拖拽相关样式 */
.category-list-container {
  position: relative;
}

.drag-drop-line {
  position: fixed;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #1976d2, #42a5f5);
  border-radius: 1px;
  box-shadow: 0 0 4px rgba(25, 118, 210, 0.5);
  z-index: 1000;
  pointer-events: none;
  animation: dragLinePulse 1s ease-in-out infinite alternate;
}

@keyframes dragLinePulse {
  from { opacity: 0.8; }
  to { opacity: 1; }
}

.category-wrapper {
  position: relative;
  transition: all 0.2s ease;

  &.dragging {
    opacity: 0.7;
    transform: scale(1.02);
    z-index: 999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.category-menu-btn {
  transition: all 0.2s ease;

  &.drag-handle {
    background-color: #1976d2 !important;
    color: white !important;
    cursor: grabbing;

    &:hover {
      background-color: #1565c0 !important;
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

.todo-count-item {
  margin-left: 16px;
  padding-left: 16px;
  border-left: 2px solid rgba(0, 0, 0, 0.08);
}

.v-navigation-drawer--rail {
  .category-actions {
    display: none;
  }
}

.rail-create-btn {
  margin: 4px 8px;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }
}

.view-all-btn {
  transition: all 0.2s;

  &:hover {
    background-color: #eff6ff;
  }
}
</style>
