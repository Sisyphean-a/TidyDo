<template>
  <v-toolbar
    flat
    class="border-b"
  >
    <v-toolbar-title class="d-flex align-center">
      <v-icon class="me-2">{{
        viewAllMode ? 'mdi-view-list' : selectedCategory?.icon || 'mdi-folder'
      }}</v-icon>
      {{ viewAllMode ? '全部待办' : selectedCategory?.name || '请选择分类' }}
      <v-chip
        v-if="currentTodosCount > 0"
        size="small"
        class="ms-2"
        color="primary"
        variant="tonal"
      >
        {{ currentTodosCount }}
      </v-chip>
      <v-chip
        v-if="selectedCategory?.isFilterCategory"
        size="small"
        class="ms-2"
        color="warning"
        variant="tonal"
      >
        筛选类
      </v-chip>
    </v-toolbar-title>

    <v-spacer />

    <!-- 工具按钮 -->
    <v-btn-group
      variant="outlined"
      density="comfortable"
    >
      <v-btn
        v-if="viewAllMode"
        prepend-icon="mdi-close"
        @click="$emit('exit-view-all')"
        color="warning"
      >
        退出全部视图
      </v-btn>
      <v-btn
        prepend-icon="mdi-plus"
        @click="$emit('create-todo')"
        :disabled="(!selectedCategory && !viewAllMode) || selectedCategory?.isFilterCategory"
      >
        新增待办
      </v-btn>
      <v-btn
        @click="$emit('toggle-archived')"
        :prepend-icon="showArchived ? 'mdi-eye-off' : 'mdi-eye'"
      >
        {{ showArchived ? '隐藏归档' : '显示归档' }}
      </v-btn>
      <v-btn
        icon="mdi-refresh"
        @click="$emit('refresh')"
        :loading="todosLoading"
      />
    </v-btn-group>
  </v-toolbar>
</template>

<script setup>
const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null,
  },
  viewAllMode: {
    type: Boolean,
    default: false,
  },
  currentTodosCount: {
    type: Number,
    default: 0,
  },
  showArchived: {
    type: Boolean,
    default: false,
  },
  todosLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['create-todo', 'toggle-archived', 'refresh', 'exit-view-all'])
</script>

<style lang="scss" scoped>
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.v-toolbar {
  background: white !important;
}
</style>
