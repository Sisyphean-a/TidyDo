<template>
  <div>
    <v-navigation-drawer
      v-model="isDrawerOpen"
      :rail="isRailMode"
      permanent
      class="todo-sidebar"
      width="280"
      rail-width="72"
    >
      <!-- 侧边栏头部 -->
      <v-list-item class="sidebar-header">
        <template v-slot:prepend>
          <v-icon>mdi-clipboard-check-multiple</v-icon>
        </template>
        <v-list-item-title class="text-h6 font-weight-bold"> TidyDo </v-list-item-title>
      </v-list-item>

      <v-divider></v-divider>

      <!-- 分类列表 -->
      <v-list
        density="compact"
        nav
      >
        <!-- 分类项 -->
        <div
          v-for="category in categories"
          :key="category.id"
        >
          <v-list-item
            :prepend-icon="category.icon"
            :title="category.name"
            :active="selectedCategoryId === category.id"
            @click="handleCategoryClick(category)"
            class="category-item"
          >
            <template
              v-slot:append
              v-if="!isRailMode"
            >
              <div class="category-actions">
                <!-- 折叠/展开按钮 -->
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  @click.stop="toggleCategoryExpanded(category)"
                >
                  <v-icon size="small">
                    {{ category.isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                  </v-icon>
                </v-btn>

                <!-- 分类菜单 -->
                <v-menu location="bottom end">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      v-bind="props"
                      @click.stop
                    >
                      <v-icon size="small">mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      prepend-icon="mdi-pencil"
                      title="编辑"
                      @click="$emit('edit-category', category)"
                    />
                    <v-list-item
                      prepend-icon="mdi-delete"
                      title="删除"
                      @click="$emit('delete-category', category)"
                    />
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>

          <!-- Todo计数显示（折叠状态下） -->
          <v-list-item
            v-if="category.isExpanded && !isRailMode"
            class="todo-count-item"
          >
            <template v-slot:prepend>
              <div class="ms-6"></div>
            </template>
            <v-list-item-subtitle class="text-caption">
              {{ getCategoryTodoCount(category.id) }} 个待办事项
            </v-list-item-subtitle>
          </v-list-item>
        </div>
      </v-list>

      <!-- 底部工具栏 -->
      <template v-slot:append>
        <v-divider></v-divider>
        <v-list density="compact">
          <!-- 新建分类按钮 - 现在在两种模式下都显示 -->
          <v-list-item
            prepend-icon="mdi-plus"
            :title="isRailMode ? '' : '新建分类'"
            @click="$emit('create-category')"
            class="create-category-btn"
          />
          <v-divider
            v-if="!isRailMode"
            class="my-1"
          />
          <v-list-item
            prepend-icon="mdi-chevron-double-left"
            :title="isRailMode ? '' : '收起侧边栏'"
            @click="toggleRailMode"
          >
            <template v-slot:prepend>
              <v-icon>{{
                isRailMode ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'
              }}</v-icon>
            </template>
          </v-list-item>
          <v-list-item
            prepend-icon="mdi-cog"
            :title="isRailMode ? '' : '设置'"
            @click="handleSettingsClick"
          />
          <v-list-item
            prepend-icon="mdi-information"
            :title="isRailMode ? '' : '关于'"
            @click="$emit('show-about')"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- 配置对话框 -->
    <config-dialog
      v-model="isConfigDialogVisible"
      @config-updated="handleConfigUpdated"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import ConfigDialog from './ConfigDialog.vue'

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  selectedCategoryId: {
    type: String,
    default: null,
  },
  todoCounts: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'category-select',
  'category-toggle-expanded',
  'create-category',
  'edit-category',
  'delete-category',
  'show-settings',
  'show-about',
])

const isDrawerOpen = ref(true)
const isRailMode = ref(false)
const isConfigDialogVisible = ref(false)

// 切换轨道模式
const toggleRailMode = () => {
  isRailMode.value = !isRailMode.value
  // 确保drawer始终开启
  isDrawerOpen.value = true
}

// 处理分类点击
const handleCategoryClick = (category) => {
  emit('category-select', category)
}

// 处理配置更新
const handleConfigUpdated = () => {
  // 可以在这里添加配置更新后的处理逻辑
  console.log('配置已更新')
}

// 切换分类展开状态
const toggleCategoryExpanded = (category) => {
  emit('category-toggle-expanded', category.id, !category.isExpanded)
}

// 获取分类下的todo数量
const getCategoryTodoCount = (categoryId) => {
  return props.todoCounts[categoryId] || 0
}

// 修改设置按钮的点击处理
const handleSettingsClick = () => {
  isConfigDialogVisible.value = true
}
</script>

<style lang="scss" scoped>
.todo-sidebar {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.create-category-btn {
  margin: 0 8px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }
}

.category-item {
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background-color: #eff6ff;
  }

  &.v-list-item--active {
    background-color: #dbeafe;
    color: #2563eb;
  }
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.todo-count-item {
  margin-left: 16px;
  padding-left: 16px;
  border-left: 2px solid rgba(0, 0, 0, 0.08);
}

.v-navigation-drawer--rail {
  .category-actions {
    display: none;
  }
}

.rail-create-btn {
  margin: 4px 8px;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }
}
</style>
