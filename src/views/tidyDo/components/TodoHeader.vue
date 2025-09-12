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

    <!-- 视图切换组件 (简单Todo大类时隐藏) -->
    <div
      v-if="!appStore.selectedCategory?.isSimpleTodo"
      class="view-switcher-container me-4"
    >
      <v-btn-toggle
        :model-value="appStore.viewMode"
        @update:model-value="appStore.setViewMode"
        variant="outlined"
        density="comfortable"
        mandatory
        class="view-switcher"
        color="primary"
      >
        <v-btn
          value="table"
          prepend-icon="mdi-table"
          class="view-btn"
        >
          <span class="d-none d-sm-inline">表格</span>
        </v-btn>
        <v-btn
          value="timeline"
          prepend-icon="mdi-timeline"
          class="view-btn"
        >
          <span class="d-none d-sm-inline">时间线</span>
        </v-btn>
        <v-btn
          value="calendar"
          prepend-icon="mdi-calendar"
          class="view-btn"
        >
          <span class="d-none d-sm-inline">日历</span>
        </v-btn>
        <!-- 报表视图 (只在查看全部模式下显示) -->
        <v-btn
          v-if="appStore.viewAllMode"
          value="report"
          prepend-icon="mdi-chart-box"
          class="view-btn"
        >
          <span class="d-none d-sm-inline">报表</span>
        </v-btn>
      </v-btn-toggle>
    </div>

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

    <!-- 功能按钮组 -->
    <v-btn-group
      variant="outlined"
      density="comfortable"
      class="action-buttons"
    >
      <v-btn
        v-if="appStore.viewAllMode"
        prepend-icon="mdi-close"
        @click="appStore.exitViewAllMode"
        color="warning"
      >
        <span class="d-none d-md-inline">退出全部视图</span>
      </v-btn>
      <v-btn
        prepend-icon="mdi-plus"
        @click="handleCreateTodoClick"
        :disabled="isCreateButtonDisabled"
        color="primary"
      >
        <span class="d-none d-sm-inline">新增待办</span>
      </v-btn>
      <v-btn
        @click="todosStore.toggleShowArchived"
        :prepend-icon="todosStore.showArchived ? 'mdi-eye-off' : 'mdi-eye'"
      >
        <span class="d-none d-md-inline">{{ todosStore.showArchived ? '隐藏归档' : '显示归档' }}</span>
      </v-btn>
      <v-btn
        icon="mdi-download"
        @click="handleExportBackup"
        :loading="isExporting"
        title="导出备份"
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
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useTodosStore } from '@/stores/useTodosStore'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useDialog } from '@/composables/useDialog'
import { useNotification } from '@/composables/useNotification'
import { DataService } from '@/services/dataService'
import TodoEditDialog from '@/model/TodoEditDialog.vue'

// 使用store
const appStore = useAppStore()
const todosStore = useTodosStore()
const categoriesStore = useCategoriesStore()

// 通知和弹窗管理
const { showSuccess, showError } = useNotification()
const todoEditDialog = useDialog()

// 导出状态
const isExporting = ref(false)

// 计算按钮禁用状态
const isCreateButtonDisabled = computed(() => {
  const disabled = (!appStore.selectedCategory && !appStore.viewAllMode) ||
    appStore.selectedCategory?.isFilterCategory ||
    appStore.selectedCategory?.isSimpleTodo  // 简单Todo大类时禁用创建按钮
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

// 处理导出备份
const handleExportBackup = async () => {
  isExporting.value = true
  try {
    const exportData = await DataService.exportAllData()

    // 直接使用传统下载方式，不管浏览器支持情况
    DataService.downloadAsJSON(exportData)
    showSuccess('备份导出成功！请检查下载文件夹')
  } catch (error) {
    console.error('导出备份失败：', error)
    showError('导出备份失败')
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
/* 视图切换组件样式 */
.view-switcher-container {
  display: flex;
  align-items: center;
}

.view-switcher {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: #EEEEEE;
}

.view-switcher .v-btn-toggle__selected {
  background: rgb(var(--v-theme-primary));
  color: white;
}

.view-btn {
  min-width: 44px;
  transition: all 0.2s ease;
}

.view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.view-btn .v-icon {
  margin-right: 4px;
}

/* 搜索框样式 */
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

/* 功能按钮组样式 */
.action-buttons {
  border-radius: 6px;
}

.action-buttons .v-btn {
  transition: all 0.2s ease;
}

.action-buttons .v-btn:hover {
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 960px) {
  .search-container {
    width: 200px;
  }

  .search-field {
    max-width: 200px;
  }
}

@media (max-width: 600px) {
  .view-switcher-container {
    margin-right: 8px;
  }

  .search-container {
    width: 150px;
    margin-right: 8px;
  }

  .search-field {
    max-width: 150px;
  }

  .view-btn {
    min-width: 36px;
    padding: 0 8px;
  }

  .action-buttons .v-btn {
    min-width: 36px;
    padding: 0 8px;
  }
}

@media (max-width: 480px) {
  .search-container {
    width: 120px;
  }

  .search-field {
    max-width: 120px;
  }

  .view-btn {
    min-width: 32px;
    padding: 0 6px;
  }

  .view-btn .v-icon {
    margin-right: 0;
  }
}
</style>
