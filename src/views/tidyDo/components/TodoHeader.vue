<template>
  <v-toolbar
    flat
    class="border-b"
  >
    <v-toolbar-title class="d-flex align-center">
      <v-icon class="me-2">{{
        appStore.viewAllMode ? 'mdi-view-list' : appStore.selectedCategory?.icon || 'mdi-folder'
      }}</v-icon>
      {{ appStore.viewAllMode ? '全部待办' : appStore.selectedCategory?.name || '请选择分类' }}
      <v-chip
        v-if="appStore.currentTodos.length > 0"
        size="small"
        class="ms-2"
        color="primary"
        variant="tonal"
      >
        {{ appStore.currentTodos.length }}
      </v-chip>
      <v-chip
        v-if="appStore.selectedCategory?.isFilterCategory"
        size="small"
        class="ms-2"
        color="warning"
        variant="tonal"
      >
        筛选类
      </v-chip>
    </v-toolbar-title>

    <v-spacer />

    <!-- 搜索框 -->
    <div class="search-container me-4">
      <v-text-field
        v-model="appStore.searchQuery"
        placeholder="搜索待办事项..."
        density="compact"
        variant="outlined"
        hide-details
        clearable
        class="search-field"
        style="max-height: 36px"
        @update:model-value="appStore.setSearchQuery"
      >
        <template v-slot:prepend-inner>
          <v-icon
            size="small"
            :color="appStore.searchQuery ? 'primary' : 'grey'"
          >
            mdi-magnify
          </v-icon>
        </template>
      </v-text-field>
    </div>

    <!-- 工具按钮 -->
    <v-btn-group
      variant="outlined"
      density="comfortable"
    >
      <v-btn
        v-if="appStore.viewAllMode"
        prepend-icon="mdi-close"
        @click="appStore.exitViewAllMode"
        color="warning"
      >
        退出全部视图
      </v-btn>
      <v-btn
        prepend-icon="mdi-plus"
        @click="handleCreateTodoClick"
        :disabled="isCreateButtonDisabled"
      >
        新增待办
      </v-btn>
      <v-btn
        @click="todosStore.toggleShowArchived"
        :prepend-icon="todosStore.showArchived ? 'mdi-eye-off' : 'mdi-eye'"
      >
        {{ todosStore.showArchived ? '隐藏归档' : '显示归档' }}
      </v-btn>
      <v-btn
        icon="mdi-refresh"
        @click="todosStore.loadTodos"
        :loading="todosStore.isLoading"
      />
    </v-btn-group>
  </v-toolbar>

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
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useTodosStore } from '@/stores/useTodosStore'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useDialog } from '@/composables/useDialog'
import { useNotification } from '@/composables/useNotification'
import TodoEditDialog from '@/model/TodoEditDialog.vue'

// 使用store
const appStore = useAppStore()
const todosStore = useTodosStore()
const categoriesStore = useCategoriesStore()

// 通知和弹窗管理
const { showSuccess, showError } = useNotification()
const todoEditDialog = useDialog()

// 计算按钮禁用状态
const isCreateButtonDisabled = computed(() => {
  const disabled = (!appStore.selectedCategory && !appStore.viewAllMode) ||
    appStore.selectedCategory?.isFilterCategory  
  return disabled
})

// 处理创建待办点击
const handleCreateTodoClick = () => {
  if (!isCreateButtonDisabled.value) {
    if (appStore.viewAllMode) {
      // 在查看全部模式下，创建时需要用户选择分类
      const defaultCategoryId = categoriesStore.categories.length > 0 ? categoriesStore.categories[0].id : null
      todoEditDialog.show({ categoryId: defaultCategoryId })
    } else {
      todoEditDialog.show(null)
    }
  }
}

// 处理保存待办
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

// 处理删除待办
const handleDeleteTodo = async (item) => {
  try {
    await todosStore.deleteTodo(item.id)
    todoEditDialog.hide()
    showSuccess('删除待办成功')
  } catch (error) {
    showError('删除待办失败')
  }
}
</script>

<style scoped>
.search-container {
  width: 300px;
}

.search-field {
  max-width: 300px;
}

.search-field .v-field__input {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
