<template>
  <div class="relative h-full flex flex-col">
    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden">
      <!-- 加载状态 -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center h-[200px]"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="40"
        />
        <p class="text-body-2 mt-2">加载中...</p>
      </div>

      <!-- 空状态 -->
      <EmptyState
        v-else-if="todos.length === 0"
        :icon="emptyStateConfig.icon"
        :title="emptyStateConfig.title"
        :description="emptyStateConfig.description"
        :show-action="emptyStateConfig.showAction"
        :action-text="emptyStateConfig.actionText"
        :action-icon="emptyStateConfig.actionIcon"
        @action="handleEmptyAction"
      />

      <!-- 数据列表 -->
      <div
        v-else
        class="h-full overflow-auto"
      >
        <!-- 表格视图 -->
        <div
          v-if="viewMode === 'table'"
          class="h-full"
        >
          <DataTable
            :data="enhancedTodos"
            :columns="tableColumns"
            :selectable="selectable"
            :selected-items="selectedTodos"
            :loading="loading"
            :sort-by="sortBy"
            :sort-order="sortOrder"
            @update:selected-items="handleSelectionChange"
            @update:sort-by="handleSortChange"
            @update:sort-order="handleSortOrderChange"
            @row-click="handleTodoClick"
            @sort="handleSort"
          >
            <!-- 编号列 -->
            <template #cell-number="{ item }">
              <v-btn
                variant="text"
                density="compact"
                @click.stop="copyText(item.displayNumber, '编号')"
              >
                <v-icon
                  size="small"
                  class="me-1"
                >
                  mdi-hashtag
                </v-icon>
                {{ item.displayNumber }}
              </v-btn>
            </template>

            <!-- 标题列 -->
            <template #cell-title="{ item }">
              <div class="todo-title">
                <v-tooltip
                  :text="item.description || '暂无描述'"
                  location="bottom"
                >
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      variant="text"
                      density="compact"
                      @click.stop="copyText(item.title, '标题')"
                    >
                      <v-icon
                        :color="item.statusColor"
                        size="small"
                      >
                        {{ item.priorityIcon }}
                      </v-icon>
                      {{ item.title }}
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>

            <!-- 截止日期列 -->
            <template #cell-endDate="{ item }">
              <div class="todo-date flex items-center">
                <v-btn
                  variant="text"
                  density="compact"
                  :class="{ 'text-error': item.isOverdue }"
                  @click.stop="copyText(item.formattedEndDate || '未设置', '截止日期')"
                >
                  {{ item.formattedEndDate || '未设置' }}
                </v-btn>
                <span
                  v-if="item.remainingDays"
                  class="text-caption font-bold"
                  :class="getRemainingDaysClass(item)"
                >
                  ({{ item.remainingDays }})
                </span>
              </div>
            </template>

            <!-- 状态列 -->
            <template #cell-status="{ item }">
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-chip
                    v-bind="menuProps"
                    :color="item.statusColor"
                    size="small"
                    variant="flat"
                  >
                    {{ item.statusText }}
                    <v-icon
                      size="small"
                      class="ms-1"
                    >
                      mdi-chevron-down
                    </v-icon>
                  </v-chip>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-for="(status, key) in statusOptions"
                    :key="key"
                    :title="status.text"
                    @click="handleStatusChange({ todo: item, newStatus: key })"
                  >
                    <template #prepend>
                      <v-icon
                        size="small"
                        :color="status.color"
                      >
                        mdi-circle
                      </v-icon>
                    </template>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>

            <!-- 分类列 -->
            <template
              v-if="showCategory"
              #cell-category="{ item }"
            >
              <v-btn
                variant="text"
                density="compact"
                size="small"
                @click.stop="copyText(item.categoryName, '分类')"
              >
                <v-icon
                  size="small"
                  class="me-1"
                >
                  {{ item.categoryIcon }}
                </v-icon>
                {{ item.categoryName }}
              </v-btn>
            </template>

            <!-- 操作列 -->
            <template #cell-actions="{ item }">
              <v-btn-group
                variant="text"
                density="compact"
              >
                <v-btn
                  size="small"
                  icon="mdi-pencil"
                  @click.stop="handleEdit(item)"
                  color="primary"
                />
                <v-btn
                  size="small"
                  icon="mdi-content-copy"
                  @click.stop="copyFullInfo(item)"
                  color="info"
                />
                <v-btn
                  size="small"
                  :icon="item.archived ? 'mdi-archive-off' : 'mdi-archive'"
                  @click.stop="handleArchive(item)"
                  :color="item.archived ? 'warning' : 'grey'"
                />
              </v-btn-group>
            </template>
          </DataTable>
        </div>

        <!-- 卡片视图 -->
        <div
          v-else-if="viewMode === 'card'"
          class="p-4"
        >
          <v-row>
            <v-col
              v-for="todo in todos"
              :key="todo.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <TodoItem
                :todo="todo"
                :category="getCategoryById(todo.categoryId)"
                :view-mode="'card'"
                :show-category="showCategory"
                :selectable="selectable"
                :selected-items="selectedTodos"
                @edit="handleEdit"
                @status-change="handleStatusChange"
                @archive="handleArchive"
                @copy="handleCopy"
                @click="handleTodoClick"
                @select="handleTodoSelect"
              />
            </v-col>
          </v-row>
        </div>

        <!-- 网格视图 -->
        <div
          v-else-if="viewMode === 'grid'"
          class="p-4"
        >
          <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            <TodoItem
              v-for="todo in todos"
              :key="todo.id"
              :todo="todo"
              :category="getCategoryById(todo.categoryId)"
              :view-mode="'card'"
              :show-category="showCategory"
              :selectable="selectable"
              :selected-items="selectedTodos"
              @edit="handleEdit"
              @status-change="handleStatusChange"
              @archive="handleArchive"
              @copy="handleCopy"
              @click="handleTodoClick"
              @select="handleTodoSelect"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div
      v-if="selectedTodos.length > 0"
      class="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000]"
    >
      <v-card
        elevation="4"
        class="min-w-[400px] rounded-[28px]"
      >
        <v-card-text class="flex items-center">
          <span class="text-subtitle-2">已选择 {{ selectedTodos.length }} 项</span>
          <v-spacer />
          <v-btn-group variant="outlined">
            <v-btn
              size="small"
              prepend-icon="mdi-check-all"
              @click="batchUpdateStatus('completed')"
            >
              标记完成
            </v-btn>
            <v-btn
              size="small"
              prepend-icon="mdi-archive"
              @click="batchArchive(true)"
            >
              批量归档
            </v-btn>
            <v-btn
              size="small"
              prepend-icon="mdi-close"
              @click="clearSelection"
            >
              清除选择
            </v-btn>
          </v-btn-group>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TodoItem from './TodoItem.vue'
import DataTable from '@/components/base/DataTable.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { TodoBusinessService } from '@/services/todoBusinessService'

const props = defineProps({
  // 待办事项数据
  todos: {
    type: Array,
    default: () => [],
  },
  // 分类数据
  categories: {
    type: Array,
    default: () => [],
  },
  // 视图模式
  viewMode: {
    type: String,
    default: 'table',
    validator: (value) => ['table', 'card', 'grid'].includes(value),
  },
  // 是否显示分类
  showCategory: {
    type: Boolean,
    default: false,
  },
  // 是否可选择
  selectable: {
    type: Boolean,
    default: false,
  },
  // 选中的待办事项
  selectedTodos: {
    type: Array,
    default: () => [],
  },
  // 排序字段
  sortBy: {
    type: String,
    default: 'endDate',
  },
  // 排序顺序
  sortOrder: {
    type: String,
    default: 'asc',
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false,
  },
  // 空状态配置
  emptyStateConfig: {
    type: Object,
    default: () => ({
      icon: 'mdi-clipboard-check',
      title: '还没有待办事项',
      description: '点击"新增待办"创建第一个待办事项',
      showAction: true,
      actionText: '新增待办',
      actionIcon: 'mdi-plus',
    }),
  },
})

const emit = defineEmits([
  'edit',
  'status-change',
  'archive',
  'copy',
  'click',
  'select',
  'sort',
  'empty-action',
  'batch-update-status',
  'batch-archive',
])

// 表格列配置
const tableColumns = computed(() => {
  return TodoBusinessService.getTableColumns(props.viewMode, props.showCategory)
})

// 增强的待办事项数据（添加显示相关的计算属性）
const enhancedTodos = computed(() => {
  return props.todos.map((todo) => {
    const category = getCategoryById(todo.categoryId)
    return TodoBusinessService.formatTodoForDisplay(todo, category)
  })
})

// 状态选项
const statusOptions = computed(() => {
  return TodoBusinessService.getStatusConfig() || {}
})

// 工具函数
const getCategoryById = (categoryId) => {
  return props.categories.find((cat) => cat.id === categoryId)
}

const copyText = (text, type) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
    // 这里可以添加toast提示
  }
}

const copyFullInfo = (todo) => {
  const fullInfo = TodoBusinessService.getTodoFullInfo(todo)
  copyText(fullInfo, '完整信息')
}

const getRemainingDaysClass = (todo) => {
  if (todo.isOverdue) return 'text-error'
  if (todo.remainingDays && todo.remainingDays.includes('今天')) return 'text-warning'
  return 'text-success'
}

// 事件处理
const handleEdit = (todo) => {
  emit('edit', todo)
}

const handleStatusChange = ({ todo, newStatus }) => {
  emit('status-change', { todo, newStatus })
}

const handleArchive = (todo) => {
  emit('archive', todo)
}

const handleCopy = (copyData) => {
  emit('copy', copyData)
}

const handleTodoClick = (todo) => {
  emit('click', todo)
}

const handleTodoSelect = (todo) => {
  emit('select', todo)
}

const handleSelectionChange = (selectedItems) => {
  emit('select', selectedItems)
}

const handleSort = (sortConfig) => {
  emit('sort', sortConfig)
}

const handleSortChange = (field) => {
  emit('sort', { field, order: props.sortOrder })
}

const handleSortOrderChange = (order) => {
  emit('sort', { field: props.sortBy, order })
}

const handleEmptyAction = () => {
  emit('empty-action')
}

// 批量操作
const batchUpdateStatus = (status) => {
  emit('batch-update-status', { todos: props.selectedTodos, status })
}

const batchArchive = (archived) => {
  emit('batch-archive', { todos: props.selectedTodos, archived })
}

const clearSelection = () => {
  emit('select', [])
}
</script>
