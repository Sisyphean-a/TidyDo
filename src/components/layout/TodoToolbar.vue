<template>
  <v-app-bar
    elevation="1"
    color="white"
    class="border-b border-gray-200"
  >
    <!-- 标题区域 -->
    <v-app-bar-title class="flex-none min-w-[300px]">
      <div class="flex items-center">
        <v-icon
          :icon="titleIcon"
          class="mr-2"
        />
        <span>{{ title }}</span>
        <v-chip
          v-if="itemCount > 0"
          size="small"
          class="ml-2"
          color="primary"
          variant="tonal"
        >
          {{ itemCount }}
        </v-chip>
        <v-chip
          v-if="showFilterBadge"
          size="small"
          class="ml-2"
          color="warning"
          variant="tonal"
        >
          筛选模式
        </v-chip>
      </div>
    </v-app-bar-title>

    <v-spacer />

    <!-- 搜索框 -->
    <div
      v-if="searchable"
      class="flex-none mr-2"
    >
      <v-text-field
        :model-value="localSearchQuery"
        placeholder="搜索待办事项..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="max-w-[300px]"
        @update:model-value="handleSearchInput"
      />
    </div>

    <!-- 视图切换 -->
    <v-btn-toggle
      v-if="showViewToggle"
      :model-value="localViewMode"
      variant="outlined"
      density="comfortable"
      class="ml-2"
      @update:model-value="handleViewModeChange"
    >
      <v-btn
        value="table"
        icon="mdi-table"
        size="small"
      />
      <v-btn
        value="card"
        icon="mdi-card-outline"
        size="small"
      />
      <v-btn
        value="grid"
        icon="mdi-grid"
        size="small"
      />
    </v-btn-toggle>

    <!-- 工具按钮组 -->
    <v-btn-group
      variant="outlined"
      density="comfortable"
      class="ml-2"
    >
      <!-- 自定义按钮 -->
      <slot name="custom-buttons" />

      <!-- 新增按钮 -->
      <v-btn
        v-if="showCreateButton"
        prepend-icon="mdi-plus"
        :disabled="!canCreate"
        @click="handleCreate"
      >
        新增待办
      </v-btn>

      <!-- 显示归档切换 -->
      <v-btn
        v-if="showArchiveToggle"
        :prepend-icon="showArchived ? 'mdi-eye-off' : 'mdi-eye'"
        @click="handleToggleArchive"
      >
        {{ showArchived ? '隐藏归档' : '显示归档' }}
      </v-btn>

      <!-- 刷新按钮 -->
      <v-btn
        v-if="showRefreshButton"
        icon="mdi-refresh"
        :loading="loading"
        @click="handleRefresh"
      />

      <!-- 更多操作 -->
      <v-menu
        v-if="showMoreMenu"
        location="bottom end"
      >
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            icon="mdi-dots-vertical"
          />
        </template>
        <v-list density="compact">
          <slot name="menu-items">
            <v-list-item
              v-if="selectable"
              prepend-icon="mdi-check-all"
              title="全选"
              @click="handleSelectAll"
            />
            <v-list-item
              prepend-icon="mdi-download"
              title="导出数据"
              @click="handleExport"
            />
          </slot>
        </v-list>
      </v-menu>
    </v-btn-group>
  </v-app-bar>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { TodoUtils } from '@/services/todoBusinessService'

const props = defineProps({
  // 标题
  title: {
    type: String,
    default: '待办事项',
  },
  // 标题图标
  titleIcon: {
    type: String,
    default: 'mdi-clipboard-check',
  },
  // 项目数量
  itemCount: {
    type: Number,
    default: 0,
  },
  // 是否显示筛选标识
  showFilterBadge: {
    type: Boolean,
    default: false,
  },
  // 是否显示搜索框
  searchable: {
    type: Boolean,
    default: true,
  },
  // 搜索关键词
  searchQuery: {
    type: String,
    default: '',
  },
  // 是否显示视图切换
  showViewToggle: {
    type: Boolean,
    default: true,
  },
  // 当前视图模式
  viewMode: {
    type: String,
    default: 'table',
  },
  // 是否显示新增按钮
  showCreateButton: {
    type: Boolean,
    default: true,
  },
  // 是否可以创建
  canCreate: {
    type: Boolean,
    default: true,
  },
  // 是否显示归档切换
  showArchiveToggle: {
    type: Boolean,
    default: true,
  },
  // 是否显示归档
  showArchived: {
    type: Boolean,
    default: false,
  },
  // 是否显示刷新按钮
  showRefreshButton: {
    type: Boolean,
    default: true,
  },
  // 是否显示更多菜单
  showMoreMenu: {
    type: Boolean,
    default: true,
  },
  // 是否可选择
  selectable: {
    type: Boolean,
    default: false,
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:searchQuery',
  'update:viewMode',
  'update:showArchived',
  'search',
  'create',
  'refresh',
  'select-all',
  'export',
  'settings',
])

// 本地响应式变量
const localSearchQuery = ref(props.searchQuery)
const localViewMode = ref(props.viewMode)

// 监听 props 变化
watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue
})

watch(() => props.viewMode, (newValue) => {
  localViewMode.value = newValue
})

// 搜索功能
const searchDebounced = TodoUtils.debounce((query) => {
  emit('search', query)
}, 300)

const handleSearchInput = (value) => {
  localSearchQuery.value = value
  emit('update:searchQuery', value)
  emit('search', value)
}

// 视图切换
const currentViewMode = computed({
  get() {
    return props.viewMode
  },
  set(value) {
    emit('update:viewMode', value)
  }
})

// 处理视图模式切换
const handleViewModeChange = (value) => {
  localViewMode.value = value
  emit('update:viewMode', value)
}

// 事件处理
const handleCreate = () => {
  emit('create')
}

const handleToggleArchive = () => {
  emit('update:showArchived', !props.showArchived)
}

const handleRefresh = () => {
  emit('refresh')
}

const handleSelectAll = () => {
  emit('select-all')
}

const handleExport = () => {
  emit('export')
}
</script>