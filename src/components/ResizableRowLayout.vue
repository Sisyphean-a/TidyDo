<template>
  <div class="flex flex-col h-full w-full">
    <template
      v-for="(_, index) in rowCount"
      :key="index"
    >
      <div
        class="w-full overflow-auto relative flex flex-col transition-all duration-200 bg-slate-50 border-b border-slate-200 last:border-b-0"
        :style="{ height: `${rowHeights[index]}%` }"
      >
        <row-header
          :is-collapsed="isCollapsed[index]"
          @toggle="toggleRow(index)"
        />
        <div
          class="flex-1 overflow-auto bg-slate-50"
          v-show="!isCollapsed[index]"
        >
          <slot :name="`row${index + 1}`"></slot>
        </div>
      </div>
      <div
        v-if="index < rowCount - 1"
        class="h-1.5 bg-slate-300 cursor-row-resize w-full transition-colors duration-200 hover:bg-blue-500 active:bg-blue-600 relative z-10"
        @mousedown="startResize(index)"
      ></div>
    </template>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed } from 'vue'
import RowHeader from '@/components/RowHeader.vue'

const props = defineProps({
  rowCount: {
    type: Number,
    required: true,
    validator: (value) => value >= 1,
  },
})

// 行高度百分比
const rowHeights = ref(Array(props.rowCount).fill(100 / props.rowCount))
const resizingIndex = ref(null)
const startY = ref(0)
const startHeights = ref([])

// 折叠状态管理
const isCollapsed = ref(Array(props.rowCount).fill(false))

// 定义折叠后的最小高度百分比
const collapsedHeightPercentage = 8
// 定义展开时的最小高度百分比
const minExpandedHeightPercentage = 15

// 计算可见行的数量
const visibleRowsCount = computed(() => {
  return isCollapsed.value.filter((collapsed) => !collapsed).length
})

// 切换行的折叠状态
const toggleRow = (index) => {
  // 特殊处理：当只有两行时，折叠一行会自动展开另一行
  if (props.rowCount === 2) {
    const otherIndex = index === 0 ? 1 : 0

    // 如果要折叠当前行
    if (!isCollapsed.value[index]) {
      // 先展开另一行（如果它是折叠的）
      if (isCollapsed.value[otherIndex]) {
        isCollapsed.value[otherIndex] = false
      }
      // 然后折叠当前行
      isCollapsed.value[index] = true
    } else {
      // 如果要展开当前行，直接展开
      isCollapsed.value[index] = false
    }

    redistributeHeights()
    return
  }

  // 对于多行情况，防止折叠最后一个可见行
  if (!isCollapsed.value[index] && visibleRowsCount.value <= 1) {
    console.warn('Cannot collapse the last visible row.')
    return
  }

  isCollapsed.value[index] = !isCollapsed.value[index]
  redistributeHeights()
}

// 重新分配高度
const redistributeHeights = () => {
  const visibleCount = visibleRowsCount.value
  const collapsedCount = props.rowCount - visibleCount

  // 如果所有行都折叠，强制展开第一个
  if (visibleCount === 0 && collapsedCount > 0) {
    const firstCollapsedIndex = isCollapsed.value.findIndex((c) => c)
    if (firstCollapsedIndex !== -1) {
      isCollapsed.value[firstCollapsedIndex] = false
      return
    }
  }

  // 如果只有展开的行，则平分
  if (collapsedCount === 0) {
    rowHeights.value = Array(props.rowCount).fill(100 / props.rowCount)
    return
  }

  // 计算折叠行占用的总高度
  const totalCollapsedHeight = collapsedCount * collapsedHeightPercentage
  // 计算剩余给展开行的总高度
  const totalVisibleHeight = 100 - totalCollapsedHeight

  // 计算每个展开行的理论高度
  let visibleRowHeight = totalVisibleHeight / visibleCount

  // 确保展开行不低于最小高度
  if (visibleRowHeight < minExpandedHeightPercentage) {
    visibleRowHeight = minExpandedHeightPercentage
    const totalVisibleHeight = visibleCount * visibleRowHeight
    const remainingForCollapsed = 100 - totalVisibleHeight
    const actualCollapsedHeight = collapsedCount > 0 ? remainingForCollapsed / collapsedCount : 0

    rowHeights.value = Array(props.rowCount)
      .fill(0)
      .map((_, i) => (isCollapsed.value[i] ? Math.max(0, actualCollapsedHeight) : visibleRowHeight))
  } else {
    rowHeights.value = Array(props.rowCount)
      .fill(0)
      .map((_, i) => (isCollapsed.value[i] ? collapsedHeightPercentage : visibleRowHeight))
  }
}

// 开始调整大小
const startResize = (index) => {
  resizingIndex.value = index
  startY.value = event.clientY
  startHeights.value = [...rowHeights.value]

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
}

// 处理鼠标移动
const handleMouseMove = (event) => {
  if (resizingIndex.value === null) return

  const index = resizingIndex.value
  const topIsCollapsed = isCollapsed.value[index]
  const bottomIsCollapsed = isCollapsed.value[index + 1]

  if (topIsCollapsed || bottomIsCollapsed) {
    console.warn('Resizing adjacent to or of a collapsed row is currently disabled.')
    return
  }

  const deltaY = event.clientY - startY.value
  const containerHeight = document.querySelector('.flex').offsetHeight
  let deltaPercentage = (deltaY / containerHeight) * 100

  const originalHeightTop = startHeights.value[index]
  const originalHeightBottom = startHeights.value[index + 1]

  // 计算初步的新高度
  let newHeightTop = originalHeightTop + deltaPercentage
  let newHeightBottom = originalHeightBottom - deltaPercentage

  // 应用最小高度限制
  const minHeight = minExpandedHeightPercentage
  if (newHeightTop < minHeight) {
    deltaPercentage = minHeight - originalHeightTop
    newHeightTop = minHeight
    newHeightBottom = originalHeightBottom - deltaPercentage
  } else if (newHeightBottom < minHeight) {
    deltaPercentage = originalHeightBottom - minHeight
    newHeightBottom = minHeight
    newHeightTop = originalHeightTop + deltaPercentage
  }

  rowHeights.value[index] = newHeightTop
  rowHeights.value[index + 1] = newHeightBottom
}

// 停止调整大小
const stopResize = () => {
  resizingIndex.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
})
</script>
