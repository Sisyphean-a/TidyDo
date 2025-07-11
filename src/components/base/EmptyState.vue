<template>
  <div class="empty-state">
    <div class="empty-content">
      <!-- 图标 -->
      <div class="empty-icon">
        <v-icon
          :icon="icon"
          :size="iconSize"
          :color="iconColor"
        />
      </div>
      
      <!-- 标题 -->
      <h3 class="empty-title">{{ title }}</h3>
      
      <!-- 描述 -->
      <p
        v-if="description"
        class="empty-description"
      >
        {{ description }}
      </p>
      
      <!-- 自定义内容 -->
      <div
        v-if="$slots.default"
        class="empty-custom"
      >
        <slot />
      </div>
      
      <!-- 操作按钮 -->
      <div
        v-if="showAction"
        class="empty-actions"
      >
        <v-btn
          v-if="actionText"
          :color="actionColor"
          :variant="actionVariant"
          :prepend-icon="actionIcon"
          @click="handleAction"
        >
          {{ actionText }}
        </v-btn>
        
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  // 图标
  icon: {
    type: String,
    default: 'mdi-folder-open-outline',
  },
  // 图标大小
  iconSize: {
    type: [String, Number],
    default: 64,
  },
  // 图标颜色
  iconColor: {
    type: String,
    default: 'grey-lighten-2',
  },
  // 标题
  title: {
    type: String,
    default: '暂无数据',
  },
  // 描述
  description: {
    type: String,
    default: '',
  },
  // 是否显示操作按钮
  showAction: {
    type: Boolean,
    default: false,
  },
  // 操作按钮文字
  actionText: {
    type: String,
    default: '',
  },
  // 操作按钮颜色
  actionColor: {
    type: String,
    default: 'primary',
  },
  // 操作按钮样式
  actionVariant: {
    type: String,
    default: 'outlined',
  },
  // 操作按钮图标
  actionIcon: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['action'])

const handleAction = () => {
  emit('action')
}
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 40px 20px;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 0.875rem;
  color: #999;
  line-height: 1.5;
  margin-bottom: 16px;
}

.empty-custom {
  margin-bottom: 16px;
}

.empty-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
</style> 