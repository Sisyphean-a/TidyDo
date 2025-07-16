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
        <TodoHeader />

        <!-- Todo列表内容 -->
        <TodoContent ref="todoContentRef" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TodoSidebar from '@/components/TodoSidebar.vue'
import TodoHeader from './components/TodoHeader.vue'
import TodoContent from './components/TodoContent.vue'
import { useAppLifecycle } from '@/services/appService'

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
const todoContentRef = ref(null)

// 使用应用生命周期钩子
const { getStatus } = useAppLifecycle()

// 组件挂载
onMounted(async () => {
  // 等待应用初始化完成
  const status = getStatus()
  if (!status.isInitialized && !status.isInitializing) {
    console.warn('应用尚未初始化完成，请检查入口文件的初始化流程')
  }
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
