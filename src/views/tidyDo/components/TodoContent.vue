<template>
  <div class="todo-content">
    <!-- 未选择分类状态 -->
    <v-container
      v-if="!selectedCategory && !viewAllMode"
      class="text-center pa-12"
    >
      <v-icon
        size="64"
        color="grey-lighten-2"
        >mdi-arrow-left</v-icon
      >
      <h3 class="text-h6 mt-4 text-medium-emphasis">请从左侧选择一个分类</h3>
      <p class="text-body-2 text-medium-emphasis">选择分类后可以查看和管理该分类下的待办事项</p>
    </v-container>

    <!-- 空列表状态 -->
    <v-container
      v-else-if="currentTodos.length === 0"
      class="text-center pa-12"
    >
      <!-- 搜索无结果状态 -->
      <template v-if="searchQuery">
        <v-icon
          size="64"
          color="grey-lighten-2"
          >mdi-magnify</v-icon
        >
        <h3 class="text-h6 mt-4 text-medium-emphasis">未找到搜索结果</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          没有找到包含"<span class="font-weight-bold">{{ searchQuery }}</span>"的待办事项
        </p>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="clearSearch"
        >
          清除搜索
        </v-btn>
      </template>
      
      <!-- 普通空列表状态 -->
      <template v-else>
        <v-icon
          size="64"
          color="grey-lighten-2"
          >mdi-clipboard-check</v-icon
        >
        <h3 class="text-h6 mt-4 text-medium-emphasis">还没有待办事项</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">点击"新增待办"创建第一个待办事项</p>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="$emit('create-todo')"
        >
          新增待办
        </v-btn>
      </template>
    </v-container>

    <!-- Todo列表 -->
    <div
      v-else
      class="todo-list"
    >
      <!-- 表头 -->
      <TableRow
        :columns="tableColumns"
        :isHeader="true"
      >
        <!-- 截止日期列自定义表头（包含排序功能） -->
        <template #column-2>
          <v-btn
            variant="text"
            density="compact"
            class="text-body-2 font-weight-bold"
            @click="$emit('sort-toggle', 'endDate')"
          >
            截止日期
            <v-icon
              v-if="sortBy === 'endDate'"
              size="small"
              class="ms-1"
            >
              {{ sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
          </v-btn>
        </template>
      </TableRow>

      <!-- Todo项列表 -->
      <div class="bg-white">
        <TodoItem
          v-for="item in sortedTodos"
          :key="item.id"
          :itemData="item"
          :columns="tableColumns"
          :categories="categories"
          :viewAllMode="viewAllMode || selectedCategory?.isFilterCategory"
          :searchQuery="searchQuery"
          @edit="$emit('edit-todo', $event)"
          @status-change="$emit('status-change', $event)"
          @copy="$emit('copy', $event)"
          @archive="$emit('archive', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TodoItem from './TodoItem.vue'
import TableRow from './TableRow.vue'

const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null,
  },
  viewAllMode: {
    type: Boolean,
    default: false,
  },
  currentTodos: {
    type: Array,
    default: () => [],
  },
  tableColumns: {
    type: Array,
    default: () => [],
  },
  categories: {
    type: Array,
    default: () => [],
  },
  sortBy: {
    type: String,
    default: 'endDate',
  },
  sortOrder: {
    type: String,
    default: 'asc',
  },
  searchQuery: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'edit-todo',
  'status-change',
  'copy',
  'archive',
  'create-todo',
  'sort-toggle',
  'clear-search',
])

// 计算排序后的待办事项
const sortedTodos = computed(() => {
  const sorted = [...props.currentTodos].sort((a, b) => {
    if (props.sortBy === 'endDate') {
      // 优先显示有截止日期的事项
      if (!a.endDate && !b.endDate) return 0
      if (!a.endDate) return 1
      if (!b.endDate) return -1

      // 按截止日期排序
      const dateA = new Date(a.endDate)
      const dateB = new Date(b.endDate)

      if (props.sortOrder === 'asc') {
        return dateA - dateB
      } else {
        return dateB - dateA
      }
    }
    return 0
  })

  return sorted
})

// 清除搜索
const clearSearch = () => {
  emit('clear-search')
}
</script>

<style lang="scss" scoped>
.todo-content {
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.todo-list {
  height: 100%;
}
</style>
