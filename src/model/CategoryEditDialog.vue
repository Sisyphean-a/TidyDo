<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ isEdit ? '编辑分类' : '新建分类' }}
      </v-card-title>

      <v-card-text>
        <v-container>
          <!-- 基本信息 -->
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="分类名称"
                :rules="[v => !!v || '分类名称不能为空']"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-select
                v-model="formData.icon"
                label="分类图标"
                :items="iconOptions"
                :prepend-inner-icon="formData.icon"
                variant="outlined"
                density="compact"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon :icon="item.value" />
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
          </v-row>

          <!-- 分类类型设置 -->
          <v-row>
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2">分类类型</div>
              <v-radio-group
                v-model="categoryType"
                density="compact"
                hide-details
              >
                <v-radio
                  value="regular"
                  label="普通分类"
                  color="primary"
                />
                <div class="text-caption text-grey ms-8 mb-2">
                  标准的待办事项分类，支持完整的功能
                </div>

                <v-radio
                  value="filter"
                  label="筛选类"
                  color="primary"
                />
                <div class="text-caption text-grey ms-8 mb-2">
                  筛选类用于显示符合特定条件的待办事项，不能手动添加新的待办
                </div>

                <v-radio
                  value="simple"
                  label="简单Todo"
                  color="primary"
                />
                <div class="text-caption text-grey ms-8">
                  轻量级的四象限待办管理，只包含标题和状态
                </div>
              </v-radio-group>
            </v-col>
          </v-row>

          <!-- 筛选条件（仅在筛选类时显示） -->
          <v-expand-transition>
            <div v-if="categoryType === 'filter'">
              <v-divider class="my-4" />
              
              <div class="text-subtitle-2 mb-3">筛选条件</div>

              <!-- 截止日期范围 -->
              <div class="text-body-2 mb-2 text-medium-emphasis">截止日期范围</div>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.filterConditions.endDateFrom"
                    label="开始日期"
                    type="date"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.filterConditions.endDateTo"
                    label="结束日期"
                    type="date"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
              </v-row>

              <!-- 节点日期范围 -->
              <div class="text-body-2 mb-2 mt-3 text-medium-emphasis">节点日期范围</div>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.filterConditions.milestoneDateFrom"
                    label="开始日期"
                    type="date"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.filterConditions.milestoneDateTo"
                    label="结束日期"
                    type="date"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
              </v-row>

              <!-- 状态多选 -->
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="formData.filterConditions.statuses"
                    label="状态"
                    :items="statusOptions"
                    multiple
                    chips
                    closable-chips
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
              </v-row>

              <!-- 分类多选 -->
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="formData.filterConditions.categories"
                    label="分类"
                    :items="categoryOptions"
                    item-title="name"
                    item-value="id"
                    multiple
                    chips
                    closable-chips
                    variant="outlined"
                    density="compact"
                  >
                    <template v-slot:chip="{ props, item }">
                      <v-chip
                        v-bind="props"
                        :prepend-icon="item.raw.icon"
                      >
                        {{ item.raw.name }}
                      </v-chip>
                    </template>
                  </v-select>
                </v-col>
              </v-row>

              <!-- 标签多选 -->
              <v-row>
                <v-col cols="12">
                  <v-combobox
                    v-model="formData.filterConditions.tags"
                    label="标签"
                    :items="tagOptions"
                    multiple
                    chips
                    closable-chips
                    variant="outlined"
                    density="compact"
                    hint="输入标签名称，按 Enter 添加"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </div>
          </v-expand-transition>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleCancel"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleSave"
          :loading="saving"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { CategoryService, TodoItemService } from '@/services/todoService'
import { ConfigService } from '@/services/configService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  category: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 是否为编辑模式
const isEdit = computed(() => !!props.category)

// 表单数据
const formData = ref({
  name: '',
  icon: 'mdi-folder',
  isFilterCategory: false,
  isSimpleTodo: false,
  filterConditions: {
    endDateFrom: null,
    endDateTo: null,
    milestoneDateFrom: null,
    milestoneDateTo: null,
    statuses: [],
    categories: [],
    tags: [],
  },
})

// 分类类型计算属性
const categoryType = computed({
  get() {
    if (formData.value.isSimpleTodo) return 'simple'
    if (formData.value.isFilterCategory) return 'filter'
    return 'regular'
  },
  set(value) {
    formData.value.isFilterCategory = value === 'filter'
    formData.value.isSimpleTodo = value === 'simple'

    // 根据类型设置默认图标
    if (value === 'filter' && formData.value.icon === 'mdi-folder') {
      formData.value.icon = 'mdi-filter'
    } else if (value === 'simple' && formData.value.icon === 'mdi-folder') {
      formData.value.icon = 'mdi-view-grid'
    } else if (value === 'regular' && (formData.value.icon === 'mdi-filter' || formData.value.icon === 'mdi-view-grid')) {
      formData.value.icon = 'mdi-folder'
    }
  }
})

// 保存状态
const saving = ref(false)

// 图标选项
const iconOptions = ref([
  { title: '文件夹', value: 'mdi-folder' },
  { title: '文件夹（轮廓）', value: 'mdi-folder-outline' },
  { title: '星标', value: 'mdi-star' },
  { title: '标签', value: 'mdi-label' },
  { title: '日历', value: 'mdi-calendar' },
  { title: '时钟', value: 'mdi-clock' },
  { title: '清单', value: 'mdi-format-list-checks' },
  { title: '工作', value: 'mdi-briefcase' },
  { title: '家庭', value: 'mdi-home' },
  { title: '购物', value: 'mdi-cart' },
  { title: '学习', value: 'mdi-school' },
  { title: '健康', value: 'mdi-heart' },
  { title: '旅行', value: 'mdi-airplane' },
  { title: '财务', value: 'mdi-currency-usd' },
  { title: '项目', value: 'mdi-rocket' },
  { title: '想法', value: 'mdi-lightbulb' },
  { title: '紧急', value: 'mdi-alert' },
  { title: '重要', value: 'mdi-alert-circle' },
  { title: '筛选', value: 'mdi-filter' },
  { title: '四象限', value: 'mdi-view-grid' },
])

// 状态选项
const statusOptions = ref([])

// 分类选项（排除筛选类）
const categoryOptions = computed(() => {
  return props.categories.filter(cat => !cat.isFilterCategory)
})

// 标签选项（从所有待办中提取）
const tagOptions = ref([])

// 监听对话框打开
watch(dialogVisible, async (newVal) => {
  if (newVal) {
    await loadStatusConfig()
    await loadTags()
    
    if (props.category) {
      // 编辑模式，填充数据
      formData.value = {
        name: props.category.name,
        icon: props.category.icon || 'mdi-folder',
        isFilterCategory: props.category.isFilterCategory || false,
        isSimpleTodo: props.category.isSimpleTodo || false,
        filterConditions: props.category.filterConditions || {
          endDateFrom: null,
          endDateTo: null,
          milestoneDateFrom: null,
          milestoneDateTo: null,
          statuses: [],
          categories: [],
          tags: [],
        },
      }
    } else {
      // 新建模式，重置数据
      formData.value = {
        name: '',
        icon: 'mdi-folder',
        isFilterCategory: false,
        isSimpleTodo: false,
        filterConditions: {
          endDateFrom: null,
          endDateTo: null,
          milestoneDateFrom: null,
          milestoneDateTo: null,
          statuses: [],
          categories: [],
          tags: [],
        },
      }
    }
  }
})

// 加载状态配置
const loadStatusConfig = async () => {
  try {
    const config = await ConfigService.getStatusConfig()
    statusOptions.value = Object.entries(config).map(([key, value]) => ({
      title: value.text,
      value: key,
    }))
  } catch (error) {
    console.error('加载状态配置失败：', error)
  }
}

// 加载标签
const loadTags = async () => {
  try {
    const todos = await TodoItemService.getAll()
    const allTags = new Set()
    todos.forEach(todo => {
      if (todo.tags && Array.isArray(todo.tags)) {
        todo.tags.forEach(tag => allTags.add(tag))
      }
    })
    tagOptions.value = Array.from(allTags)
  } catch (error) {
    console.error('加载标签失败：', error)
  }
}

// 根据分类类型获取图标
const getIconForCategoryType = () => {
  if (formData.value.isSimpleTodo && formData.value.icon === 'mdi-folder') {
    return 'mdi-view-grid'
  } else if (formData.value.isFilterCategory && formData.value.icon === 'mdi-folder') {
    return 'mdi-filter'
  }
  return formData.value.icon
}

// 处理保存
const handleSave = async () => {
  if (!formData.value.name) {
    return
  }

  saving.value = true
  try {
    // 深度复制并确保数据可序列化
    const categoryData = {
      name: formData.value.name,
      icon: getIconForCategoryType(),
      isFilterCategory: formData.value.isFilterCategory,
      isSimpleTodo: formData.value.isSimpleTodo,
      filterConditions: formData.value.isFilterCategory ? {
        endDateFrom: formData.value.filterConditions.endDateFrom || null,
        endDateTo: formData.value.filterConditions.endDateTo || null,
        milestoneDateFrom: formData.value.filterConditions.milestoneDateFrom || null,
        milestoneDateTo: formData.value.filterConditions.milestoneDateTo || null,
        statuses: [...(formData.value.filterConditions.statuses || [])],
        categories: [...(formData.value.filterConditions.categories || [])],
        tags: [...(formData.value.filterConditions.tags || [])],
      } : {
        endDateFrom: null,
        endDateTo: null,
        milestoneDateFrom: null,
        milestoneDateTo: null,
        statuses: [],
        categories: [],
        tags: [],
      }
    }

    emit('save', categoryData)
    dialogVisible.value = false
  } finally {
    saving.value = false
  }
}

// 处理取消
const handleCancel = () => {
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.v-card {
  .v-card-text {
    max-height: 600px;
    overflow-y: auto;
  }
}
</style>