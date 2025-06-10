<template>
  <v-row class="todo-item-row align-center" no-gutters>
    <!-- 第一列：编号（可点击复制） -->
    <v-col cols="2" class="todo-column">
      <v-btn
        variant="text"
        density="compact"
        class="text-body-2 justify-start"
        @click="copyToClipboard(getDisplayNumber(), '编号')"
      >
        <v-icon size="small" class="me-1">mdi-hashtag</v-icon>
        {{ getDisplayNumber() }}
      </v-btn>
    </v-col>

    <!-- 第二列：标题（可点击复制） -->
    <v-col cols="6" class="todo-column">
      <v-btn
        variant="text"
        density="compact"
        class="text-body-1 justify-start text-truncate"
        style="max-width: 100%"
        @click="copyToClipboard(item.title, '标题')"
      >
        <v-icon size="small" class="me-2" :color="getPriorityColor(item.priority)">
          {{ getPriorityIcon(item.priority) }}
        </v-icon>
        <span class="text-truncate">{{ item.title }}</span>
      </v-btn>
    </v-col>

    <!-- 第三列：状态（扩展列） -->
    <v-col cols="2" class="todo-column">
      <v-chip
        size="small"
        :color="getStatusColor(item.status)"
        variant="flat"
      >
        {{ getStatusText(item.status) }}
      </v-chip>
    </v-col>

    <!-- 第四列：操作按钮 -->
    <v-col cols="2" class="todo-column text-end">
      <v-btn-group variant="text" density="compact">
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
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit'])

// 格式化ID显示（取前8位）
const formatId = (id) => {
  return id.substring(0, 8).toUpperCase()
}

// 获取显示编号（优先使用自定义编号）
const getDisplayNumber = () => {
  return props.item.customNumber || formatId(props.item.id)
}

// 获取优先级颜色
const getPriorityColor = (priority) => {
  const colors = {
    high: 'error',
    medium: 'warning',
    low: 'success'
  }
  return colors[priority] || 'grey'
}

// 获取优先级图标
const getPriorityIcon = (priority) => {
  const icons = {
    high: 'mdi-chevron-double-up',
    medium: 'mdi-chevron-up',
    low: 'mdi-chevron-down'
  }
  return icons[priority] || 'mdi-minus'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待办',
    completed: '完成',
    cancelled: '取消'
  }
  return texts[status] || '未知'
}

// 复制到剪贴板
const copyToClipboard = async (text, type) => {
  try {
    await navigator.clipboard.writeText(text)
    // 使用 Vuetify 的 snackbar 或其他提示方式
    console.log(`${type}已复制: ${text}`)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 复制完整信息
const copyFullInfo = () => {
  const fullInfo = `编号: ${getDisplayNumber()}
ID: ${props.item.id}
标题: ${props.item.title}
描述: ${props.item.description || '无'}
优先级: ${getPriorityText(props.item.priority)}
状态: ${getStatusText(props.item.status)}
创建时间: ${new Date(props.item.createdAt).toLocaleString()}`
  
  copyToClipboard(fullInfo, '完整信息')
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[priority] || '未知'
}

// 处理编辑
const handleEdit = () => {
  emit('edit', props.item)
}
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