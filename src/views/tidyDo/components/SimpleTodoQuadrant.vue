<template>
  <div class="simple-todo-quadrant">
    <!-- 四象限网格布局 -->
    <div class="quadrant-grid">
      <!-- 待办象限 -->
      <div class="quadrant quadrant-todo">
        <div class="quadrant-header">
          <div class="quadrant-title">
            <v-icon :color="getStatusConfig('todo').textColor" class="me-2">
              {{ getStatusConfig('todo').icon }}
            </v-icon>
            <span class="text-h6">{{ getStatusConfig('todo').label }}</span>
            <v-chip
              size="small"
              class="ms-2"
              :color="getStatusConfig('todo').textColor"
              variant="text"
            >
              {{ todosByStatus.todo.length }}
            </v-chip>
          </div>
          <v-btn
            icon="mdi-plus"
            size="small"
            variant="text"
            :color="getStatusConfig('todo').textColor"
            @click="handleAddTodo('todo')"
          />
        </div>
        <div class="quadrant-content">
          <VueDraggable
            v-model="todoList"
            group="simple-todos"
            :animation="300"
            :disabled="false"
            @end="handleDragEnd"
            class="draggable-container"
          >
            <SimpleTodoItem
              v-for="todo in todoList"
              :key="todo.id"
              :todo="todo"
              @update="handleUpdateTodo"
              @delete="handleDeleteTodo"
            />
          </VueDraggable>
          <div
            v-if="todosByStatus.todo.length === 0"
            class="empty-state"
          >
            <v-icon color="grey-lighten-1" size="48">mdi-clipboard-text-outline</v-icon>
            <p class="text-body-2 text-medium-emphasis mt-2">暂无待办事项</p>
          </div>
        </div>
      </div>

      <!-- 进行中象限 -->
      <div class="quadrant quadrant-doing">
        <div class="quadrant-header">
          <div class="quadrant-title">
            <v-icon :color="getStatusConfig('doing').textColor" class="me-2">
              {{ getStatusConfig('doing').icon }}
            </v-icon>
            <span class="text-h6">{{ getStatusConfig('doing').label }}</span>
            <v-chip
              size="small"
              class="ms-2"
              :color="getStatusConfig('doing').textColor"
              variant="text"
            >
              {{ todosByStatus.doing.length }}
            </v-chip>
          </div>
          <v-btn
            icon="mdi-plus"
            size="small"
            variant="text"
            :color="getStatusConfig('doing').textColor"
            @click="handleAddTodo('doing')"
          />
        </div>
        <div class="quadrant-content">
          <VueDraggable
            v-model="doingList"
            group="simple-todos"
            :animation="300"
            :disabled="false"
            @end="handleDragEnd"
            class="draggable-container"
          >
            <SimpleTodoItem
              v-for="todo in doingList"
              :key="todo.id"
              :todo="todo"
              @update="handleUpdateTodo"
              @delete="handleDeleteTodo"
            />
          </VueDraggable>
          <div
            v-if="todosByStatus.doing.length === 0"
            class="empty-state"
          >
            <v-icon color="grey-lighten-1" size="48">mdi-clock-outline</v-icon>
            <p class="text-body-2 text-medium-emphasis mt-2">暂无进行中事项</p>
          </div>
        </div>
      </div>

      <!-- 已完成象限 -->
      <div class="quadrant quadrant-done">
        <div class="quadrant-header">
          <div class="quadrant-title">
            <v-icon :color="getStatusConfig('done').textColor" class="me-2">
              {{ getStatusConfig('done').icon }}
            </v-icon>
            <span class="text-h6">{{ getStatusConfig('done').label }}</span>
            <v-chip
              size="small"
              class="ms-2"
              :color="getStatusConfig('done').textColor"
              variant="text"
            >
              {{ todosByStatus.done.length }}
            </v-chip>
          </div>
          <v-btn
            icon="mdi-plus"
            size="small"
            variant="text"
            :color="getStatusConfig('done').textColor"
            @click="handleAddTodo('done')"
          />
        </div>
        <div class="quadrant-content">
          <VueDraggable
            v-model="doneList"
            group="simple-todos"
            :animation="300"
            :disabled="false"
            @end="handleDragEnd"
            class="draggable-container"
          >
            <SimpleTodoItem
              v-for="todo in doneList"
              :key="todo.id"
              :todo="todo"
              @update="handleUpdateTodo"
              @delete="handleDeleteTodo"
            />
          </VueDraggable>
          <div
            v-if="todosByStatus.done.length === 0"
            class="empty-state"
          >
            <v-icon color="grey-lighten-1" size="48">mdi-check-circle-outline</v-icon>
            <p class="text-body-2 text-medium-emphasis mt-2">暂无已完成事项</p>
          </div>
        </div>
      </div>

      <!-- 暂停象限 -->
      <div class="quadrant quadrant-paused">
        <div class="quadrant-header">
          <div class="quadrant-title">
            <v-icon :color="getStatusConfig('paused').textColor" class="me-2">
              {{ getStatusConfig('paused').icon }}
            </v-icon>
            <span class="text-h6">{{ getStatusConfig('paused').label }}</span>
            <v-chip
              size="small"
              class="ms-2"
              :color="getStatusConfig('paused').textColor"
              variant="text"
            >
              {{ todosByStatus.paused.length }}
            </v-chip>
          </div>
          <v-btn
            icon="mdi-plus"
            size="small"
            variant="text"
            :color="getStatusConfig('paused').textColor"
            @click="handleAddTodo('paused')"
          />
        </div>
        <div class="quadrant-content">
          <VueDraggable
            v-model="pausedList"
            group="simple-todos"
            :animation="300"
            :disabled="false"
            @end="handleDragEnd"
            class="draggable-container"
          >
            <SimpleTodoItem
              v-for="todo in pausedList"
              :key="todo.id"
              :todo="todo"
              @update="handleUpdateTodo"
              @delete="handleDeleteTodo"
            />
          </VueDraggable>
          <div
            v-if="todosByStatus.paused.length === 0"
            class="empty-state"
          >
            <v-icon color="grey-lighten-1" size="48">mdi-pause-circle-outline</v-icon>
            <p class="text-body-2 text-medium-emphasis mt-2">暂无暂停事项</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useSimpleTodosStore } from '@/stores/useSimpleTodosStore'
import { getSimpleTodoStatusConfig, SIMPLE_TODO_STATUSES } from '@/services/simpleTodoService'
import SimpleTodoItem from './SimpleTodoItem.vue'
import { VueDraggable } from 'vue-draggable-plus'

// Props
const props = defineProps({
  categoryId: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['add-todo', 'update-todo', 'delete-todo'])

// Store
const simpleTodosStore = useSimpleTodosStore()

// 计算属性
const todosByStatus = computed(() => {
  const todos = simpleTodosStore.getSimpleTodosByCategoryId(props.categoryId)

  return {
    [SIMPLE_TODO_STATUSES.TODO]: todos.filter(t => t.status === SIMPLE_TODO_STATUSES.TODO),
    [SIMPLE_TODO_STATUSES.DOING]: todos.filter(t => t.status === SIMPLE_TODO_STATUSES.DOING),
    [SIMPLE_TODO_STATUSES.DONE]: todos.filter(t => t.status === SIMPLE_TODO_STATUSES.DONE),
    [SIMPLE_TODO_STATUSES.PAUSED]: todos.filter(t => t.status === SIMPLE_TODO_STATUSES.PAUSED)
  }
})

// 为每个状态创建响应式数组，用于VueDraggable
const todoList = ref([])
const doingList = ref([])
const doneList = ref([])
const pausedList = ref([])

// 监听todosByStatus的变化，更新响应式数组
watch(todosByStatus, (newTodosByStatus) => {
  todoList.value = [...newTodosByStatus.todo]
  doingList.value = [...newTodosByStatus.doing]
  doneList.value = [...newTodosByStatus.done]
  pausedList.value = [...newTodosByStatus.paused]
}, { immediate: true, deep: true })

// 方法
const getStatusConfig = (status) => {
  return getSimpleTodoStatusConfig(status)
}

const handleAddTodo = async (status) => {
  try {
    // 创建一个空标题的Todo项
    const newTodo = await simpleTodosStore.createSimpleTodo({
      categoryId: props.categoryId,
      title: '',
      status
    })

    // 通知SimpleTodoItem组件进入编辑模式
    // 使用nextTick确保DOM更新后再触发编辑
    await nextTick()
    const todoElement = document.querySelector(`[data-todo-id="${newTodo.id}"]`)
    if (todoElement) {
      todoElement.click() // 触发编辑模式
    }
  } catch (error) {
    console.error('Failed to create simple todo:', error)
  }
}

const handleUpdateTodo = (todo) => {
  emit('update-todo', todo)
}

const handleDeleteTodo = (todoId) => {
  emit('delete-todo', todoId)
}

// 拖拽结束事件处理 - 使用统一的处理函数
const handleDragEnd = async (event) => {
  try {
    const { to, from, newIndex, oldIndex, item } = event

    // 如果是跨象限拖拽（from !== to），需要更新todo状态
    if (from !== to) {
      // 从拖拽的DOM元素获取todo ID
      const todoElement = item.querySelector('[data-todo-id]')
      if (todoElement) {
        const todoId = todoElement.getAttribute('data-todo-id')

        // 确定目标状态 - 通过目标容器的父元素class确定
        let targetStatus = null
        const targetQuadrant = to.closest('.quadrant')

        if (targetQuadrant.classList.contains('quadrant-todo')) {
          targetStatus = SIMPLE_TODO_STATUSES.TODO
        } else if (targetQuadrant.classList.contains('quadrant-doing')) {
          targetStatus = SIMPLE_TODO_STATUSES.DOING
        } else if (targetQuadrant.classList.contains('quadrant-done')) {
          targetStatus = SIMPLE_TODO_STATUSES.DONE
        } else if (targetQuadrant.classList.contains('quadrant-paused')) {
          targetStatus = SIMPLE_TODO_STATUSES.PAUSED
        }

        if (targetStatus) {
          console.log(`Updating todo ${todoId} to status ${targetStatus}`)
          await simpleTodosStore.updateSimpleTodoStatus(todoId, targetStatus)
        }
      }
    }
  } catch (error) {
    console.error('Failed to handle drag end:', error)
  }
}
</script>

<style scoped>
.simple-todo-quadrant {
  height: 100%;
  padding: 16px;
}

.quadrant-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
  height: 100%;
  min-height: 600px;
}

.quadrant {
  border-radius: 12px;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.2s ease;
}

.quadrant-todo {
  background-color: #E3F2FD;
  border-color: #BBDEFB;
}

.quadrant-doing {
  background-color: #FFF3E0;
  border-color: #FFCC02;
}

.quadrant-done {
  background-color: #E8F5E8;
  border-color: #C8E6C9;
}

.quadrant-paused {
  background-color: #F5F5F5;
  border-color: #E0E0E0;
}

.quadrant:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quadrant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.5);
}

.quadrant-title {
  display: flex;
  align-items: center;
}

.quadrant-content {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.draggable-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 50px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quadrant-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    min-height: 800px;
  }
  
  .quadrant {
    min-height: 180px;
  }
  
  .empty-state {
    height: 120px;
  }
}
</style>
