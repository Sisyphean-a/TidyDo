<template>
  <div class="data-table bg-white border border-gray-200 rounded-lg overflow-hidden">
    <!-- 表头 -->
    <div class="table-header bg-gray-50 border-b border-gray-200">
      <div class="flex items-center min-h-[48px] px-4">
        <!-- 选择框列 -->
        <div
          v-if="selectable"
          class="flex justify-center items-center flex-shrink-0"
          style="flex-basis: 60px; min-width: 60px;"
        >
          <v-checkbox
            v-model="selectAll"
            @change="handleSelectAll"
            :indeterminate="isIndeterminate"
            density="compact"
            hide-details
          />
        </div>
        
        <!-- 数据列 -->
        <div
          v-for="column in columns"
          :key="column.key"
          :class="[
            'flex items-center px-2',
            getColumnWidthClass(column),
            getAlignmentClass(column.align || 'left'),
            column.sortable ? 'cursor-pointer hover:text-blue-600' : ''
          ]"
          :style="getColumnStyle(column)"
        >
          <div
            v-if="column.sortable"
            @click="handleSort(column.key)"
            class="flex items-center select-none"
          >
            <span class="text-sm font-bold">{{ column.title }}</span>
            <v-icon
              v-if="sortBy === column.key"
              size="small"
              class="ml-1"
            >
              {{ sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
          </div>
          <span
            v-else
            class="text-sm font-bold"
          >{{ column.title }}</span>
        </div>
      </div>
    </div>

    <!-- 表格内容 -->
    <div class="table-body">
      <div
        v-for="(item, index) in data"
        :key="getItemKey(item, index)"
        :class="[
          'flex items-center min-h-[48px] px-4 border-b border-gray-100 transition-colors cursor-pointer',
          'hover:bg-gray-50',
          isSelected(item) ? 'bg-blue-50 hover:bg-blue-100' : '',
          index === data.length - 1 ? 'border-b-0' : ''
        ]"
        @click="handleRowClick(item)"
      >
        <!-- 选择框列 -->
        <div
          v-if="selectable"
          class="flex justify-center items-center flex-shrink-0"
          style="flex-basis: 60px; min-width: 60px;"
        >
          <v-checkbox
            :model-value="isSelected(item)"
            @change="handleSelectItem(item)"
            density="compact"
            hide-details
            @click.stop
          />
        </div>
        
        <!-- 数据列 -->
        <div
          v-for="column in columns"
          :key="column.key"
          :class="[
            'flex items-center px-2 overflow-hidden',
            getColumnWidthClass(column),
            getAlignmentClass(column.align || 'left')
          ]"
          :style="getColumnStyle(column)"
        >
          <slot
            :name="`cell-${column.key}`"
            :item="item"
            :column="column"
            :index="index"
          >
            <span class="truncate">{{ getItemValue(item, column.key) }}</span>
          </slot>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="data.length === 0"
      class="empty-state py-16 text-center"
    >
      <slot name="empty">
        <v-icon
          size="48"
          color="grey-lighten-2"
          class="mb-4"
        >
          mdi-database-off
        </v-icon>
        <p class="text-lg font-medium text-gray-500">暂无数据</p>
      </slot>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-10"
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

// 计算所有列的总宽度配置
const getTotalCols = computed(() => {
  return props.columns.reduce((total, column) => total + (column.cols || 1), 0)
})

// 获取列宽度类（基于实际列配置比例）
const getColumnWidthClass = (column) => {
  return `flex-shrink-0`
}

// 获取列的内联样式（基于实际列配置比例分配）
const getColumnStyle = (column) => {
  const cols = column.cols || 1
  const totalCols = getTotalCols.value
  
  // 基于实际列配置计算比例
  const flexBasis = `${(cols / totalCols) * 100}%`
  
  return {
    flexBasis,
    flexGrow: 0, // 不允许增长，严格按比例分配
    minWidth: cols === 1 ? '80px' : cols === 2 ? '100px' : '120px'
  }
}

// 获取对齐方式类
const getAlignmentClass = (align) => {
  switch (align) {
    case 'left':
      return 'justify-start text-left'
    case 'right':
      return 'justify-end text-right'
    case 'center':
    default:
      return 'justify-center text-center'
  }
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
}
</style> 