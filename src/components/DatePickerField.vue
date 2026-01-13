<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom start"
    transition="scale-transition"
    min-width="auto"
  >
    <template v-slot:activator="{ props: activatorProps }">
      <v-text-field
        v-bind="{ ...activatorProps, ...$attrs }"
        :model-value="displayDate"
        :label="label"
        :variant="variant"
        :density="density"
        prepend-inner-icon="mdi-calendar"
        readonly
        @click:clear="clearDate"
      ></v-text-field>
    </template>

    <v-card>
      <v-date-picker
        v-model="date"
        color="primary"
        @update:model-value="onDateSelected"
        hide-header
        :first-day-of-week="1"
      ></v-date-picker>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn
          variant="text"
          @click="clearDateAndClose"
          >清空</v-btn
        >
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          color="primary"
          @click="selectToday"
          >今天</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Date, null],
    default: null,
  },
  label: {
    type: String,
    default: '日期',
  },
  variant: {
    type: String,
    default: 'outlined',
  },
  density: {
    type: String,
    default: 'comfortable',
  },
})

const emit = defineEmits(['update:modelValue'])

const menu = ref(false)
const date = ref(null)

// 监听外部值变化
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      date.value = new Date(val)
    } else {
      date.value = null
    }
  },
  { immediate: true },
)

// 显示的日期字符串 (yyyy/mm/dd)
const displayDate = computed(() => {
  if (!date.value) return ''
  try {
    const d = new Date(date.value)
    if (isNaN(d.getTime())) return ''

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return `${year}/${month}/${day}`
  } catch (e) {
    return ''
  }
})

// 处理日期选择
const onDateSelected = (newDate) => {
  menu.value = false
  if (newDate) {
    // 转换为 yyyy-mm-dd 字符串用于存储 (或者保持 Date 对象，取决于需求)
    // 这里我们假设后端和父组件期望标准 Date 字符串格式或者 Date 对象
    // 使用 dateUtils 中那种简单的 yyyy-mm-dd 格式
    const d = new Date(newDate)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    emit('update:modelValue', `${year}-${month}-${day}`)
  }
}

const clearDate = () => {
  date.value = null
  emit('update:modelValue', null)
}

const clearDateAndClose = () => {
  clearDate()
  menu.value = false
}

const selectToday = () => {
  // 创建今天的日期对象，保持本地时间
  const today = new Date()
  date.value = today
  // 复用选择逻辑以格式化和关闭菜单
  onDateSelected(today)
}
</script>
