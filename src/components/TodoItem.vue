<template>
  <v-snackbar
    v-model="snackbar.show"
    :timeout="2000"
    location="top"
    color="success"
  >
    复制成功：{{ snackbar.text }}
  </v-snackbar>

  <v-row
    class="todo-item-row align-center"
    no-gutters
  >
    <!-- 第一列：编号（可点击复制） -->
    <v-col
      cols="2"
      class="todo-column"
    >
      <v-btn
        variant="text"
        density="compact"
        class="text-body-2 justify-start"
        @click="copyToClipboard(getDisplayNumber(), '编号')"
      >
        <v-icon
          size="small"
          class="me-1"
          >mdi-hashtag</v-icon
        >
        {{ getDisplayNumber() }}
      </v-btn>
    </v-col>

    <!-- 第二列：标题（可点击复制） -->
    <v-col
      cols="6"
      class="todo-column"
    >
      <v-btn
        variant="text"
        density="compact"
        class="text-body-1 justify-start text-truncate"
        style="max-width: 100%"
        @click="copyToClipboard(item.title, '标题')"
      >
        <v-icon
          size="small"
          class="me-2"
          :color="getPriorityColor(item.priority)"
        >
          {{ getPriorityIcon(item.priority) }}
        </v-icon>
        <span class="text-truncate">{{ item.title }}</span>
      </v-btn>
    </v-col>

    <!-- 第三列：状态（扩展列） -->
    <v-col
      cols="2"
      class="todo-column"
    >
      <v-chip
        size="small"
        :color="getStatusColor(item.status)"
        variant="flat"
      >
        {{ getStatusText(item.status) }}
      </v-chip>
    </v-col>

    <!-- 第四列：操作按钮 -->
    <v-col
      cols="2"
      class="todo-column text-end"
    >
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
    </v-col>
  </v-row>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue'
import { ConfigService } from '@/services/configService'

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
  'category-select',
  'category-toggle-expanded',
  'create-category',
  'edit-category',
  'delete-category',
  'show-settings',
  'show-about',
])

const isDrawerOpen = ref(true)
const isRailMode = ref(false)

// 配置数据
const statusConfig = ref({})
const priorityConfig = ref({})

// 提示消息状态
const snackbar = ref({
  show: false,
  text: '',
})

// 格式化ID显示（取前8位）
const formatId = (id) => {
  return id.substring(0, 8).toUpperCase()
}

// 获取显示编号（优先使用自定义编号）
const getDisplayNumber = () => {
  return props.item.customNumber || formatId(props.item.id)
}

// 获取优先级颜色（基于配置）
const getPriorityColor = (priority) => {
  return priorityConfig.value[priority]?.color || 'grey'
}

// 获取优先级图标（基于配置）
const getPriorityIcon = (priority) => {
  return priorityConfig.value[priority]?.icon || 'mdi-minus'
}

// 获取状态颜色（基于配置）
const getStatusColor = (status) => {
  return statusConfig.value[status]?.color || 'grey'
}

// 获取状态文本（基于配置）
const getStatusText = (status) => {
  return statusConfig.value[status]?.text || '未知'
}

// 复制到剪贴板
const copyToClipboard = async (text, type) => {
  try {
    await navigator.clipboard.writeText(text)
    snackbar.value = {
      show: true,
      text: `${text}`,
    }
  } catch (err) {
    snackbar.value = {
      show: true,
      text: '复制失败，请重试！',
    }
  }
}

// 复制完整信息
const copyFullInfo = () => {
  const fullInfo = `编号: ${getDisplayNumber()}
标题: ${props.item.title}
描述: ${props.item.description || '无'}
优先级: ${getPriorityText(props.item.priority)}
状态: ${getStatusText(props.item.status)}`

  copyToClipboard(fullInfo, '待办事项')
}

// 获取优先级文本（基于配置）
const getPriorityText = (priority) => {
  return priorityConfig.value[priority]?.text || '未知'
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
  loadConfig()
})
</script>

<style lang="scss" scoped>
.todo-item-row {
  border-bottom: 1px solid #f3f4f6;
  padding: 4px 8px;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
  }
}

.todo-column {
  padding: 4px 8px;
}

.v-btn {
  text-transform: none;
  letter-spacing: normal;
}
</style>
