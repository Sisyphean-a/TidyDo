<template>
  <div class="todo-timeline">
    <!-- 时间线排序控制 -->
    <v-card
      flat
      class="mb-4"
    >
      <v-card-text class="d-flex align-center justify-space-between py-2">
        <div class="d-flex align-center">
          <v-icon class="me-2">mdi-sort</v-icon>
          <span class="text-body-2">排序依据：</span>
        </div>
        <v-btn-toggle
          v-model="sortMode"
          variant="outlined"
          density="compact"
          mandatory
        >
          <v-btn
            value="createdAt"
            size="small"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-plus
            </v-icon>
            创建时间
          </v-btn>
          <v-btn
            value="endDate"
            size="small"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-clock
            </v-icon>
            截止时间
          </v-btn>
          <v-btn
            value="updatedAt"
            size="small"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-edit
            </v-icon>
            更新时间
          </v-btn>
        </v-btn-toggle>
        <v-btn
          @click="toggleSortOrder"
          :icon="sortOrder === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
          variant="outlined"
          density="compact"
          :title="sortOrder === 'asc' ? '升序' : '降序'"
        />
      </v-card-text>
    </v-card>

    <!-- 时间线内容 -->
    <v-container
      v-if="timelineGroups.length === 0"
      class="text-center pa-12"
    >
      <v-icon
        size="64"
        color="grey-lighten-2"
      >
        mdi-timeline
      </v-icon>
      <h3 class="text-h6 mt-4 text-medium-emphasis">没有待办事项</h3>
      <p class="text-body-2 text-medium-emphasis">当前筛选条件下没有可显示的待办事项</p>
    </v-container>

    <v-timeline
      v-else
      side="end"
      line-inset="8"
      class="timeline-container"
    >
      <v-timeline-item
        v-for="group in timelineGroups"
        :key="group.date"
        dot-color="primary"
        size="small"
        class="timeline-item"
      >
        <template v-slot:icon>
          <v-icon
            color="primary"
            size="small"
          >
            mdi-calendar
          </v-icon>
        </template>

        <template v-slot:opposite>
          <div class="timeline-date">
            <div class="text-body-1 font-weight-medium">
              {{ group.date }}
            </div>
            <div class="text-caption text-medium-emphasis">{{ group.items.length }} 项待办</div>
          </div>
        </template>

        <v-card
          elevation="1"
          class="timeline-group-card"
        >
          <v-card-text class="pa-3">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="timeline-item-row"
            >
              <div class="d-flex align-center">
                <!-- 状态指示 -->
                <v-icon
                  :color="getStatusColor(item.status)"
                  size="small"
                  class="me-2"
                >
                  {{ getStatusIcon(item.status) }}
                </v-icon>

                <!-- 分类标签 -->
                <v-chip
                  v-if="
                    viewAllMode ||
                    categoriesStore.getCategoryById(item.categoryId)?.isFilterCategory
                  "
                  size="x-small"
                  class="me-2"
                  :color="categoriesStore.getCategoryById(item.categoryId)?.color || 'grey'"
                  variant="tonal"
                >
                  <v-icon
                    start
                    size="x-small"
                  >
                    {{ categoriesStore.getCategoryById(item.categoryId)?.icon }}
                  </v-icon>
                  {{ categoriesStore.getCategoryById(item.categoryId)?.name }}
                </v-chip>

                <!-- 标题 -->
                <span
                  class="timeline-item-title flex-grow-1"
                  :class="{ 'timeline-item-archived': item.archived }"
                  v-html="highlightSearchQuery(item.title)"
                />

                <!-- 标签 -->
                <div
                  v-if="item.tags?.length"
                  class="d-flex align-center me-2"
                >
                  <v-chip
                    v-for="tag in item.tags.slice(0, 2)"
                    :key="tag"
                    size="x-small"
                    class="me-1"
                    color="primary"
                    variant="outlined"
                  >
                    {{ tag }}
                  </v-chip>
                  <v-tooltip
                    v-if="item.tags.length > 2"
                    :text="item.tags.slice(2).join(', ')"
                    location="top"
                  >
                    <template v-slot:activator="{ props }">
                      <v-chip
                        size="x-small"
                        color="grey"
                        variant="outlined"
                        v-bind="props"
                      >
                        +{{ item.tags.length - 2 }}
                      </v-chip>
                    </template>
                  </v-tooltip>
                </div>

                <!-- 优先级 -->
                <v-icon
                  v-if="item.priority && item.priority !== 'medium'"
                  :color="getPriorityColor(item.priority)"
                  size="small"
                  class="me-1"
                  :title="getPriorityText(item.priority)"
                >
                  {{ getPriorityIcon(item.priority) }}
                </v-icon>

                <!-- 状态标签 -->
                <v-chip
                  :color="getStatusColor(item.status)"
                  size="x-small"
                  variant="tonal"
                  class="text-caption"
                >
                  {{ getStatusText(item.status) }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useConfig } from '@/composables/useConfig'

// Store 和 Composables
const categoriesStore = useCategoriesStore()
const {
  getStatusColor,
  getStatusText,
  getStatusIcon,
  getPriorityColor,
  getPriorityText,
  getPriorityIcon,
} = useConfig()

// Props
const props = defineProps({
  todos: {
    type: Array,
    required: true,
    default: () => [],
  },
  viewAllMode: {
    type: Boolean,
    default: false,
  },
  searchQuery: {
    type: String,
    default: '',
  },
})

// 本地状态
const sortMode = ref('endDate')
const sortOrder = ref('desc')

// 计算属性
const timelineGroups = computed(() => {
  if (!props.todos || props.todos.length === 0) return []

  // 先按时间排序
  const sorted = [...props.todos].sort((a, b) => {
    let dateA, dateB

    switch (sortMode.value) {
      case 'endDate':
        dateA = a.endDate ? new Date(a.endDate) : new Date(0)
        dateB = b.endDate ? new Date(b.endDate) : new Date(0)
        break
      case 'updatedAt':
        dateA = new Date(a.updatedAt || a.createdAt)
        dateB = new Date(b.updatedAt || b.createdAt)
        break
      case 'createdAt':
      default:
        dateA = new Date(a.createdAt)
        dateB = new Date(b.createdAt)
        break
    }

    return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
  })

  // 按日期分组
  const groups = {}
  sorted.forEach((item) => {
    const date = getItemDate(item, sortMode.value)
    const dateKey = formatDateKey(date)

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        items: [],
      }
    }
    groups[dateKey].items.push(item)
  })

  return Object.values(groups)
})

// 方法
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const getItemDate = (item, mode) => {
  switch (mode) {
    case 'endDate':
      return item.endDate ? new Date(item.endDate) : new Date(item.createdAt)
    case 'updatedAt':
      return new Date(item.updatedAt || item.createdAt)
    case 'createdAt':
    default:
      return new Date(item.createdAt)
  }
}

const formatDateKey = (date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 状态和优先级相关方法已从 useConfig 中导入

const highlightSearchQuery = (text) => {
  if (!props.searchQuery || !text) return text

  const query = props.searchQuery.toLowerCase()
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// 监听排序模式变化，自动调整排序顺序
watch(sortMode, (newMode) => {
  if (newMode === 'endDate') {
    sortOrder.value = 'asc' // 截止时间默认升序（最近的在前）
  } else {
    sortOrder.value = 'desc' // 其他时间默认降序（最新的在前）
  }
})

// 组件初始化
onMounted(async () => {})
</script>

<style scoped>
.todo-timeline {
  height: calc(100vh - 65px);
  overflow-y: auto;
  padding: 16px;
}

.timeline-container {
  max-width: 100%;
}

.timeline-item {
  margin-bottom: 16px;
}

.timeline-date {
  text-align: right;
  padding-right: 16px;
}

.timeline-group-card {
  border-left: 4px solid rgb(var(--v-theme-primary));
  transition: all 0.2s ease;
}

.timeline-group-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.timeline-item-row {
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.timeline-item-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.timeline-item-title {
  font-weight: 500;
  line-height: 1.2;
  word-break: break-word;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timeline-item-archived {
  opacity: 0.6;
  text-decoration: line-through;
}

:deep(.search-highlight) {
  background-color: #fff59d;
  padding: 1px 3px;
  border-radius: 2px;
  font-weight: 500;
}

:deep(.v-timeline-item__body) {
  padding-bottom: 16px;
}

:deep(.v-timeline-item__opposite) {
  padding-top: 6px;
}
</style>
