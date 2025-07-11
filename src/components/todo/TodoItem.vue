<template>
  <div class="todo-item">
    <!-- 卡片视图 -->
    <DataCard
      v-if="viewMode === 'card'"
      :title="displayTodo.title"
      :item="displayTodo"
      :selectable="selectable"
      :selected="isSelected"
      :clickable="true"
      show-menu
      @click="handleRowClick"
      @select="handleSelect"
    >
      <div class="todo-card-content">
        <div class="todo-meta">
          <v-chip
            :color="displayTodo.statusColor"
            size="small"
            variant="flat"
          >
            {{ displayTodo.statusText }}
          </v-chip>
          <v-chip
            v-if="displayTodo.formattedEndDate"
            size="small"
            variant="outlined"
            :color="displayTodo.isOverdue ? 'error' : 'default'"
          >
            {{ displayTodo.formattedEndDate }}
          </v-chip>
        </div>
        
        <div class="todo-description">
          <p class="text-body-2 text-medium-emphasis">
            {{ displayTodo.description || '暂无描述' }}
          </p>
        </div>
        
        <div class="todo-tags">
          <v-chip
            v-for="tag in displayTodo.tags"
            :key="tag"
            size="x-small"
            variant="outlined"
            class="me-1"
          >
            {{ tag }}
          </v-chip>
        </div>
      </div>
      
      <template #actions>
        <v-btn
          size="small"
          icon="mdi-pencil"
          @click.stop="handleEdit"
          color="primary"
        />
        <v-btn
          size="small"
          icon="mdi-content-copy"
          @click.stop="copyFullInfo"
          color="info"
        />
        <v-btn
          size="small"
          :icon="displayTodo.archived ? 'mdi-archive-off' : 'mdi-archive'"
          @click.stop="handleArchive"
          :color="displayTodo.archived ? 'warning' : 'grey'"
        />
      </template>
    </DataCard>
    
    <!-- 简单视图（用于网格等） -->
    <v-card
      v-else
      elevation="2"
      hover
      class="todo-simple-card"
      @click="handleRowClick"
    >
      <v-card-text>
        <div class="d-flex align-center mb-2">
          <v-icon
            :color="displayTodo.statusColor"
            size="small"
            class="me-2"
          >
            {{ displayTodo.priorityIcon }}
          </v-icon>
          <span class="text-subtitle-2">{{ displayTodo.title }}</span>
        </div>
        
        <div class="d-flex justify-space-between align-center">
          <v-chip
            :color="displayTodo.statusColor"
            size="small"
            variant="flat"
          >
            {{ displayTodo.statusText }}
          </v-chip>
          
          <div class="todo-actions">
            <v-btn
              size="small"
              icon="mdi-pencil"
              variant="text"
              @click.stop="handleEdit"
            />
            <v-btn
              size="small"
              icon="mdi-content-copy"
              variant="text"
              @click.stop="copyFullInfo"
            />
            <v-btn
              size="small"
              :icon="displayTodo.archived ? 'mdi-archive-off' : 'mdi-archive'"
              variant="text"
              @click.stop="handleArchive"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DataCard from '@/components/base/DataCard.vue'
import { TodoBusinessService, TodoUtils } from '@/services/todoBusinessService'

const props = defineProps({
  // 待办事项数据
  todo: {
    type: Object,
    required: true,
  },
  // 分类数据
  category: {
    type: Object,
    default: null,
  },
  // 视图模式
  viewMode: {
    type: String,
    default: 'card',
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
  // 选中的项目
  selectedItems: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'edit',
  'status-change',
  'archive',
  'copy',
  'click',
  'select',
])

// 计算属性
const displayTodo = computed(() => {
  return TodoBusinessService.formatTodoForDisplay(props.todo, props.category)
})

const isSelected = computed(() => {
  return props.selectedItems.some(item => item.id === props.todo.id)
})

// 事件处理
const handleEdit = () => {
  emit('edit', props.todo)
}

const handleStatusChange = (newStatus) => {
  emit('status-change', { todo: props.todo, newStatus })
}

const handleArchive = () => {
  emit('archive', props.todo)
}

const copyFullInfo = () => {
  const fullInfo = TodoBusinessService.getTodoFullInfo(displayTodo.value)
  TodoUtils.copyToClipboard(fullInfo)
  emit('copy', { type: 'full', data: fullInfo })
}

const handleRowClick = () => {
  emit('click', props.todo)
}

const handleSelect = () => {
  emit('select', props.todo)
}
</script>

<style lang="scss" scoped>
.todo-item {
  height: 100%;
}

.todo-card-content {
  .todo-meta {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  
  .todo-description {
    margin-bottom: 12px;
    min-height: 40px;
  }
  
  .todo-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}

.todo-simple-card {
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.todo-actions {
  display: flex;
  gap: 2px;
}
</style> 