<template>
  <v-toolbar
    flat
    class="border-b"
  >
    <v-toolbar-title class="d-flex align-center">
      <v-icon class="me-2">{{
        appStore.viewAllMode ? 'mdi-view-list' : appStore.selectedCategory?.icon || 'mdi-folder'
      }}</v-icon>
      {{ appStore.viewAllMode ? '全部待办' : appStore.selectedCategory?.name || '请选择分类' }}
      <v-chip
        v-if="appStore.currentTodos.length > 0"
        size="small"
        class="ms-2"
        color="primary"
        variant="tonal"
      >
        {{ appStore.currentTodos.length }}
      </v-chip>
      <v-chip
        v-if="appStore.selectedCategory?.isFilterCategory"
        size="small"
        class="ms-2"
        color="warning"
        variant="tonal"
      >
        筛选类
      </v-chip>
    </v-toolbar-title>

    <v-spacer />

    <!-- 搜索框 -->
    <div class="search-container me-4">
      <v-text-field
        v-model="appStore.searchQuery"
        placeholder="搜索待办事项..."
        density="compact"
        variant="outlined"
        hide-details
        clearable
        class="search-field"
        style="max-height: 36px"
        @update:model-value="appStore.setSearchQuery"
      >
        <template v-slot:prepend-inner>
          <v-icon
            size="small"
            :color="appStore.searchQuery ? 'primary' : 'grey'"
          >
            mdi-magnify
          </v-icon>
        </template>
      </v-text-field>
    </div>

    <!-- 工具按钮 -->
    <v-btn-group
      variant="outlined"
      density="comfortable"
    >
      <v-btn
        v-if="appStore.viewAllMode"
        prepend-icon="mdi-close"
        @click="appStore.exitViewAllMode"
        color="warning"
      >
        退出全部视图
      </v-btn>
      <v-btn
        prepend-icon="mdi-plus"
        @click="$emit('create-todo')"
        :disabled="
          (!appStore.selectedCategory && !appStore.viewAllMode) ||
          appStore.selectedCategory?.isFilterCategory
        "
      >
        新增待办
      </v-btn>
      <v-btn
        @click="todosStore.toggleShowArchived"
        :prepend-icon="todosStore.showArchived ? 'mdi-eye-off' : 'mdi-eye'"
      >
        {{ todosStore.showArchived ? '隐藏归档' : '显示归档' }}
      </v-btn>
      <v-btn
        icon="mdi-refresh"
        @click="todosStore.loadTodos"
        :loading="todosStore.isLoading"
      />
    </v-btn-group>
  </v-toolbar>
</template>

<script setup>
import { useAppStore } from '@/stores/useAppStore'
import { useTodosStore } from '@/stores/useTodosStore'

// 使用store
const appStore = useAppStore()
const todosStore = useTodosStore()

// 只需要保留create-todo事件，其他都可以直接调用store方法
const emit = defineEmits(['create-todo'])
</script>

<style scoped>
.search-container {
  width: 300px;
}

.search-field {
  max-width: 300px;
}

.search-field .v-field__input {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
