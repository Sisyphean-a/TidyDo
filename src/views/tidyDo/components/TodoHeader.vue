<template>
  <v-toolbar
    flat
    class="border-b"
  >
    <v-toolbar-title class="d-flex align-center">
      <v-icon class="me-2">{{
        viewAllMode ? 'mdi-view-list' : selectedCategory?.icon || 'mdi-folder'
      }}</v-icon>
      {{ viewAllMode ? '全部待办' : selectedCategory?.name || '请选择分类' }}
      <v-chip
        v-if="currentTodosCount > 0"
        size="small"
        class="ms-2"
        color="primary"
        variant="tonal"
      >
        {{ currentTodosCount }}
      </v-chip>
      <v-chip
        v-if="selectedCategory?.isFilterCategory"
        size="small"
        class="ms-2"
        color="warning"
        variant="tonal"
      >
        筛选类
      </v-chip>
    </v-toolbar-title>

    <v-spacer />

    <!-- 搜索框 -->
    <div class="search-container me-4">
      <v-text-field
        v-model="searchQuery"
        placeholder="搜索待办事项..."
        density="comfortable"
        variant="outlined"
        hide-details
        clearable
        class="search-field"
        @update:model-value="onSearchChange"
      >
        <template v-slot:prepend-inner>
          <v-icon 
            size="small" 
            :color="searchQuery ? 'primary' : 'grey'"
          >
            mdi-magnify
          </v-icon>
        </template>
      </v-text-field>
    </div>

    <!-- 工具按钮 -->
    <v-btn-group
      variant="outlined"
      density="comfortable"
    >
      <v-btn
        v-if="viewAllMode"
        prepend-icon="mdi-close"
        @click="$emit('exit-view-all')"
        color="warning"
      >
        退出全部视图
      </v-btn>
      <v-btn
        prepend-icon="mdi-plus"
        @click="$emit('create-todo')"
        :disabled="(!selectedCategory && !viewAllMode) || selectedCategory?.isFilterCategory"
      >
        新增待办
      </v-btn>
      <v-btn
        @click="$emit('toggle-archived')"
        :prepend-icon="showArchived ? 'mdi-eye-off' : 'mdi-eye'"
      >
        {{ showArchived ? '隐藏归档' : '显示归档' }}
      </v-btn>
      <v-btn
        icon="mdi-refresh"
        @click="$emit('refresh')"
        :loading="todosLoading"
      />
    </v-btn-group>
  </v-toolbar>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null,
  },
  viewAllMode: {
    type: Boolean,
    default: false,
  },
  currentTodosCount: {
    type: Number,
    default: 0,
  },
  showArchived: {
    type: Boolean,
    default: false,
  },
  todosLoading: {
    type: Boolean,
    default: false,
  },
  searchValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['create-todo', 'toggle-archived', 'refresh', 'exit-view-all', 'search'])

// 搜索相关状态
const searchQuery = ref(props.searchValue)
let searchTimeout = null

// 防抖搜索处理
const onSearchChange = (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emit('search', value || '')
  }, 300)
}

// 监听外部传入的搜索值变化
watch(() => props.searchValue, (newValue) => {
  if (searchQuery.value !== newValue) {
    searchQuery.value = newValue
  }
})
</script>

<style lang="scss" scoped>
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.v-toolbar {
  background: white !important;
}

.search-container {
  min-width: 280px;
  max-width: 400px;
  
  .search-field {
    :deep(.v-field) {
      border-radius: 24px;
      font-size: 14px;
      
      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      
      &.v-field--focused {
        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
      }
    }
    
    :deep(.v-field__input) {
      padding: 8px 12px;
      min-height: 40px;
    }
    
    :deep(.v-field__prepend-inner) {
      padding-top: 8px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .search-container {
    min-width: 200px;
    max-width: 250px;
  }
}
</style>
