/**
 * 日期处理工具函数
 * 为日历视图提供日期计算、格式化和网格生成等功能
 */

/**
 * 计算todo项目的时间跨度
 * @param {Array} todos - todo项目数组
 * @param {string} timeField - 时间字段名称 ('endDate', 'createdAt', 'updatedAt')
 * @returns {Object} 包含最小日期、最大日期和跨度天数的对象
 */
export const calculateDateRange = (todos, timeField = 'endDate') => {
  if (!todos || todos.length === 0) {
    const today = new Date()
    return {
      minDate: today,
      maxDate: today,
      spanDays: 0,
      hasValidDates: false
    }
  }

  // 过滤出有效日期的todo项目
  const validTodos = todos.filter(todo => {
    const dateValue = getDateValue(todo, timeField)
    return dateValue && !isNaN(new Date(dateValue).getTime())
  })

  if (validTodos.length === 0) {
    // 如果没有有效日期，使用创建时间作为fallback
    const fallbackTodos = todos.filter(todo => todo.createdAt)
    if (fallbackTodos.length === 0) {
      const today = new Date()
      return {
        minDate: today,
        maxDate: today,
        spanDays: 0,
        hasValidDates: false
      }
    }

    const dates = fallbackTodos.map(todo => new Date(todo.createdAt))
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))
    const spanDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))

    return {
      minDate,
      maxDate,
      spanDays,
      hasValidDates: false,
      fallbackField: 'createdAt'
    }
  }

  // 计算有效日期的范围
  const dates = validTodos.map(todo => new Date(getDateValue(todo, timeField)))
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))
  const spanDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))

  return {
    minDate,
    maxDate,
    spanDays,
    hasValidDates: true,
    validCount: validTodos.length,
    totalCount: todos.length
  }
}

/**
 * 获取todo项目的指定时间字段值
 * @param {Object} todo - todo项目
 * @param {string} timeField - 时间字段名称
 * @returns {string|null} 时间字段值
 */
const getDateValue = (todo, timeField) => {
  switch (timeField) {
    case 'milestoneDate':
      return todo.milestoneDate
    case 'endDate':
      return todo.endDate || todo.dueDate // 兼容旧数据
    case 'updatedAt':
      return todo.updatedAt
    case 'createdAt':
    default:
      return todo.createdAt
  }
}

/**
 * 根据时间跨度确定最佳的日历显示模式
 * @param {number} spanDays - 时间跨度天数
 * @returns {Object} 包含显示模式和相关配置的对象
 */
export const determineCalendarMode = (spanDays) => {
  if (spanDays <= 31) {
    return {
      mode: 'month',
      description: '月视图',
      monthsToShow: 1
    }
  } else if (spanDays <= 93) {
    return {
      mode: 'quarter',
      description: '季度视图',
      monthsToShow: 3
    }
  } else if (spanDays <= 186) {
    return {
      mode: 'half-year',
      description: '半年视图',
      monthsToShow: 6
    }
  } else {
    return {
      mode: 'year',
      description: '年视图',
      monthsToShow: 12
    }
  }
}

/**
 * 根据屏幕宽度确定每行显示的月份数量
 * @param {number} screenWidth - 屏幕宽度
 * @returns {number} 每行显示的月份数量
 */
export const getMonthsPerRow = (screenWidth) => {
  if (screenWidth >= 1200) {
    return 3 // 桌面端：3个月一行
  } else if (screenWidth >= 768) {
    return 2 // 平板端：2个月一行
  } else {
    return 1 // 移动端：1个月一行
  }
}

/**
 * 计算多月布局的行列配置
 * @param {number} totalMonths - 总月份数
 * @param {number} monthsPerRow - 每行月份数
 * @returns {Object} 包含行数和布局配置的对象
 */
export const calculateMultiMonthLayout = (totalMonths, monthsPerRow) => {
  const rows = Math.ceil(totalMonths / monthsPerRow)
  const layout = []

  for (let row = 0; row < rows; row++) {
    const startIndex = row * monthsPerRow
    const endIndex = Math.min(startIndex + monthsPerRow, totalMonths)
    const monthsInRow = endIndex - startIndex

    layout.push({
      row,
      startIndex,
      endIndex,
      monthsInRow
    })
  }

  return {
    rows,
    layout,
    totalMonths,
    monthsPerRow
  }
}

/**
 * 生成日历网格数据
 * @param {Date} startDate - 开始日期
 * @param {number} monthsToShow - 要显示的月份数
 * @returns {Array} 日历网格数据数组
 */
export const generateCalendarGrid = (startDate, monthsToShow = 1) => {
  const months = []
  const currentDate = new Date(startDate)

  // 确保从月初开始
  currentDate.setDate(1)

  for (let i = 0; i < monthsToShow; i++) {
    const monthData = generateMonthGrid(new Date(currentDate))
    months.push(monthData)

    // 移动到下一个月
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return months
}

/**
 * 生成单个月份的网格数据
 * @param {Date} monthDate - 月份日期
 * @returns {Object} 月份网格数据
 */
const generateMonthGrid = (monthDate) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  // 获取月份信息
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // 获取第一天是星期几（0=周日，1=周一...）
  let firstDayOfWeek = firstDay.getDay()
  // 转换为周一开始（0=周一，1=周二...）
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  // 生成日期网格
  const days = []

  // 添加上个月的日期（填充）
  const prevMonth = new Date(year, month - 1, 0)
  const prevMonthDays = prevMonth.getDate()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false
    })
  }

  // 添加当前月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false
    })
  }

  // 添加下个月的日期（填充到42个格子，6行7列）
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
      isPrevMonth: false,
      isNextMonth: true
    })
  }

  return {
    year,
    month,
    monthName: getMonthName(month),
    days,
    firstDay,
    lastDay
  }
}

/**
 * 获取月份名称
 * @param {number} month - 月份索引（0-11）
 * @returns {string} 月份名称
 */
const getMonthName = (month) => {
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]
  return monthNames[month]
}

/**
 * 生成日期键（用于数据聚合）
 * @param {Date} date - 日期对象
 * @returns {string} 标准化的日期键
 */
export const getDateKey = (date) => {
  if (!date) return null
  const d = new Date(date)
  if (isNaN(d.getTime())) return null

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日历显示日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式类型 ('short', 'long', 'day')
 * @returns {string} 格式化后的日期字符串
 */
export const formatCalendarDate = (date, format = 'short') => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  switch (format) {
    case 'day':
      return String(d.getDate())
    case 'long':
    case 'short':
    default:
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}/${month}/${day}`
  }
}

/**
 * 根据todo数量获取密度颜色
 * @param {number} count - todo数量
 * @returns {string} 颜色类名或颜色值
 */
export const getDensityColor = (count) => {
  if (count === 0) return 'grey-lighten-4'
  if (count <= 2) return 'blue-lighten-3'
  if (count <= 5) return 'blue-lighten-1'
  return 'blue-darken-1'
}

/**
 * 根据todo数量获取密度等级
 * @param {number} count - todo数量
 * @returns {string} 密度等级
 */
export const getDensityLevel = (count) => {
  if (count === 0) return 'none'
  if (count <= 2) return 'low'
  if (count <= 5) return 'medium'
  return 'high'
}

/**
 * 聚合todos按日期分组
 * @param {Array} todos - todo项目数组
 * @param {string} timeField - 时间字段名称
 * @returns {Object} 按日期键分组的todo数据
 */
export const aggregateTodosByDate = (todos, timeField = 'endDate') => {
  const dateMap = {}

  todos.forEach(todo => {
    const dateValue = getDateValue(todo, timeField)
    if (!dateValue) return

    const dateKey = getDateKey(dateValue)
    if (!dateKey) return

    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {
        date: new Date(dateValue),
        todos: [],
        count: 0
      }
    }

    dateMap[dateKey].todos.push(todo)
    dateMap[dateKey].count++
  })

  return dateMap
}
