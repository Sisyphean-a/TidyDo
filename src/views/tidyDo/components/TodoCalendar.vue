<template>
  <div class="todo-calendar">
    <!-- 日历控制栏 -->
    <v-card
      flat
      class="mb-4"
    >
      <v-card-text class="d-flex align-center justify-space-between py-2">
        <div class="d-flex align-center">
          <v-icon class="me-2">mdi-calendar</v-icon>
          <span class="text-body-2">时间维度：</span>
        </div>
        <v-btn-toggle
          v-model="selectedTimeField"
          variant="outlined"
          density="compact"
          mandatory
        >
          <v-btn
            value="endDate"
            size="small"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-clock
            </v-icon>
            截止时间
          </v-btn>
          <v-btn
            value="createdAt"
            size="small"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-plus
            </v-icon>
            创建时间
          </v-btn>
          <v-btn
            value="updatedAt"
            size="small"
          >
            <v-icon
              start
              size="small"
            >
              mdi-calendar-edit
            </v-icon>
            更新时间
          </v-btn>
        </v-btn-toggle>
        <div class="d-flex align-center">
          <v-chip
            size="small"
            color="primary"
            variant="tonal"
            class="me-2"
          >
            {{ calendarMode.description }}
          </v-chip>
          <span class="text-caption text-medium-emphasis">
            {{ dateRangeInfo.hasValidDates ? 
              `${dateRangeInfo.validCount}/${dateRangeInfo.totalCount} 项有效` : 
              '使用创建时间' }}
          </span>
        </div>
      </v-card-text>
    </v-card>

    <!-- 空状态 -->
    <v-container
      v-if="!todos || todos.length === 0"
      class="text-center pa-12"
    >
      <v-icon
        size="64"
        color="grey-lighten-2"
      >
        mdi-calendar-blank
      </v-icon>
      <h3 class="text-h6 mt-4 text-medium-emphasis">没有待办事项</h3>
      <p class="text-body-2 text-medium-emphasis">当前筛选条件下没有可显示的待办事项</p>
    </v-container>

    <!-- 多月日历网格 -->
    <div
      v-else
      class="calendar-container"
    >
      <div
        v-for="rowConfig in multiMonthLayout.layout"
        :key="`row-${rowConfig.row}`"
        class="calendar-row"
        :class="`calendar-row--${rowConfig.monthsInRow}-months`"
      >
        <div
          v-for="monthIndex in rowConfig.monthsInRow"
          :key="`month-${rowConfig.startIndex + monthIndex - 1}`"
          class="calendar-month-wrapper"
        >
          <div class="calendar-month">
            <!-- 月份标题 -->
            <div class="calendar-month-header">
              <h3 class="calendar-month-title">
                {{ calendarMonths[rowConfig.startIndex + monthIndex - 1]?.year }}年{{ calendarMonths[rowConfig.startIndex + monthIndex - 1]?.monthName }}
              </h3>
            </div>

            <!-- 星期标题 -->
            <div class="calendar-weekdays">
              <div
                v-for="weekday in weekdays"
                :key="weekday"
                class="weekday-header"
              >
                {{ weekday }}
              </div>
            </div>

            <!-- 日期网格 -->
            <div class="calendar-grid">
              <div
                v-for="dayData in calendarMonths[rowConfig.startIndex + monthIndex - 1]?.days"
                :key="dayData.date.getTime()"
                class="calendar-day"
                :class="{
                  'calendar-day--other-month': !dayData.isCurrentMonth,
                  'calendar-day--today': isToday(dayData.date),
                  'calendar-day--has-todos': getTodoCount(dayData.date) > 0
                }"
              >
                <div class="calendar-day-content">
                  <!-- 日期数字 -->
                  <div class="calendar-day-number">
                    {{ dayData.date.getDate() }}
                  </div>

                  <!-- Todo图标/色块区域 -->
                  <div
                    v-if="getTodoCount(dayData.date) > 0"
                    class="calendar-day-todos"
                  >
                    <!-- 显示前几个todo的图标 -->
                    <div
                      v-for="(todoIcon, index) in getTodoIcons(dayData.date)"
                      :key="`${dayData.date.getTime()}-${index}`"
                      class="todo-icon"
                      :class="todoIcon.class"
                    >
                      <v-tooltip
                        :text="todoIcon.tooltip"
                        location="top"
                      >
                        <template v-slot:activator="{ props }">
                          <v-icon
                            v-bind="props"
                            :icon="todoIcon.icon"
                            :color="todoIcon.color"
                            size="x-small"
                            class="todo-icon-symbol"
                          />
                        </template>
                      </v-tooltip>
                    </div>

                    <!-- 显示更多项目的指示器 -->
                    <div
                      v-if="getTodoCount(dayData.date) > getMaxVisibleTodos()"
                      class="todo-more-indicator"
                    >
                      <v-tooltip
                        :text="getMoreTooltipText(dayData.date)"
                        location="top"
                      >
                        <template v-slot:activator="{ props }">
                          <span
                            v-bind="props"
                            class="more-count"
                          >
                            +{{ getTodoCount(dayData.date) - getMaxVisibleTodos() }}
                          </span>
                        </template>
                      </v-tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <v-card
      flat
      class="mt-4"
    >
      <v-card-text class="py-2">
        <div class="d-flex align-center justify-space-between">
          <span class="text-body-2 text-medium-emphasis">数据密度：</span>
          <div class="d-flex align-center">
            <div
              v-for="level in densityLevels"
              :key="level.name"
              class="d-flex align-center me-4"
            >
              <div
                class="density-sample me-1"
                :class="level.class"
              ></div>
              <span class="text-caption">{{ level.label }}</span>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  calculateDateRange,
  determineCalendarMode,
  generateCalendarGrid,
  getDateKey,
  formatCalendarDate,
  getDensityColor,
  getDensityLevel,
  aggregateTodosByDate,
  getMonthsPerRow,
  calculateMultiMonthLayout
} from '@/utils/dateUtils'

// Props
const props = defineProps({
  todos: {
    type: Array,
    required: true,
    default: () => [],
  },
  viewAllMode: {
    type: Boolean,
    default: false,
  },
  searchQuery: {
    type: String,
    default: '',
  },
})

// 本地状态
const selectedTimeField = ref('endDate')
const screenWidth = ref(window.innerWidth)

// 星期标题
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 密度等级配置
const densityLevels = [
  { name: 'none', label: '无', class: 'density-none' },
  { name: 'low', label: '1-2项', class: 'density-low' },
  { name: 'medium', label: '3-5项', class: 'density-medium' },
  { name: 'high', label: '6+项', class: 'density-high' }
]

// 计算属性

// 日期范围信息
const dateRangeInfo = computed(() => {
  return calculateDateRange(props.todos, selectedTimeField.value)
})

// 日历显示模式
const calendarMode = computed(() => {
  return determineCalendarMode(dateRangeInfo.value.spanDays)
})

// 日历月份数据
const calendarMonths = computed(() => {
  const { minDate } = dateRangeInfo.value
  const { monthsToShow } = calendarMode.value
  
  // 确保从月初开始显示
  const startDate = new Date(minDate)
  startDate.setDate(1)
  
  return generateCalendarGrid(startDate, monthsToShow)
})

// 按日期聚合的todo数据
const todosByDate = computed(() => {
  return aggregateTodosByDate(props.todos, selectedTimeField.value)
})

// 多月布局配置
const multiMonthLayout = computed(() => {
  const totalMonths = calendarMonths.value.length
  const monthsPerRow = getMonthsPerRow(screenWidth.value)
  return calculateMultiMonthLayout(totalMonths, monthsPerRow)
})

// 方法

// 获取指定日期的todo数量
const getTodoCount = (date) => {
  const dateKey = getDateKey(date)
  return todosByDate.value[dateKey]?.count || 0
}

// 获取密度样式类
const getDensityClass = (date) => {
  const count = getTodoCount(date)
  const level = getDensityLevel(count)
  return `density-${level}`
}

// 检查是否为今天
const isToday = (date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

// 获取工具提示文本
const getTooltipText = (date) => {
  const dateKey = getDateKey(date)
  const dayData = todosByDate.value[dateKey]
  
  if (!dayData || dayData.count === 0) return ''
  
  const dateStr = formatCalendarDate(date, 'long')
  const todos = dayData.todos.slice(0, 5) // 最多显示5个
  const todoTitles = todos.map(todo => `• ${todo.title}`).join('\n')
  const moreCount = dayData.count - todos.length
  
  let tooltip = `${dateStr}\n共 ${dayData.count} 项待办：\n${todoTitles}`
  if (moreCount > 0) {
    tooltip += `\n... 还有 ${moreCount} 项`
  }
  
  return tooltip
}

// 获取最大可见todo数量
const getMaxVisibleTodos = () => {
  return 4 // 最多显示4个图标
}

// 获取todo图标配置
const getTodoIcons = (date) => {
  const dateKey = getDateKey(date)
  const dayData = todosByDate.value[dateKey]

  if (!dayData || dayData.count === 0) return []

  const maxVisible = getMaxVisibleTodos()
  const todosToShow = dayData.todos.slice(0, maxVisible)

  return todosToShow.map((todo, index) => ({
    icon: getTodoIcon(todo),
    color: getTodoColor(todo),
    class: `todo-icon--${getTodoStatus(todo)}`,
    tooltip: `${todo.title}${todo.endDate ? ` (截止: ${formatCalendarDate(new Date(todo.endDate), 'short')})` : ''}`
  }))
}

// 获取todo图标
const getTodoIcon = (todo) => {
  switch (todo.status) {
    case 'completed':
      return 'mdi-check-circle'
    case 'in-progress':
      return 'mdi-clock-outline'
    case 'pending':
    default:
      return 'mdi-circle-outline'
  }
}

// 获取todo颜色
const getTodoColor = (todo) => {
  switch (todo.status) {
    case 'completed':
      return 'success'
    case 'in-progress':
      return 'warning'
    case 'pending':
    default:
      return 'primary'
  }
}

// 获取todo状态
const getTodoStatus = (todo) => {
  return todo.status || 'pending'
}

// 获取更多项目的工具提示文本
const getMoreTooltipText = (date) => {
  const dateKey = getDateKey(date)
  const dayData = todosByDate.value[dateKey]

  if (!dayData) return ''

  const maxVisible = getMaxVisibleTodos()
  const hiddenTodos = dayData.todos.slice(maxVisible)
  const hiddenTitles = hiddenTodos.map(todo => `• ${todo.title}`).join('\n')

  return `还有 ${hiddenTodos.length} 项待办：\n${hiddenTitles}`
}

// 监听时间字段变化
watch(selectedTimeField, () => {
  // 可以在这里添加额外的逻辑，比如保存用户偏好
})

// 监听窗口大小变化
const handleResize = () => {
  screenWidth.value = window.innerWidth
}

// 组件挂载时添加监听器
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.todo-calendar {
  height: calc(100vh - 65px);
  overflow-y: auto;
  padding: 16px;
}

.calendar-container {
  max-width: 100%;
  padding: 0 8px;
}

/* 多月布局 */
.calendar-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  justify-content: center;
}

.calendar-row--1-months {
  justify-content: center;
}

.calendar-row--2-months {
  justify-content: center;
}

.calendar-row--3-months {
  justify-content: space-between;
}

.calendar-month-wrapper {
  flex: 1;
  max-width: 400px;
  min-width: 280px;
}

.calendar-month {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.calendar-month:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.calendar-month-header {
  text-align: center;
  margin-bottom: 16px;
}

.calendar-month-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
  margin: 0;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 8px;
}

.weekday-header {
  text-align: center;
  font-weight: 500;
  font-size: 0.75rem;
  color: #666;
  padding: 6px 2px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.calendar-day {
  background: white;
  min-height: 45px;
  position: relative;
}

.calendar-day--other-month {
  opacity: 0.3;
}

.calendar-day--today .calendar-day-content {
  border: 2px solid #1976d2;
}

.calendar-day-content {
  height: 100%;
  padding: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  transition: all 0.2s ease;
}

.calendar-day-content:hover {
  background: rgba(25, 118, 210, 0.05);
  border-radius: 4px;
}

.calendar-day-number {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  margin-bottom: 2px;
  color: #333;
}

.calendar-day--today .calendar-day-number {
  color: #1976d2;
  font-weight: 600;
}

.calendar-day--other-month .calendar-day-number {
  color: #999;
}

/* Todo图标区域 */
.calendar-day-todos {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 32px;
}

.todo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
  cursor: pointer;
}

.todo-icon:hover {
  transform: scale(1.2);
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.todo-icon-symbol {
  font-size: 8px !important;
}

.todo-icon--pending {
  border: 1px solid #1976d2;
}

.todo-icon--in-progress {
  border: 1px solid #f57c00;
  background: rgba(245, 124, 0, 0.1);
}

.todo-icon--completed {
  border: 1px solid #388e3c;
  background: rgba(56, 142, 60, 0.1);
}

/* 更多项目指示器 */
.todo-more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e0e0e0;
  border: 1px solid #bdbdbd;
  cursor: pointer;
  transition: all 0.2s ease;
}

.todo-more-indicator:hover {
  transform: scale(1.2);
  background: #d0d0d0;
  z-index: 2;
}

.more-count {
  font-size: 6px;
  font-weight: 600;
  color: #666;
  line-height: 1;
}

/* 密度样式（图例用） */
.density-sample {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.density-sample.density-none {
  background-color: #f5f5f5;
}

.density-sample.density-low {
  background-color: #e3f2fd;
}

.density-sample.density-medium {
  background-color: #90caf9;
}

.density-sample.density-high {
  background-color: #1976d2;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .calendar-row {
    gap: 12px;
  }

  .calendar-month-wrapper {
    max-width: 350px;
    min-width: 250px;
  }
}

@media (max-width: 768px) {
  .calendar-container {
    padding: 0 4px;
  }

  .calendar-row {
    gap: 8px;
    margin-bottom: 16px;
  }

  .calendar-month-wrapper {
    max-width: none;
    min-width: 200px;
  }

  .calendar-month {
    padding: 12px;
  }

  .calendar-month-title {
    font-size: 1rem;
  }

  .calendar-day {
    min-height: 40px;
  }

  .calendar-day-number {
    font-size: 0.7rem;
  }

  .calendar-day-todos {
    max-width: 28px;
  }

  .todo-icon {
    width: 10px;
    height: 10px;
  }

  .todo-icon-symbol {
    font-size: 7px !important;
  }

  .todo-more-indicator {
    width: 10px;
    height: 10px;
  }

  .more-count {
    font-size: 5px;
  }

  .weekday-header {
    font-size: 0.7rem;
    padding: 4px 1px;
  }
}

@media (max-width: 480px) {
  .todo-calendar {
    padding: 8px;
  }

  .calendar-container {
    padding: 0 2px;
  }

  .calendar-row {
    gap: 4px;
    margin-bottom: 12px;
  }

  .calendar-month {
    padding: 8px;
  }

  .calendar-month-title {
    font-size: 0.9rem;
  }

  .calendar-day {
    min-height: 35px;
  }

  .calendar-day-number {
    font-size: 0.65rem;
  }

  .calendar-day-todos {
    max-width: 24px;
  }

  .todo-icon {
    width: 8px;
    height: 8px;
  }

  .todo-icon-symbol {
    font-size: 6px !important;
  }

  .todo-more-indicator {
    width: 8px;
    height: 8px;
  }

  .more-count {
    font-size: 4px;
  }

  .weekday-header {
    font-size: 0.65rem;
    padding: 3px 1px;
  }
}
</style>
