<template>
  <v-dialog
    v-model="isVisible"
    max-width="800"
    persistent
    class="todo-edit-modal"
  >
    <v-card>
      <v-card-title class="flex items-center">
        <v-icon
          class="mr-2"
          :color="isCreateMode ? 'primary' : 'warning'"
        >
          {{ isCreateMode ? 'mdi-plus' : 'mdi-pencil' }}
        </v-icon>
        <span>{{ isCreateMode ? '新建待办' : '编辑待办' }}</span>
        <v-spacer />
      </v-card-title>

      <v-divider />

      <v-card-text class="p-6">
        <v-form
          ref="formRef"
          v-model="isFormValid"
          @submit.prevent="handleSubmit"
        >
          <!-- 基本信息 -->
          <div class="mb-6">
            <v-row>
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model="formData.customNumber"
                  label="自定义编号"
                  variant="outlined"
                  density="comfortable"
                  placeholder="可选"
                  prepend-inner-icon="mdi-hashtag"
                />
              </v-col>
              <v-col
                cols="12"
                md="8"
              >
                <v-text-field
                  v-model="formData.title"
                  label="标题 *"
                  :rules="titleRules"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-clipboard-text"
                />
              </v-col>
            </v-row>

            <v-textarea
              v-model="formData.description"
              label="描述"
              variant="outlined"
              density="comfortable"
              rows="3"
              prepend-inner-icon="mdi-text"
            />
          </div>

          <!-- 时间和状态 -->
          <div class="mb-6">
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="formData.endDate"
                  label="截止日期"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="formData.status"
                  label="状态"
                  :items="statusOptions"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-flag"
                />
              </v-col>
            </v-row>
          </div>

          <!-- 高级选项 -->
          <v-expansion-panels class="mb-6">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2">mdi-tune</v-icon>
                高级选项
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-select
                      v-model="formData.priority"
                      label="优先级"
                      :items="priorityOptions"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-flag-variant"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-text-field
                      v-model="formData.assignee"
                      label="分配人"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-account"
                    />
                  </v-col>
                </v-row>

                <v-combobox
                  v-model="formData.tags"
                  label="标签"
                  variant="outlined"
                  density="comfortable"
                  multiple
                  chips
                  closable-chips
                  prepend-inner-icon="mdi-tag-multiple"
                />

                <v-select
                  v-model="formData.categoryId"
                  label="分类"
                  :items="availableCategories"
                  variant="outlined"
                  density="comfortable"
                  item-title="name"
                  item-value="id"
                  prepend-inner-icon="mdi-folder"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- 只读信息（编辑模式） -->
          <v-card
            v-if="!isCreateMode"
            variant="tonal"
          >
            <v-card-text>
              <div class="text-subtitle-2 mb-2">详细信息</div>
              <v-row dense>
                <v-col
                  cols="6"
                  md="3"
                >
                  <div class="text-caption text-medium-emphasis">编号</div>
                  <div class="text-body-2 font-weight-medium">
                    {{ formatId(editingTodo?.id) }}
                  </div>
                </v-col>
                <v-col
                  cols="6"
                  md="3"
                >
                  <div class="text-caption text-medium-emphasis">创建时间</div>
                  <div class="text-body-2">
                    {{ formatDateTime(editingTodo?.createdAt) }}
                  </div>
                </v-col>
                <v-col
                  cols="6"
                  md="3"
                >
                  <div class="text-caption text-medium-emphasis">更新时间</div>
                  <div class="text-body-2">
                    {{ formatDateTime(editingTodo?.updatedAt) }}
                  </div>
                </v-col>
                <v-col
                  cols="6"
                  md="3"
                >
                  <div class="text-caption text-medium-emphasis">状态</div>
                  <v-chip
                    :color="getStatusColor(editingTodo?.status)"
                    size="small"
                  >
                    {{ getStatusText(editingTodo?.status) }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="p-4">
        <v-btn
          v-if="!isCreateMode"
          color="error"
          variant="outlined"
          @click="handleDelete"
          :disabled="isLoading"
        >
          <v-icon class="mr-1">mdi-delete</v-icon>
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
          @click="handleSubmit"
          :disabled="!isFormValid || isLoading"
          :loading="isLoading"
        >
          {{ isCreateMode ? '创建' : '更新' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { TodoBusinessService } from '@/services/todoBusinessService'
import { ConfigService } from '@/services/configService'

const props = defineProps({
  // 对话框可见性
  modelValue: {
    type: Boolean,
    default: false,
  },
  // 编辑中的待办事项
  editingTodo: {
    type: Object,
    default: null,
  },
  // 分类列表
  categories: {
    type: Array,
    default: () => [],
  },
  // 默认分类ID
  defaultCategoryId: {
    type: String,
    default: null,
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'delete', 'close'])

// 表单状态
const formRef = ref(null)
const isFormValid = ref(false)
const isLoading = computed(() => props.loading)

// 配置数据
const statusConfig = ref({})
const priorityConfig = ref({})

// 表单数据
const formData = ref({
  title: '',
  customNumber: '',
  description: '',
  endDate: null,
  status: 'pending',
  priority: 'medium',
  assignee: '',
  tags: [],
  categoryId: null,
})

// 计算属性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isCreateMode = computed(() => !props.editingTodo)

const availableCategories = computed(() => {
  return props.categories.filter((cat) => !cat.isFilterCategory)
})

// 表单选项 - 从配置中获取
const statusOptions = computed(() => {
  return Object.entries(statusConfig.value).map(([key, config]) => ({
    title: config.text,
    value: key,
  }))
})

const priorityOptions = computed(() => {
  return Object.entries(priorityConfig.value).map(([key, config]) => ({
    title: config.text,
    value: key,
  }))
})

// 表单验证规则
const titleRules = [
  (v) => !!v || '标题是必填项',
  (v) => (v && v.length <= 100) || '标题不能超过100个字符',
]

// 加载配置数据
const loadConfigs = async () => {
  try {
    [statusConfig.value, priorityConfig.value] = await Promise.all([
      ConfigService.getStatusConfig(),
      ConfigService.getPriorityConfig(),
    ])
  } catch (error) {
    console.error('加载配置失败:', error)
    // 使用默认配置
    statusConfig.value = {
      pending: { text: '待办', color: 'warning' },
      inProgress: { text: '进行中', color: 'info' },
      completed: { text: '已完成', color: 'success' },
      cancelled: { text: '已取消', color: 'error' },
    }
    priorityConfig.value = {
      low: { text: '低', color: 'success' },
      medium: { text: '中', color: 'warning' },
      high: { text: '高', color: 'error' },
    }
  }
}

// 表单处理
const initializeForm = () => {
  if (props.editingTodo) {
    // 编辑模式
    formData.value = {
      ...props.editingTodo,
      tags: props.editingTodo.tags ? [...props.editingTodo.tags] : [],
    }
  } else {
    // 创建模式
    formData.value = {
      title: '',
      customNumber: '',
      description: '',
      endDate: null,
      status: 'pending',
      priority: 'medium',
      assignee: '',
      tags: [],
      categoryId: props.defaultCategoryId || availableCategories.value[0]?.id || null,
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const { valid } = await formRef.value.validate()
  if (!valid) return

  const todoData = {
    ...formData.value,
    tags: Array.isArray(formData.value.tags) ? formData.value.tags : [],
  }

  // 如果是编辑模式，保留原始数据
  if (!isCreateMode.value) {
    todoData.id = props.editingTodo.id
    todoData.createdAt = props.editingTodo.createdAt
  }

  emit('save', todoData)
}

const handleDelete = () => {
  if (props.editingTodo) {
    emit('delete', props.editingTodo)
  }
}

const handleClose = () => {
  emit('close')
}

// 格式化函数
const formatId = (id) => {
  return id ? `#${id.slice(-8).toUpperCase()}` : ''
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const d = new Date(dateTime)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

const getStatusColor = (status) => {
  return statusConfig.value[status]?.color || 'grey'
}

const getStatusText = (status) => {
  return statusConfig.value[status]?.text || status
}

// 监听变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      initializeForm()
    }
  },
)

watch(
  () => props.editingTodo,
  () => {
    if (props.modelValue) {
      initializeForm()
    }
  },
)

// 生命周期
onMounted(async () => {
  await loadConfigs()
})
</script>

<style lang="scss" scoped>
.todo-edit-modal {
  .v-text-field,
  .v-textarea {
    margin-bottom: 8px;
  }

  .v-text-field,
  .v-select {
    margin-bottom: 8px;
  }
}
</style>
