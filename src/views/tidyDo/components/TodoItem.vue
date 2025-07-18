<template>
  <TableRow
    :columns="columns"
    :isHeader="false"
    :isArchived="itemData.archived"
  >
    <!-- 编号列 -->
    <template #column-0>
      <v-btn
        variant="text"
        density="compact"
        class="text-body-2 justify-center"
        @click="copyToClipboard(getDisplayNumber(), '编号')"
      >
        <v-icon
          size="small"
          class="me-1"
          >mdi-hashtag</v-icon
        >
        {{ getDisplayNumber() }}
      </v-btn>
    </template>

    <!-- 标题列 -->
    <template #column-1>
      <v-tooltip
        :text="itemData.description || '暂无描述'"
        location="bottom"
      >
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            variant="text"
            density="compact"
            class="text-body-1 justify-center text-truncate"
            style="max-width: 100%"
            @click="copyToClipboard(itemData.title, '标题')"
          >
            <v-icon :color="getStatusColor(itemData.status)">
              {{ getPriorityIcon(itemData.priority) }}
            </v-icon>
            <span 
              class="text-truncate"
              v-html="highlightText(itemData.title, searchQuery)"
            ></span>
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <!-- 截止日期列 -->
    <template #column-2>
      <v-btn
        variant="text"
        density="compact"
        class="text-body-2 justify-center"
        :class="{ 'text-error': isOverdue }"
        @click="copyToClipboard(formatDate(itemData.endDate), '截止日期')"
      >
        {{ formatDate(itemData.endDate) || '未设置' }}
        <span
          v-if="!isOverdue && itemData.endDate"
          class="ms-1"
          :class="getRemainingDaysClass"
        >
          ({{ getRemainingDays }})
        </span>
      </v-btn>
    </template>

    <!-- 状态列 -->
    <template #column-3>
      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-chip
            v-bind="menuProps"
            size="small"
            :color="getStatusColor(itemData.status)"
            variant="flat"
            clickable
          >
            {{ getStatusText(itemData.status) }}
            <v-icon
              size="small"
              class="ms-1"
              :color="getStatusColor(itemData.status) === 'warning' ? 'white' : 'inherit'"
            >
              mdi-chevron-down
            </v-icon>
          </v-chip>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="(status, key) in statusConfig"
            :key="key"
            :title="status.text"
            @click="handleStatusChange(key)"
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

    <!-- 分类列（仅在查看全部模式下显示） -->
    <template #column-4 v-if="viewAllMode">
      <v-btn
        variant="text"
        density="compact"
        class="text-body-2 justify-center"
        @click="copyToClipboard(getCategoryName(), '分类')"
      >
        <v-icon
          size="small"
          start
        >{{ getCategoryIcon() }}</v-icon>
        {{ getCategoryName() }}
      </v-btn>
    </template>

    <!-- 操作列（查看全部模式） -->
    <template #column-5 v-if="viewAllMode">
      <v-btn-group
        variant="text"
        density="compact"
      >
        <v-btn
          size="small"
          icon="mdi-pencil"
          @click="handleEdit"
          color="primary"
        />
        <v-btn
          size="small"
          icon="mdi-content-copy"
          @click="copyFullInfo"
          color="info"
        />
        <v-btn
          size="small"
          :icon="itemData.archived ? 'mdi-archive-off' : 'mdi-archive'"
          @click="handleArchive"
          :color="itemData.archived ? 'warning' : 'grey'"
        />
      </v-btn-group>
    </template>

    <!-- 操作列（普通模式） -->
    <template #column-4 v-if="!viewAllMode">
      <v-btn-group
        variant="text"
        density="compact"
      >
        <v-btn
          size="small"
          icon="mdi-pencil"
          @click="handleEdit"
          color="primary"
        />
        <v-btn
          size="small"
          icon="mdi-content-copy"
          @click="copyFullInfo"
          color="info"
        />
        <v-btn
          size="small"
          :icon="itemData.archived ? 'mdi-archive-off' : 'mdi-archive'"
          @click="handleArchive"
          :color="itemData.archived ? 'warning' : 'grey'"
        />
      </v-btn-group>
    </template>
  </TableRow>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfig } from '@/composables/useConfig'
import TableRow from './TableRow.vue'

const props = defineProps({
  itemData: {
    type: Object,
    required: true,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  selectedCategoryId: {
    type: String,
    default: null,
  },
  todoCounts: {
    type: Object,
    default: () => ({}),
  },
  columns: {
    type: Array,
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

const emit = defineEmits([
  'edit',
  'status-change',
  'copy',
  'archive',
  'category-select',
  'category-toggle-expanded',
  'create-category',
  'edit-category',
  'delete-category',
  'show-settings',
  'show-about',
])

// 配置管理
const { 
  getStatusColor, 
  getStatusText, 
  getPriorityIcon,
  statusConfig
} = useConfig()

// 计算截止日期是否过期
const isOverdue = computed(() => {
  if (!props.itemData.endDate) return false
  const endDate = new Date(props.itemData.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return endDate < today && props.itemData.status !== 'completed'
})

// 计算剩余天数
const getRemainingDays = computed(() => {
  if (!props.itemData.endDate) return ''
  const endDate = new Date(props.itemData.endDate)
  const today = new Date()
  // 将时间部分设置为0，只比较日期
  endDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffTime = endDate - today
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return '已过期'
  return diffDays > 0 ? `${diffDays}天` : '今天'
})

// 根据剩余天数获取样式类
const getRemainingDaysClass = computed(() => {
  if (!props.itemData.endDate) return ''
  const endDate = new Date(props.itemData.endDate)
  const today = new Date()
  // 将时间部分设置为0，只比较日期
  endDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffTime = endDate - today
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'text-error'
  if (diffDays <= 3) return 'text-warning'
  return 'text-success'
})

// 格式化ID显示（取前8位）
const formatId = (id) => {
  return id.substring(0, 8).toUpperCase()
}

// 获取显示编号（优先使用自定义编号）
const getDisplayNumber = () => {
  return props.itemData.customNumber || formatId(props.itemData.id)
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

// 状态和优先级相关方法已从 useConfig 中导入

// 获取分类名称
const getCategoryName = () => {
  const category = props.categories.find(cat => cat.id === props.itemData.categoryId)
  return category?.name || '未分类'
}

// 获取分类图标
const getCategoryIcon = () => {
  const category = props.categories.find(cat => cat.id === props.itemData.categoryId)
  return category?.icon || 'mdi-folder'
}

// 处理复制事件
const copyToClipboard = async (text, type) => {
  try {
    await navigator.clipboard.writeText(text)
    emit('copy', { text, type })
  } catch (err) {
    emit('copy', { text: '复制失败，请重试！', type: 'error' })
  }
}

// 复制完整信息
const copyFullInfo = () => {
  const fullInfo = `${getDisplayNumber()} ${props.itemData.title}`

  copyToClipboard(fullInfo, '待办事项')
}

// 处理状态改变
const handleStatusChange = async (newStatus) => {
  if (newStatus !== props.itemData.status) {
    emit('status-change', { item: props.itemData, newStatus })
    // 状态变更后重新加载配置
    await loadConfig()
  }
}

// 处理编辑
const handleEdit = () => {
  emit('edit', props.itemData)
}

// 处理归档
const handleArchive = () => {
  emit('archive', props.itemData)
}

// 搜索高亮工具函数
const highlightText = (text, query) => {
  if (!query || !text) return text
  
  const searchRegex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(searchRegex, '<mark class="search-highlight">$1</mark>')
}

// 组件挂载时初始化配置
onMounted(async () => {
  console.log('item', props.itemData)
})
</script>

<style lang="scss" scoped>
.v-btn {
  text-transform: none;
  letter-spacing: normal;
}

.v-chip {
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
  }
}

// 搜索高亮样式
:deep(.search-highlight) {
  background-color: #fff3cd;
  color: #856404;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
  animation: highlight-pulse 1s ease-in-out;
}

@keyframes highlight-pulse {
  0% { background-color: #fff3cd; }
  50% { background-color: #ffeaa7; }
  100% { background-color: #fff3cd; }
}
</style>
