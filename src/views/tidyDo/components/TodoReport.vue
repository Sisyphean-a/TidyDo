<template>
  <div class="todo-report">
    <!-- 报表头部 -->
    <v-card
      flat
      class="mb-4"
    >
      <v-card-text class="d-flex align-center justify-space-between py-3">
        <div class="d-flex align-center">
          <v-icon
            class="me-2"
            color="primary"
          >
            mdi-chart-box
          </v-icon>
          <div>
            <h2 class="text-h6 mb-0">数据报表</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              最后更新: {{ reportStore.formattedLastUpdated }}
            </p>
          </div>
        </div>
        
        <div class="d-flex align-center gap-2">
          <!-- 趋势天数选择 -->
          <v-select
            v-model="selectedTrendDays"
            :items="trendDaysOptions"
            label="趋势分析"
            density="compact"
            variant="outlined"
            style="width: 120px;"
            @update:model-value="handleTrendDaysChange"
          />
          
          <!-- 刷新按钮 -->
          <v-btn
            icon="mdi-refresh"
            variant="outlined"
            density="comfortable"
            :loading="reportStore.isLoading"
            @click="handleRefresh"
          />
          
          <!-- 导出按钮 -->
          <v-btn
            prepend-icon="mdi-download"
            variant="outlined"
            density="comfortable"
            :disabled="!reportStore.hasData"
            @click="handleExport"
          >
            导出
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 加载状态 -->
    <div
      v-if="reportStore.isLoading && !reportStore.hasData"
      class="text-center py-12"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      />
      <p class="text-body-1 mt-4">正在加载报表数据...</p>
    </div>

    <!-- 报表内容 -->
    <div
      v-else-if="reportStore.hasData"
      class="report-content"
    >
      <!-- 概览卡片 -->
      <v-row class="mb-6">
        <v-col
          cols="12"
          md="3"
        >
          <v-card class="overview-card">
            <v-card-text class="text-center">
              <v-icon
                size="48"
                color="primary"
                class="mb-2"
              >
                mdi-format-list-bulleted
              </v-icon>
              <h3 class="text-h4 mb-1">{{ reportStore.projectCountStats?.totalProjects || 0 }}</h3>
              <p class="text-body-2 text-medium-emphasis">总项目数</p>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col
          cols="12"
          md="3"
        >
          <v-card class="overview-card">
            <v-card-text class="text-center">
              <v-icon
                size="48"
                color="success"
                class="mb-2"
              >
                mdi-check-circle
              </v-icon>
              <h3 class="text-h4 mb-1">{{ Math.round(reportStore.completionStats?.overallStats?.completionRate || 0) }}%</h3>
              <p class="text-body-2 text-medium-emphasis">完成率</p>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col
          cols="12"
          md="3"
        >
          <v-card class="overview-card">
            <v-card-text class="text-center">
              <v-icon
                size="48"
                color="info"
                class="mb-2"
              >
                mdi-folder-multiple
              </v-icon>
              <h3 class="text-h4 mb-1">{{ reportStore.projectCountStats?.totalCategories || 0 }}</h3>
              <p class="text-body-2 text-medium-emphasis">分类数量</p>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col
          cols="12"
          md="3"
        >
          <v-card class="overview-card">
            <v-card-text class="text-center">
              <v-icon
                size="48"
                color="warning"
                class="mb-2"
              >
                mdi-archive
              </v-icon>
              <h3 class="text-h4 mb-1">{{ reportStore.projectCountStats?.archivedTodos || 0 }}</h3>
              <p class="text-body-2 text-medium-emphasis">已归档</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 图表区域 -->
      <v-row>
        <!-- 项目状态分布 -->
        <v-col
          cols="12"
          md="6"
        >
          <v-card class="chart-card">
            <v-card-title>
              <v-icon class="me-2">mdi-chart-pie</v-icon>
              项目状态分布
            </v-card-title>
            <v-card-text>
              <div
                ref="statusChartRef"
                class="chart-container"
                style="height: 300px;"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 分类项目数量 -->
        <v-col
          cols="12"
          md="6"
        >
          <v-card class="chart-card">
            <v-card-title>
              <v-icon class="me-2">mdi-chart-bar</v-icon>
              分类项目数量
            </v-card-title>
            <v-card-text>
              <div
                ref="categoryChartRef"
                class="chart-container"
                style="height: 300px;"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 时间趋势分析 -->
        <v-col cols="12">
          <v-card class="chart-card">
            <v-card-title>
              <v-icon class="me-2">mdi-chart-line</v-icon>
              时间趋势分析 ({{ selectedTrendDays }}天)
            </v-card-title>
            <v-card-text>
              <div
                ref="trendChartRef"
                class="chart-container"
                style="height: 400px;"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 完成率仪表盘 -->
        <v-col
          cols="12"
          md="6"
        >
          <v-card class="chart-card">
            <v-card-title>
              <v-icon class="me-2">mdi-gauge</v-icon>
              完成率仪表盘
            </v-card-title>
            <v-card-text>
              <div
                ref="gaugeChartRef"
                class="chart-container"
                style="height: 300px;"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 优先级分布 -->
        <v-col
          cols="12"
          md="6"
        >
          <v-card class="chart-card">
            <v-card-title>
              <v-icon class="me-2">mdi-chart-donut</v-icon>
              优先级分布
            </v-card-title>
            <v-card-text>
              <div
                ref="priorityChartRef"
                class="chart-container"
                style="height: 300px;"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 无数据状态 -->
    <div
      v-else
      class="text-center py-12"
    >
      <v-icon
        size="64"
        color="grey-lighten-2"
      >
        mdi-chart-box-outline
      </v-icon>
      <h3 class="text-h6 mt-4 text-medium-emphasis">暂无报表数据</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">点击刷新按钮加载数据</p>
      <v-btn
        prepend-icon="mdi-refresh"
        color="primary"
        @click="handleRefresh"
      >
        加载数据
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useReportStore } from '@/stores/useReportStore'
import * as echarts from 'echarts'

// Props
const props = defineProps({
  // 可以添加props，比如自动刷新间隔等
})

// Store
const reportStore = useReportStore()

// 响应式数据
const selectedTrendDays = ref(30)
const trendDaysOptions = [
  { title: '7天', value: 7 },
  { title: '30天', value: 30 },
  { title: '90天', value: 90 },
  { title: '180天', value: 180 },
  { title: '365天', value: 365 }
]

// 图表引用
const statusChartRef = ref(null)
const categoryChartRef = ref(null)
const trendChartRef = ref(null)
const gaugeChartRef = ref(null)
const priorityChartRef = ref(null)

// 图表实例
let statusChart = null
let categoryChart = null
let trendChart = null
let gaugeChart = null
let priorityChart = null

// 方法
const handleRefresh = async () => {
  try {
    await reportStore.refreshReportData()
    await nextTick()
    initializeCharts()
  } catch (error) {
    console.error('刷新报表数据失败:', error)
  }
}

const handleTrendDaysChange = async (days) => {
  reportStore.setTrendDays(days)
  await reportStore.loadReportData()
  await nextTick()
  initializeCharts()
}

const handleExport = () => {
  try {
    const data = reportStore.exportReportData('json')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出报表数据失败:', error)
  }
}

// 初始化图表
const initializeCharts = () => {
  if (!reportStore.hasData) return

  initializeStatusChart()
  initializeCategoryChart()
  initializeTrendChart()
  initializeGaugeChart()
  initializePriorityChart()
}

// 初始化状态分布图表
const initializeStatusChart = () => {
  if (!statusChartRef.value) {
    console.log('状态图表容器未找到')
    return
  }

  if (statusChart) statusChart.dispose()
  statusChart = echarts.init(statusChartRef.value)

  const statusData = reportStore.statusDistributionStats
  if (!statusData) {
    console.log('状态分布数据为空')
    return
  }

  console.log('状态分布数据:', statusData)

  // 合并普通Todo和简单Todo的状态数据
  const combinedData = []

  // 普通Todo状态
  Object.entries(statusData.todoStatusStats || {}).forEach(([status, count]) => {
    const statusName = getStatusDisplayName(status)
    combinedData.push({ name: `${statusName}(Todo)`, value: count })
  })

  // 简单Todo状态
  Object.entries(statusData.simpleTodoStatusStats || {}).forEach(([status, count]) => {
    const statusName = getSimpleTodoStatusDisplayName(status)
    combinedData.push({ name: `${statusName}(简单)`, value: count })
  })

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '状态分布',
        type: 'pie',
        radius: '50%',
        data: combinedData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  statusChart.setOption(option)
}

// 初始化分类项目数量图表
const initializeCategoryChart = () => {
  if (!categoryChartRef.value) return

  if (categoryChart) categoryChart.dispose()
  categoryChart = echarts.init(categoryChartRef.value)

  const projectData = reportStore.projectCountStats
  if (!projectData?.categoryStats) return

  const categories = projectData.categoryStats.map(cat => cat.categoryName)
  const todoData = projectData.categoryStats.map(cat => cat.todoCount)
  const simpleTodoData = projectData.categoryStats.map(cat => cat.simpleTodoCount)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['普通Todo', '简单Todo']
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '普通Todo',
        type: 'bar',
        data: todoData,
        itemStyle: {
          color: '#1976d2'
        }
      },
      {
        name: '简单Todo',
        type: 'bar',
        data: simpleTodoData,
        itemStyle: {
          color: '#42a5f5'
        }
      }
    ]
  }

  categoryChart.setOption(option)
}

// 初始化时间趋势图表
const initializeTrendChart = () => {
  if (!trendChartRef.value) return

  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(trendChartRef.value)

  const trendData = reportStore.timeTrendStats
  if (!trendData) return

  const dates = trendData.dateRange
  const createdData = dates.map(date => trendData.dailyCreated[date]?.total || 0)
  const completedData = dates.map(date => trendData.dailyCompleted[date]?.total || 0)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['创建项目', '完成项目']
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        formatter: (value) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '创建项目',
        type: 'line',
        data: createdData,
        smooth: true,
        itemStyle: {
          color: '#4caf50'
        }
      },
      {
        name: '完成项目',
        type: 'line',
        data: completedData,
        smooth: true,
        itemStyle: {
          color: '#ff9800'
        }
      }
    ]
  }

  trendChart.setOption(option)
}

// 初始化完成率仪表盘
const initializeGaugeChart = () => {
  if (!gaugeChartRef.value) return

  if (gaugeChart) gaugeChart.dispose()
  gaugeChart = echarts.init(gaugeChartRef.value)

  const completionData = reportStore.completionStats
  if (!completionData) return

  const overallRate = completionData.overallStats?.completionRate || 0

  const option = {
    tooltip: {
      formatter: '{a} <br/>{b} : {c}%'
    },
    series: [
      {
        name: '完成率',
        type: 'gauge',
        detail: {
          formatter: '{value}%'
        },
        data: [
          {
            value: Math.round(overallRate),
            name: '总体完成率'
          }
        ],
        axisLine: {
          lineStyle: {
            color: [
              [0.3, '#ff4757'],
              [0.7, '#ffa502'],
              [1, '#2ed573']
            ]
          }
        }
      }
    ]
  }

  gaugeChart.setOption(option)
}

// 初始化优先级分布图表
const initializePriorityChart = () => {
  if (!priorityChartRef.value) return

  if (priorityChart) priorityChart.dispose()
  priorityChart = echarts.init(priorityChartRef.value)

  const priorityData = reportStore.priorityDistributionStats
  if (!priorityData?.priorityStats) return

  const data = Object.entries(priorityData.priorityStats).map(([priority, count]) => ({
    name: getPriorityDisplayName(priority),
    value: count
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '优先级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '30',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }

  priorityChart.setOption(option)
}

// 辅助函数
const getStatusDisplayName = (status) => {
  const statusMap = {
    'pending': '待办',
    'in-progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

const getSimpleTodoStatusDisplayName = (status) => {
  const statusMap = {
    'todo': '待办',
    'doing': '进行中',
    'done': '已完成',
    'paused': '暂停'
  }
  return statusMap[status] || status
}

const getPriorityDisplayName = (priority) => {
  const priorityMap = {
    'low': '低优先级',
    'medium': '中优先级',
    'high': '高优先级',
    'urgent': '紧急'
  }
  return priorityMap[priority] || priority
}

// 监听数据变化
watch(() => reportStore.hasData, (hasData) => {
  if (hasData) {
    nextTick(() => {
      initializeCharts()
    })
  }
})

// 窗口大小变化处理
const handleResize = () => {
  if (statusChart) statusChart.resize()
  if (categoryChart) categoryChart.resize()
  if (trendChart) trendChart.resize()
  if (gaugeChart) gaugeChart.resize()
  if (priorityChart) priorityChart.resize()
}

// 生命周期
onMounted(async () => {
  // 加载报表数据
  if (!reportStore.hasData || reportStore.isDataStale) {
    await reportStore.loadReportData()
  }

  await nextTick()
  initializeCharts()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 清理图表实例
  if (statusChart) statusChart.dispose()
  if (categoryChart) categoryChart.dispose()
  if (trendChart) trendChart.dispose()
  if (gaugeChart) gaugeChart.dispose()
  if (priorityChart) priorityChart.dispose()

  // 移除事件监听
  window.removeEventListener('resize', handleResize)

  // 停止自动刷新
  reportStore.stopAutoRefresh()
})
</script>

<style scoped>
.todo-report {
  padding: 16px;
}

.overview-card {
  height: 140px;
  display: flex;
  align-items: center;
}

.chart-card {
  height: auto;
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
}

.report-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
