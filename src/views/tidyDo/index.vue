<template>
  <v-app>
    <!-- 侧边栏 -->
    <TodoSidebar
      ref="sidebarRef"
      :selected-category-id="appStore.selectedCategoryId"
      :todo-counts="todosStore.todoCounts"
      @category-select="appStore.selectCategory"
      @category-updated="appStore.handleCategoryUpdated"
      @view-all="appStore.enterViewAllMode"
    />

    <!-- 主内容区域 -->
    <v-main>
      <v-container
        fluid
        class="pa-0 h-100"
      >
        <!-- 头部工具栏 -->
        <TodoHeader @create-todo="handleCreateTodo" />

        <!-- Todo列表内容 -->
        <TodoContent @create-todo="handleCreateTodo" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TodoSidebar from '@/components/TodoSidebar.vue'
import TodoHeader from './components/TodoHeader.vue'
import TodoContent from './components/TodoContent.vue'
import { initializeDefaultData } from '@/services/todoService'

// 使用Pinia stores
import { useTodosStore } from '@/stores/useTodosStore'
import { useCategoriesStore } from '@/stores/useCategoriesStore'
import { useAppStore } from '@/stores/useAppStore'

// Store实例
const todosStore = useTodosStore()
const categoriesStore = useCategoriesStore()
const appStore = useAppStore()

// 响应式数据
const sidebarRef = ref(null)

// 数据加载
const loadData = async () => {
  try {
    await Promise.all([categoriesStore.loadCategories(), todosStore.loadTodos()])
    // 初始化选择状态
    appStore.initializeSelection(categoriesStore.categories)
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

// 处理创建待办 - 为了向上兼容，保留这个方法
const handleCreateTodo = () => {
  // 由于TodoContent组件已经自己处理了，这里可以留空
  // 或者添加一些全局的处理逻辑
}

// 组件挂载
onMounted(async () => {
  await initializeDefaultData()
  await loadData()
})
</script>

<style scoped>
.v-main {
  --v-layout-left: 300px;
}

.h-100 {
  height: 100vh;
}
</style>
