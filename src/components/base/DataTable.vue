<template>
  <div class="data-table">
    <!-- 表头 -->
    <div class="table-header">
      <div class="table-row header-row">
        <div
          v-if="selectable"
          class="table-cell checkbox-cell"
          :cols="1"
        >
          <v-checkbox
            v-model="selectAll"
            @change="handleSelectAll"
            :indeterminate="isIndeterminate"
            density="compact"
            hide-details
          />
        </div>
        <div
          v-for="column in columns"
          :key="column.key"
          :class="[
            'table-cell',
            'text-' + (column.align || 'left'),
            column.sortable ? 'sortable' : ''
          ]"
          :cols="column.cols || 1"
        >
          <div
            v-if="column.sortable"
            @click="handleSort(column.key)"
            class="sortable-header"
          >
            <span class="text-subtitle-2 font-weight-bold">{{ column.title }}</span>
            <v-icon
              v-if="sortBy === column.key"
              size="small"
              class="ms-1"
            >
              {{ sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
          </div>
          <span
            v-else
            class="text-subtitle-2 font-weight-bold"
          >{{ column.title }}</span>
        </div>
      </div>
    </div>

    <!-- 表格内容 -->
    <div class="table-body">
      <div
        v-for="(item, index) in data"
        :key="getItemKey(item, index)"
        class="table-row data-row"
        :class="{ 'row-selected': isSelected(item) }"
        @click="handleRowClick(item)"
      >
        <div
          v-if="selectable"
          class="table-cell checkbox-cell"
          :cols="1"
        >
          <v-checkbox
            :model-value="isSelected(item)"
            @change="handleSelectItem(item)"
            density="compact"
            hide-details
            @click.stop
          />
        </div>
        <div
          v-for="column in columns"
          :key="column.key"
          :class="[
            'table-cell',
            'text-' + (column.align || 'left')
          ]"
          :cols="column.cols || 1"
        >
          <slot
            :name="`cell-${column.key}`"
            :item="item"
            :column="column"
            :index="index"
          >
            {{ getItemValue(item, column.key) }}
          </slot>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="data.length === 0"
      class="empty-state"
    >
      <slot name="empty">
        <div class="text-center py-8">
          <v-icon
            size="48"
            color="grey-lighten-2"
          >
            mdi-database-off
          </v-icon>
          <p class="text-h6 mt-2 text-medium-emphasis">暂无数据</p>
        </div>
      </slot>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading-overlay"
    >
      <v-progress-circular
        indeterminate
        color="primary"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  // 数据
  data: {
    type: Array,
    default: () => [],
  },
  // 列配置
  columns: {
    type: Array,
    required: true,
  },
  // 是否可选择
  selectable: {
    type: Boolean,
    default: false,
  },
  // 选中的项
  selectedItems: {
    type: Array,
    default: () => [],
  },
  // 排序字段
  sortBy: {
    type: String,
    default: '',
  },
  // 排序顺序
  sortOrder: {
    type: String,
    default: 'asc',
    validator: (value) => ['asc', 'desc'].includes(value),
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false,
  },
  // 获取项目的唯一键
  itemKey: {
    type: [String, Function],
    default: 'id',
  },
})

const emit = defineEmits([
  'update:selectedItems',
  'update:sortBy',
  'update:sortOrder',
  'row-click',
  'sort',
])

// 选择相关
const selectAll = ref(false)

const isIndeterminate = computed(() => {
  const selectedCount = props.selectedItems.length
  return selectedCount > 0 && selectedCount < props.data.length
})

const isSelected = (item) => {
  const key = getItemKey(item)
  return props.selectedItems.some(selectedItem => getItemKey(selectedItem) === key)
}

const handleSelectAll = () => {
  if (selectAll.value) {
    emit('update:selectedItems', [...props.data])
  } else {
    emit('update:selectedItems', [])
  }
}

const handleSelectItem = (item) => {
  const key = getItemKey(item)
  const isCurrentlySelected = isSelected(item)
  
  if (isCurrentlySelected) {
    const newSelection = props.selectedItems.filter(
      selectedItem => getItemKey(selectedItem) !== key
    )
    emit('update:selectedItems', newSelection)
  } else {
    emit('update:selectedItems', [...props.selectedItems, item])
  }
}

// 排序相关
const handleSort = (field) => {
  if (props.sortBy === field) {
    const newOrder = props.sortOrder === 'asc' ? 'desc' : 'asc'
    emit('update:sortOrder', newOrder)
  } else {
    emit('update:sortBy', field)
    emit('update:sortOrder', 'asc')
  }
  
  emit('sort', { field, order: props.sortOrder })
}

// 行点击
const handleRowClick = (item) => {
  emit('row-click', item)
}

// 工具函数
const getItemKey = (item, index) => {
  if (typeof props.itemKey === 'function') {
    return props.itemKey(item, index)
  }
  return item[props.itemKey] || index
}

const getItemValue = (item, key) => {
  return item[key] || ''
}

// 监听选择状态
watch(
  () => props.selectedItems.length,
  (newLength) => {
    if (newLength === 0) {
      selectAll.value = false
    } else if (newLength === props.data.length) {
      selectAll.value = true
    }
  }
)
</script>

<style lang="scss" scoped>
.data-table {
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.table-header {
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.table-row {
  display: flex;
  align-items: center;
  min-height: 48px;
  
  &.header-row {
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
  }
  
  &.data-row {
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s;
    cursor: pointer;
    
    &:hover {
      background: #f9f9f9;
    }
    
    &.row-selected {
      background: #e3f2fd;
      
      &:hover {
        background: #bbdefb;
      }
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
}

.table-cell {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  overflow: hidden;
  
  &.checkbox-cell {
    justify-content: center;
  }
  
  &.text-left {
    justify-content: flex-start;
  }
  
  &.text-center {
    justify-content: center;
  }
  
  &.text-right {
    justify-content: flex-end;
  }
  
  &:first-child {
    padding-left: 16px;
  }
  
  &:last-child {
    padding-right: 16px;
  }
}

.sortable-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    color: #1976d2;
  }
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}
</style> 