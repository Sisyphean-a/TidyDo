<template>
  <div
    class="simple-todo-item"
    :class="{ 'dragging': isDragging, 'editing': isEditing }"
    :data-todo-id="todo.id"
    :draggable="!isEditing"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <v-card
      class="todo-card"
      :class="cardClass"
      elevation="1"
      @click="startEdit"
    >
      <v-card-text class="pa-3">
        <!-- 编辑模式 -->
        <div v-if="isEditing" class="edit-mode">
          <v-text-field
            ref="editInput"
            v-model="editTitle"
            variant="outlined"
            density="compact"
            hide-details
            autofocus
            @blur="saveEdit"
            @keyup.enter="saveEdit"
            @keyup.escape="cancelEdit"
            class="edit-input"
          />
          <div class="edit-actions mt-2">
            <v-btn
              size="small"
              color="primary"
              variant="text"
              @click="saveEdit"
            >
              保存
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              @click="cancelEdit"
            >
              取消
            </v-btn>
          </div>
        </div>

        <!-- 显示模式 -->
        <div v-else class="display-mode">
          <div class="todo-content">
            <p class="todo-title" :class="titleClass">
              {{ todo.title || '点击输入标题...' }}
            </p>
            <div class="todo-meta">
              <span class="text-caption text-medium-emphasis">
                {{ formatDate(todo.createdAt) }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div 
            v-show="showActions"
            class="todo-actions"
          >
            <v-btn
              icon="mdi-pencil"
              size="x-small"
              variant="text"
              color="primary"
              @click.stop="startEdit"
            />
            <v-btn
              icon="mdi-delete"
              size="x-small"
              variant="text"
              color="error"
              @click.stop="handleDelete"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { getSimpleTodoStatusConfig } from '@/services/simpleTodoService'

// Props
const props = defineProps({
  todo: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['update', 'delete'])

// 响应式数据
const isEditing = ref(false)
const editTitle = ref('')
const showActions = ref(false)
const isDragging = ref(false)
const editInput = ref(null)

// 计算属性
const statusConfig = computed(() => getSimpleTodoStatusConfig(props.todo.status))

const cardClass = computed(() => ({
  'todo-card-completed': props.todo.status === 'done',
  'todo-card-paused': props.todo.status === 'paused'
}))

const titleClass = computed(() => ({
  'text-decoration-line-through': props.todo.status === 'done',
  'text-medium-emphasis': props.todo.status === 'paused'
}))

// 方法
const startEdit = async () => {
  if (isEditing.value) return
  
  isEditing.value = true
  editTitle.value = props.todo.title
  showActions.value = false
  
  await nextTick()
  if (editInput.value) {
    editInput.value.focus()
  }
}

const saveEdit = () => {
  if (editTitle.value.trim() === '') {
    // 如果原来的标题也是空的，说明这是一个新创建的项目，应该删除它
    if (!props.todo.title || props.todo.title.trim() === '') {
      emit('delete', props.todo.id)
      return
    }
    cancelEdit()
    return
  }

  if (editTitle.value.trim() !== props.todo.title) {
    const updatedTodo = {
      ...props.todo,
      title: editTitle.value.trim()
    }
    emit('update', updatedTodo)
  }

  isEditing.value = false
}

const cancelEdit = () => {
  // 如果原来的标题是空的，说明这是一个新创建的项目，应该删除它
  if (!props.todo.title || props.todo.title.trim() === '') {
    emit('delete', props.todo.id)
    return
  }

  isEditing.value = false
  editTitle.value = ''
}

const handleDelete = () => {
  emit('delete', props.todo.id)
}

const handleDragStart = (event) => {
  // 如果正在编辑，阻止拖拽
  if (isEditing.value) {
    event.preventDefault()
    return
  }

  isDragging.value = true
  event.dataTransfer.setData('text/plain', props.todo.id)
  event.dataTransfer.effectAllowed = 'move'

  // 创建自定义拖拽预览，跟随鼠标位置
  const dragImage = event.target.cloneNode(true)
  dragImage.style.transform = 'rotate(5deg)'
  dragImage.style.opacity = '0.8'
  dragImage.style.position = 'absolute'
  dragImage.style.top = '-1000px'
  document.body.appendChild(dragImage)

  // 设置拖拽预览位置，使其跟随鼠标
  const rect = event.target.getBoundingClientRect()
  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top
  event.dataTransfer.setDragImage(dragImage, offsetX, offsetY)

  // 清理临时元素
  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 0)
}

const handleDragEnd = () => {
  isDragging.value = false
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays - 1}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
}

// 组件挂载时检查是否需要自动进入编辑模式
onMounted(() => {
  // 如果标题为空，自动进入编辑模式
  if (!props.todo.title || props.todo.title.trim() === '') {
    startEdit()
  }
})
</script>

<style scoped>
.simple-todo-item {
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.simple-todo-item.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

.todo-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

/* 编辑模式下的样式 */
.simple-todo-item.editing .todo-card {
  cursor: text;
  border: 2px solid #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.simple-todo-item.editing {
  cursor: text;
}

.todo-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.todo-card-completed {
  border-left-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.05);
}

.todo-card-paused {
  border-left-color: #9E9E9E;
  background-color: rgba(158, 158, 158, 0.05);
}

.display-mode {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 40px;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  color: rgba(0, 0, 0, 0.87);
}

.todo-meta {
  margin-top: 4px;
}

.todo-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.simple-todo-item:hover .todo-actions {
  opacity: 1;
}

.edit-mode {
  width: 100%;
}

.edit-input {
  margin-bottom: 8px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 拖拽时的样式 */
.simple-todo-item:active {
  cursor: grabbing;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .todo-actions {
    opacity: 1;
  }
  
  .display-mode {
    flex-direction: column;
    gap: 8px;
  }
  
  .todo-actions {
    align-self: flex-end;
    margin-left: 0;
  }
}

/* 动画效果 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.simple-todo-item {
  animation: slideIn 0.3s ease-out;
}
</style>
