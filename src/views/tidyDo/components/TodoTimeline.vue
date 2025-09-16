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
          :model-value="appStore.sortBy"
          variant="outlined"
          density="compact"
          mandatory
        >
          <v-btn
            value="createdAt"
            size="small"
            @click="appStore.toggleSort('createdAt')"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-plus
            </v-icon>
            创建日期
          </v-btn>
          <v-btn
            value="milestoneDate"
            size="small"
            @click="appStore.toggleSort('milestoneDate')"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-star
            </v-icon>
            节点日期
          </v-btn>
          <v-btn
            value="endDate"
            size="small"
            @click="appStore.toggleSort('endDate')"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-clock
            </v-icon>
            截止日期
          </v-btn>
          <v-btn
            value="updatedAt"
            size="small"
            @click="appStore.toggleSort('updatedAt')"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-edit
            </v-icon>
            更新日期
          </v-btn>
        </v-btn-toggle>
        <v-btn
          @click="appStore.toggleSort(appStore.sortBy)"
          :icon="appStore.sortOrder === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'"
          variant="outlined"
          density="compact"
          :title="appStore.sortOrder === 'asc' ? '升序' : '降序'"
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
        :dot-color="group.isSpecial ? 'grey-lighten-1' : 'primary'"
        size="small"
        class="timeline-item"
        :class="{ 'timeline-item-special': group.isSpecial }"
      >
        <template v-slot:icon>
          <v-icon
            :color="group.isSpecial ? 'grey-lighten-1' : 'primary'"
            size="small"
          >
            {{ group.isSpecial ? 'mdi-calendar-question' : 'mdi-calendar' }}
          </v-icon>
        </template>

        <template v-slot:opposite>
          <div class="timeline-date">
            <div
              class="text-body-1 font-weight-medium"
              :class="{ 'text-medium-emphasis': group.isSpecial }"
            >
              {{ group.date }}
              <v-tooltip
                v-if="group.isSpecial"
                :text="getSpecialGroupTooltip(appStore.sortBy)"
                location="top"
              >
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    size="small"
                    class="ms-1"
                    color="grey-lighten-1"
                  >
                    mdi-information-outline
                  </v-icon>
                </template>
              </v-tooltip>
            </div>
            <div class="text-caption text-medium-emphasis">{{ group.items.length }} 项待办</div>
          </div>
        </template>

        <v-card
          elevation="1"
          :class="[
            'timeline-group-card',
            { 'timeline-group-card-special': group.isSpecial }
          ]"
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

                <!-- 编号 -->
                <v-chip
                  size="x-small"
                  class="me-2"
                  color="grey"
                  variant="outlined"
                >
                  <v-icon
                    start
                    size="x-small"
                  >
                    mdi-hashtag
                  </v-icon>
                  <span v-html="highlightSearchQuery(getDisplayNumber(item))"></span>
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
import { computed, onMounted, onUnmounted } from 'vue'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useAppStore } from '@/stores/useAppStore'
import { useConfig } from '@/composables/useConfig'

// Store 和 Composables
const categoriesStore = useCategoriesStore()
const appStore = useAppStore()
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

// 本地状态（移除独立的排序状态，使用全局状态）

// 计算属性
const timelineGroups = computed(() => {
  if (!props.todos || props.todos.length === 0) return []

  // 根据排序模式分离有效数据和无效数据
  const { validItems, invalidItems } = separateItemsByMode(props.todos, appStore.sortBy)

  // 对有效数据进行排序
  const sortedValid = validItems.sort((a, b) => {
    const dateA = getItemDate(a, appStore.sortBy)
    const dateB = getItemDate(b, appStore.sortBy)
    return appStore.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

  // 对无效数据按创建日期排序（作为备用排序）
  const sortedInvalid = invalidItems.sort((a, b) => {
    const dateA = new Date(a.createdAt)
    const dateB = new Date(b.createdAt)
    return appStore.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

  // 按日期分组有效数据
  const validGroups = {}
  sortedValid.forEach((item) => {
    const date = getItemDate(item, appStore.sortBy)
    const dateKey = formatDateKey(date)

    if (!validGroups[dateKey]) {
      validGroups[dateKey] = {
        date: dateKey,
        items: [],
        isSpecial: false,
      }
    }
    validGroups[dateKey].items.push(item)
  })

  // 创建特殊分组用于无效数据
  const result = Object.values(validGroups)

  if (sortedInvalid.length > 0) {
    const specialGroup = {
      date: getSpecialGroupLabel(appStore.sortBy),
      items: sortedInvalid,
      isSpecial: true,
    }

    // 根据排序顺序决定特殊分组的位置
    if (appStore.sortOrder === 'asc') {
      result.push(specialGroup) // 升序时放在最后
    } else {
      result.unshift(specialGroup) // 降序时放在最前
    }
  }

  return result
})

// 方法（移除本地排序方法，使用全局状态管理）

// 根据排序模式分离有效和无效数据
const separateItemsByMode = (items, mode) => {
  const validItems = []
  const invalidItems = []

  items.forEach((item) => {
    if (isValidForMode(item, mode)) {
      validItems.push(item)
    } else {
      invalidItems.push(item)
    }
  })

  return { validItems, invalidItems }
}

// 检查项目是否对当前排序模式有效
const isValidForMode = (item, mode) => {
  switch (mode) {
    case 'milestoneDate':
      return item.milestoneDate != null
    case 'endDate':
      return item.endDate != null
    case 'updatedAt':
      return item.updatedAt != null
    case 'createdAt':
    default:
      return item.createdAt != null // 创建日期应该总是存在
  }
}

// 获取项目的有效日期（仅用于有效数据）
const getItemDate = (item, mode) => {
  switch (mode) {
    case 'milestoneDate':
      return new Date(item.milestoneDate)
    case 'endDate':
      return new Date(item.endDate)
    case 'updatedAt':
      return new Date(item.updatedAt || item.createdAt)
    case 'createdAt':
    default:
      return new Date(item.createdAt)
  }
}

// 获取特殊分组的标签
const getSpecialGroupLabel = (mode) => {
  switch (mode) {
    case 'milestoneDate':
      return '未设置节点日期'
    case 'endDate':
      return '未设置截止日期'
    case 'updatedAt':
      return '未更新'
    case 'createdAt':
    default:
      return '其他'
  }
}

// 获取特殊分组的工具提示
const getSpecialGroupTooltip = (mode) => {
  switch (mode) {
    case 'milestoneDate':
      return '这些待办事项没有设置节点日期，按创建日期排序'
    case 'endDate':
      return '这些待办事项没有设置截止日期，按创建日期排序'
    case 'updatedAt':
      return '这些待办事项没有更新记录，按创建日期排序'
    case 'createdAt':
    default:
      return '其他待办事项'
  }
}

// 日期格式化缓存
const dateFormatCache = new Map()

const formatDateKey = (date) => {
  const timestamp = date.getTime()

  if (dateFormatCache.has(timestamp)) {
    return dateFormatCache.get(timestamp)
  }

  const formatted = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  dateFormatCache.set(timestamp, formatted)
  return formatted
}

// 状态和优先级相关方法已从 useConfig 中导入

const highlightSearchQuery = (text) => {
  if (!props.searchQuery || !text) return text

  const query = props.searchQuery.toLowerCase()
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// 格式化ID显示（取前8位）
const formatId = (id) => {
  return id.substring(0, 8).toUpperCase()
}

// 获取显示编号（优先使用自定义编号）
const getDisplayNumber = (item) => {
  return item.customNumber || formatId(item.id)
}

// 排序逻辑现在由 AppStore 统一管理，无需本地监听

// 组件初始化
onMounted(async () => {
  // 定期清理日期格式化缓存，避免内存泄漏
  const cleanupInterval = setInterval(() => {
    if (dateFormatCache.size > 100) {
      dateFormatCache.clear()
    }
  }, 60000) // 每分钟检查一次

  // 组件卸载时清理
  onUnmounted(() => {
    clearInterval(cleanupInterval)
    dateFormatCache.clear()
  })
})
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

.timeline-group-card-special {
  border-left-color: rgb(var(--v-theme-grey-lighten-1));
  background-color: rgba(var(--v-theme-grey-lighten-4), 0.3);
}

.timeline-item-special {
  opacity: 0.8;
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
