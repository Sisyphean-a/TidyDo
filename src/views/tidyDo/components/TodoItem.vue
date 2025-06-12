<template>
  <TableRow
    :columns="columns"
    :isHeader="false"
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
        :text="item.description || '暂无描述'"
        location="bottom"
      >
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            variant="text"
            density="compact"
            class="text-body-1 justify-center text-truncate"
            style="max-width: 100%"
            @click="copyToClipboard(item.title, '标题')"
          >
            <v-icon :color="getStatusColor(item.status)">
              {{ getPriorityIcon(item.priority) }}
            </v-icon>
            <span class="text-truncate"> {{ item.title }}</span>
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
        @click="copyToClipboard(formatDate(item.endDate), '截止日期')"
      >
        {{ formatDate(item.endDate) || '未设置' }}
        <span
          v-if="!isOverdue && item.endDate"
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
            :color="getStatusColor(item.status)"
            variant="flat"
            clickable
          >
            {{ getStatusText(item.status) }}
            <v-icon
              size="small"
              class="ms-1"
              :color="getStatusColor(item.status) === 'warning' ? 'white' : 'inherit'"
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

    <!-- 操作列 -->
    <template #column-4>
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
      </v-btn-group>
    </template>
  </TableRow>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, onMounted } from 'vue'
import { ConfigService } from '@/services/configService'
import TableRow from './TableRow.vue'

const props = defineProps({
  item: {
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
})

const emit = defineEmits([
  'edit',
  'status-change',
  'copy',
  'category-select',
  'category-toggle-expanded',
  'create-category',
  'edit-category',
  'delete-category',
  'show-settings',
  'show-about',
])

// 列配置
const columns = ref([
  { cols: 1, align: 'center', title: '编号' },
  { cols: 5, align: 'center', title: '标题' },
  { cols: 2, align: 'center', title: '截止日期' },
  { cols: 2, align: 'center', title: '状态' },
  { cols: 2, align: 'center', title: '操作' },
])

// 配置数据
const statusConfig = ref({})
const priorityConfig = ref({})

// 计算截止日期是否过期
const isOverdue = computed(() => {
  if (!props.item.endDate) return false
  const endDate = new Date(props.item.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return endDate < today && props.item.status !== 'completed'
})

// 计算剩余天数
const getRemainingDays = computed(() => {
  if (!props.item.endDate) return ''
  const endDate = new Date(props.item.endDate)
  const today = new Date()
  // 将时间部分设置为0，只比较日期
  endDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffTime = endDate - today
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? `${diffDays}天` : '今天'
})

// 根据剩余天数获取样式类
const getRemainingDaysClass = computed(() => {
  if (!props.item.endDate) return ''
  const endDate = new Date(props.item.endDate)
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
  return props.item.customNumber || formatId(props.item.id)
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

// 获取状态颜色（基于配置）
const getStatusColor = (status) => {
  return statusConfig.value[status]?.color || 'grey'
}

// 获取状态文本（基于配置）
const getStatusText = (status) => {
  return statusConfig.value[status]?.text || '未知'
}

// 获取优先级icon（基于配置）
const getPriorityIcon = (priority) => {
  return priorityConfig.value[priority]?.icon || 'mdi-help-circle'
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
  const fullInfo = `${getDisplayNumber()} ${props.item.title}`

  copyToClipboard(fullInfo, '待办事项')
}

// 处理状态改变
const handleStatusChange = async (newStatus) => {
  if (newStatus !== props.item.status) {
    emit('status-change', { item: props.item, newStatus })
    // 状态变更后重新加载配置
    await loadConfig()
  }
}

// 处理编辑
const handleEdit = () => {
  emit('edit', props.item)
}

// 加载配置
const loadConfig = async () => {
  try {
    statusConfig.value = await ConfigService.getStatusConfig()
    priorityConfig.value = await ConfigService.getPriorityConfig()
  } catch (error) {
    console.error('加载配置失败：', error)
  }
}

// 组件挂载时加载配置
onMounted(() => {
  console.log('item', props.item)
  loadConfig()
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
</style>
