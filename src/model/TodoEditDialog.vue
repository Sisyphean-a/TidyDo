<template>
  <v-dialog
    v-model="isVisible"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">{{ isCreateMode ? 'mdi-plus' : 'mdi-pencil' }}</v-icon>
        {{ isCreateMode ? '新建待办' : '编辑待办' }}
        <v-spacer />
        <v-btn
          icon
          variant="text"
          @click="handleClose"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form
          ref="formRef"
          v-model="isFormValid"
        >
          <v-row>
            <!-- 自定义编号 -->
            <v-col cols="4">
              <v-text-field
                v-model="formData.customNumber"
                label="自定义编号"
                variant="outlined"
                density="comfortable"
                placeholder="可选"
              />
            </v-col>
            <!-- 标题 -->
            <v-col cols="8">
              <v-text-field
                v-model="formData.title"
                label="标题 *"
                :rules="titleRules"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <!-- 描述 -->
          <v-textarea
            v-model="formData.description"
            label="描述"
            variant="outlined"
            density="comfortable"
            rows="3"
            class="mb-4"
          />

          <v-row>
            <!-- 节点日期 -->
            <v-col cols="6">
              <DatePickerField
                v-model="formData.milestoneDate"
                label="节点日期"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <!-- 结束日期 -->
            <v-col cols="6">
              <DatePickerField
                v-model="formData.endDate"
                label="结束日期"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <v-row>
            <!-- 状态 -->
            <v-col cols="6">
              <v-select
                v-model="formData.status"
                label="状态"
                :items="statusOptions"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <!-- 扩展字段区域 -->
          <v-expansion-panels class="my-4">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="me-2">mdi-cog</v-icon>
                高级选项
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <!-- 优先级 -->
                  <v-col cols="6">
                    <v-select
                      v-model="formData.priority"
                      label="优先级"
                      :items="priorityOptions"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>

                  <!-- 分配人 -->
                  <v-col cols="6">
                    <v-text-field
                      v-model="formData.assignee"
                      label="分配人"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <!-- 标签 -->
                <v-combobox
                  v-model="formData.tags"
                  label="标签"
                  variant="outlined"
                  density="comfortable"
                  multiple
                  chips
                  closable-chips
                  class="mb-4"
                />

                <!-- 分组 -->
                <v-select
                  v-model="formData.categoryId"
                  label="分组"
                  :items="categoryOptions"
                  variant="outlined"
                  density="comfortable"
                  item-title="name"
                  item-value="id"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- 只读信息（编辑模式下显示） -->
          <v-card
            v-if="!isCreateMode"
            variant="tonal"
            class="mb-4"
          >
            <v-card-text>
              <v-row dense>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">编号</div>
                  <div class="text-body-2 font-weight-medium">{{ formatId(item?.id) }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">创建时间</div>
                  <div class="text-body-2">{{ formatDate(item?.createdAt) }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">更新时间</div>
                  <div class="text-body-2">{{ formatDate(item?.updatedAt) }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">分类</div>
                  <div class="text-body-2">
                    {{ getCategoryName(item?.categoryId) }}
                    <span
                      v-if="formData.categoryId && formData.categoryId !== item?.categoryId"
                      class="text-primary"
                    >
                      → {{ getCategoryName(formData.categoryId) }}
                    </span>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          v-if="!isCreateMode"
          color="error"
          variant="outlined"
          @click="handleDelete"
          :disabled="isLoading"
        >
          <v-icon class="me-1">mdi-delete</v-icon>
          删除
        </v-btn>

        <v-spacer />

        <v-btn
          color="grey"
          variant="outlined"
          @click="handleClose"
          :disabled="isLoading"
        >
          取消
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          @click="handleSave"
          :disabled="!isFormValid || isLoading"
          :loading="isLoading"
        >
          {{ isCreateMode ? '创建' : '保存' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ConfigService } from '@/services/configService'
import DatePickerField from '@/components/DatePickerField.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  item: {
    type: Object,
    default: null,
  },
  categoryId: {
    type: String,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const formRef = ref(null)
const isFormValid = ref(false)
const isLoading = ref(false)

// 配置数据
const statusConfig = ref({})
const priorityConfig = ref({})
const fieldConfig = ref({})

// 表单数据
const formData = ref({
  customNumber: '',
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  milestoneDate: null,
  endDate: null,
  assignee: null,
  tags: [],
  categoryId: null,
})

// 计算属性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isCreateMode = computed(() => !props.item)

// 动态选项数据（基于配置）
const priorityOptions = computed(() => {
  return Object.entries(priorityConfig.value).map(([key, config]) => ({
    title: config.text,
    value: key,
  }))
})

const statusOptions = computed(() => {
  return Object.entries(statusConfig.value).map(([key, config]) => ({
    title: config.text,
    value: key,
  }))
})

// 分组选项（排除筛选类）
const categoryOptions = computed(() => {
  return (props.categories || []).filter((cat) => !cat.isFilterCategory)
})

// 验证规则
const titleRules = [
  (v) => !!v || '标题不能为空',
  (v) => (v && v.length <= 100) || '标题不能超过100个字符',
]

// 初始化表单数据
const initFormData = () => {
  if (props.item) {
    // 编辑模式
    formData.value = {
      customNumber: props.item.customNumber || '',
      title: props.item.title || '',
      description: props.item.description || '',
      priority: props.item.priority || 'medium',
      status: props.item.status || 'pending',
      milestoneDate: props.item.milestoneDate || null,
      endDate: props.item.endDate || props.item.dueDate || null, // 兼容旧数据
      assignee: props.item.assignee || null,
      tags: [...(props.item.tags || [])],
      categoryId: props.item.categoryId || null,
    }
  } else {
    // 创建模式
    formData.value = {
      customNumber: '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      milestoneDate: null,
      endDate: null,
      assignee: null,
      tags: [],
      categoryId: props.categoryId || null, // 默认使用传入的分组ID
    }
  }
}

// 监听弹窗显示状态
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      initFormData()
      nextTick(() => {
        formRef.value?.resetValidation()
      })
    }
  },
)

// 格式化ID
const formatId = (id) => {
  return id ? id.substring(0, 8).toUpperCase() : ''
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = props.categories.find((cat) => cat.id === categoryId)
  return category ? category.name : '未知分类'
}

// 处理保存
const handleSave = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  isLoading.value = true
  try {
    // 准备保存的数据
    const todoData = { ...formData.value }

    // 处理分组ID逻辑
    if (!todoData.categoryId) {
      if (isCreateMode.value) {
        // 创建模式：使用传入的当前分组
        todoData.categoryId = props.categoryId
      } else {
        // 编辑模式：保持原有分组
        todoData.categoryId = props.item?.categoryId
      }
    }

    if (props.item) {
      // 编辑模式
      emit('save', { ...props.item, ...todoData })
    } else {
      // 创建模式
      emit('save', todoData)
    }
  } finally {
    isLoading.value = false
  }
}

// 处理删除
const handleDelete = () => {
  if (props.item) {
    emit('delete', props.item)
  }
}

// 处理关闭
const handleClose = () => {
  isVisible.value = false
}

// 加载配置
const loadConfig = async () => {
  try {
    statusConfig.value = await ConfigService.getStatusConfig()
    priorityConfig.value = await ConfigService.getPriorityConfig()
    fieldConfig.value = await ConfigService.getFieldConfig()
  } catch (error) {
    console.error('加载配置失败：', error)
  }
}

// 组件挂载时加载配置
onMounted(() => {
  loadConfig()
})
</script>

<style lang="scss" scoped>
.v-card-title {
  background-color: rgba(var(--v-theme-surface), 0.04);
}

.v-expansion-panel-text {
  padding-top: 16px;
}
</style>
