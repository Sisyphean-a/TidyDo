<template>
  <v-row
    :class="[
      'table-row align-center',
      isHeader ? 'table-header' : 'table-data-row',
      isHeader ? 'ma-0 pa-4 bg-grey-lighten-4' : '',
      !isHeader ? 'table-item-row' : '',
      isArchived ? 'archived' : ''
    ]"
    no-gutters
  >
    <v-col
      v-for="(column, index) in columns"
      :key="index"
      :cols="column.cols || 1"
      :class="[
        'table-column',
        isHeader ? 'text-center' : getAlignmentClass(column.align || 'center'),
        isHeader ? 'text-body-2 font-weight-bold' : '',
        column.class || ''
      ]"
    >
      <slot
        :name="`column-${index}`"
        :column="column"
        :isHeader="isHeader"
        :index="index"
      >
        <!-- 默认内容 -->
        <span v-if="isHeader">{{ column.title || '' }}</span>
        <span v-else>{{ column.content || '' }}</span>
      </slot>
    </v-col>
  </v-row>
</template>

<script setup>
const props = defineProps({
  // 列配置数组
  columns: {
    type: Array,
    required: true,
    validator: (value) => {
      return Array.isArray(value) && value.length > 0
    }
  },
  // 是否为表头
  isHeader: {
    type: Boolean,
    default: false
  },
  // 是否已归档
  isArchived: {
    type: Boolean,
    default: false
  }
})

// 获取对齐方式的CSS类
const getAlignmentClass = (align) => {
  switch (align) {
    case 'left':
      return 'text-left'
    case 'right':
      return 'text-right'
    case 'center':
    default:
      return 'text-center'
  }
}
</script>

<style lang="scss" scoped>
.table-row {
  transition: all 0.2s;
}

.table-header {
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.table-data-row {
  border-bottom: 1px solid #f3f4f6;
  padding: 4px 8px;

  &:hover {
    background-color: #f9fafb;
  }
}

.table-column {
  padding: 4px 8px;
}

.table-item-row {
  background: white;
}

.archived {
  background-color: #fffad1;
  &:hover {
    background-color: #fff7b1;
  }
}
</style> 