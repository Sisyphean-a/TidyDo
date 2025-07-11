<template>
  <v-navigation-drawer
    v-model="isOpen"
    :rail="isRail"
    :width="drawerWidth"
    :rail-width="railWidth"
    permanent
    class="todo-sidebar border-r border-gray-200"
  >
    <div class="h-full flex flex-col">
      <!-- 侧边栏头部 -->
      <div class="py-2">
        <div class="flex items-center gap-3">
          <v-icon
            size="32"
            color="primary"
          >
            mdi-clipboard-check-multiple
          </v-icon>
          <div
            v-if="!isRail"
            class="leading-tight"
          >
            <h2 class="text-h6 font-bold mb-1">TidyDo</h2>
          </div>
        </div>
      </div>

      <v-divider />

      <!-- 分类列表 -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <div
          v-if="!isRail"
          class="flex items-center justify-between px-4 py-1 bg-gray-50"
        >
          <span class="text-subtitle-2 font-bold">分类</span>
          <v-btn
            icon
            size="x-small"
            variant="text"
            @click="handleCreateCategory"
          >
            <v-icon size="small">mdi-plus</v-icon>
          </v-btn>
        </div>

        <v-list
          v-model:selected="selectedCategories"
          density="compact"
          nav
          class="flex-1 overflow-y-auto"
        >
          <v-list-item
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
            :prepend-icon="category.icon || 'mdi-folder'"
            :title="isRail ? '' : category.name"
            :active="selectedCategoryId === category.id"
            @click="handleCategorySelect(category)"
          >
            <template
              v-if="!isRail"
              #append
            >
              <div class="flex items-center gap-1">
                <v-chip
                  v-if="getCategoryCount(category.id) > 0"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                >
                  {{ getCategoryCount(category.id) }}
                </v-chip>
                <v-chip
                  v-if="category.isFilterCategory"
                  size="x-small"
                  variant="tonal"
                  color="warning"
                  class="ml-1"
                >
                  筛选
                </v-chip>
                <v-menu location="bottom end">
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      icon
                      size="x-small"
                      variant="text"
                      @click.stop
                    >
                      <v-icon size="small">mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      prepend-icon="mdi-pencil"
                      title="编辑"
                      @click="handleEditCategory(category)"
                    />
                    <v-list-item
                      prepend-icon="mdi-delete"
                      title="删除"
                      @click="handleDeleteCategory(category)"
                      :disabled="getCategoryCount(category.id) > 0"
                    />
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- 底部操作 -->
      <div class="mt-auto">
        <v-divider />
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-view-list"
            :title="isRail ? '' : '查看全部'"
            @click="handleViewAll"
            :active="isViewAllMode"
          />
          <v-list-item
            prepend-icon="mdi-cog"
            :title="isRail ? '' : '设置'"
            @click="handleSettings"
          />
          <v-list-item
            prepend-icon="mdi-information"
            :title="isRail ? '' : '关于'"
            @click="handleAbout"
          />
          <v-list-item
            :prepend-icon="isRail ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'"
            :title="isRail ? '' : '收起'"
            @click="toggleRail"
          />
        </v-list>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { TodoBusinessService } from '@/services/todoBusinessService'

const props = defineProps({
  // 分类列表
  categories: {
    type: Array,
    default: () => [],
  },
  // 选中的分类ID
  selectedCategoryId: {
    type: String,
    default: null,
  },
  // 分类待办数量
  categoryCounts: {
    type: Object,
    default: () => ({}),
  },
  // 是否是查看全部模式
  isViewAllMode: {
    type: Boolean,
    default: false,
  },
  // 侧边栏宽度
  drawerWidth: {
    type: Number,
    default: 280,
  },
  // 收起时宽度
  railWidth: {
    type: Number,
    default: 72,
  },
  // 初始是否收起
  initialRail: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'category-select',
  'category-create',
  'category-edit',
  'category-delete',
  'view-all',
  'settings',
  'about',
  'rail-toggle',
])

// 状态
const isOpen = ref(true)
const isRail = ref(props.initialRail)
const selectedCategories = ref([])

// 计算属性
const displayCategories = computed(() => {
  return props.categories.map((category) =>
    TodoBusinessService.formatCategoryForDisplay(category, getCategoryCount(category.id)),
  )
})

// 方法
const getCategoryCount = (categoryId) => {
  return props.categoryCounts[categoryId] || 0
}

const handleCategorySelect = (category) => {
  emit('category-select', category)
}

const handleCreateCategory = () => {
  emit('category-create')
}

const handleEditCategory = (category) => {
  emit('category-edit', category)
}

const handleDeleteCategory = (category) => {
  // 检查是否可以删除
  const canDelete = TodoBusinessService.canDeleteCategory(category, [])
  if (!canDelete.canDelete) {
    // 可以显示错误消息
    return
  }
  emit('category-delete', category)
}

const handleViewAll = () => {
  emit('view-all')
}

const handleSettings = () => {
  emit('settings')
}

const handleAbout = () => {
  emit('about')
}

const toggleRail = () => {
  isRail.value = !isRail.value
  emit('rail-toggle', isRail.value)
}

// 暴露方法
defineExpose({
  toggleRail,
})
</script>
