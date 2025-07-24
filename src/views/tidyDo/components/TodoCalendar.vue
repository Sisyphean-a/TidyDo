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

    <!-- 日历网格 -->
    <div
      v-else
      class="calendar-container"
    >
      <div
        v-for="monthData in calendarMonths"
        :key="`${monthData.year}-${monthData.month}`"
        class="calendar-month mb-6"
      >
        <!-- 月份标题 -->
        <v-card
          flat
          class="mb-3"
        >
          <v-card-title class="text-h6 py-2">
            {{ monthData.year }}年{{ monthData.monthName }}
          </v-card-title>
        </v-card>

        <!-- 星期标题 -->
        <div class="calendar-weekdays mb-2">
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
            v-for="dayData in monthData.days"
            :key="dayData.date.getTime()"
            class="calendar-day"
            :class="{
              'calendar-day--other-month': !dayData.isCurrentMonth,
              'calendar-day--today': isToday(dayData.date),
              'calendar-day--has-todos': getTodoCount(dayData.date) > 0
            }"
          >
            <v-tooltip
              v-if="getTodoCount(dayData.date) > 0"
              :text="getTooltipText(dayData.date)"
              location="top"
            >
              <template v-slot:activator="{ props }">
                <div
                  v-bind="props"
                  class="calendar-day-content"
                  :class="getDensityClass(dayData.date)"
                >
                  <div class="calendar-day-number">
                    {{ dayData.date.getDate() }}
                  </div>
                  <div class="calendar-day-count">
                    {{ getTodoCount(dayData.date) }}
                  </div>
                </div>
              </template>
            </v-tooltip>
            <div
              v-else
              class="calendar-day-content calendar-day-content--empty"
            >
              <div class="calendar-day-number">
                {{ dayData.date.getDate() }}
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
import { ref, computed, watch } from 'vue'
import {
  calculateDateRange,
  determineCalendarMode,
  generateCalendarGrid,
  getDateKey,
  formatCalendarDate,
  getDensityColor,
  getDensityLevel,
  aggregateTodosByDate
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

// 监听时间字段变化
watch(selectedTimeField, () => {
  // 可以在这里添加额外的逻辑，比如保存用户偏好
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
}

.calendar-month {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  font-size: 0.875rem;
  color: #666;
  padding: 8px 4px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.calendar-day {
  background: white;
  min-height: 60px;
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
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.calendar-day-content:hover {
  transform: scale(1.05);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.calendar-day-content--empty {
  cursor: default;
}

.calendar-day-content--empty:hover {
  transform: none;
  box-shadow: none;
}

.calendar-day-number {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
}

.calendar-day-count {
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 2px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  color: #333;
}

/* 密度样式 */
.density-none {
  background-color: #f5f5f5;
}

.density-low {
  background-color: #e3f2fd;
}

.density-medium {
  background-color: #90caf9;
}

.density-high {
  background-color: #1976d2;
  color: white;
}

.density-high .calendar-day-number,
.density-high .calendar-day-count {
  color: white;
}

.density-high .calendar-day-count {
  background: rgba(255, 255, 255, 0.2);
}

.density-sample {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid #ddd;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-day {
    min-height: 50px;
  }
  
  .calendar-day-number {
    font-size: 0.75rem;
  }
  
  .calendar-day-count {
    font-size: 0.625rem;
    padding: 1px 4px;
  }
  
  .weekday-header {
    font-size: 0.75rem;
    padding: 6px 2px;
  }
}

@media (max-width: 480px) {
  .todo-calendar {
    padding: 8px;
  }
  
  .calendar-month {
    padding: 12px;
  }
  
  .calendar-day {
    min-height: 40px;
  }
}
</style>
