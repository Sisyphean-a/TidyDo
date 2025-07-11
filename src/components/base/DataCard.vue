<template>
  <v-card
    :class="[
      'relative transition-all duration-200',
      customClass,
      {
        'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg': clickable,
        'border-2 border-primary bg-blue-50': selected,
      },
    ]"
    :elevation="elevation"
    @click="handleClick"
  >
    <!-- 卡片头部 -->
    <v-card-title
      v-if="showTitle"
      class="px-4 py-3 border-b border-gray-200 bg-gray-50"
    >
      <slot name="title">
        {{ title }}
      </slot>
      <v-spacer />
      <slot name="actions">
        <v-btn
          v-if="showMenu"
          icon
          size="small"
          variant="text"
          @click.stop="toggleMenu"
        >
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </slot>
    </v-card-title>

    <!-- 卡片内容 -->
    <v-card-text class="p-4">
      <slot />
    </v-card-text>

    <!-- 卡片底部 -->
    <v-card-actions
      v-if="showActions"
      class="px-4 py-2 border-t border-gray-200 bg-gray-50"
    >
      <slot name="card-actions" />
    </v-card-actions>

    <!-- 选择覆盖层 -->
    <div
      v-if="selectable"
      class="absolute top-2 right-2 z-10 bg-white/90 rounded p-1"
      @click.stop="handleSelect"
    >
      <v-checkbox
        :model-value="selected"
        density="compact"
        hide-details
        @click.stop
      />
    </div>

    <!-- 菜单 -->
    <v-menu
      v-if="showMenu"
      v-model="menuVisible"
      :activator="menuActivator"
      location="bottom end"
    >
      <v-list density="compact">
        <slot name="menu-items" />
      </v-list>
    </v-menu>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  // 标题
  title: {
    type: String,
    default: '',
  },
  // 是否显示标题
  showTitle: {
    type: Boolean,
    default: true,
  },
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: false,
  },
  // 是否显示菜单
  showMenu: {
    type: Boolean,
    default: false,
  },
  // 是否可选择
  selectable: {
    type: Boolean,
    default: false,
  },
  // 是否选中
  selected: {
    type: Boolean,
    default: false,
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: false,
  },
  // 阴影
  elevation: {
    type: [Number, String],
    default: 2,
  },
  // 自定义类名
  customClass: {
    type: String,
    default: '',
  },
  // 数据项
  item: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['click', 'select', 'menu-toggle'])

const menuVisible = ref(false)
const menuActivator = ref(null)

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.item)
  }
}

const handleSelect = () => {
  if (props.selectable) {
    emit('select', props.item)
  }
}

const toggleMenu = (event) => {
  menuActivator.value = event.target
  menuVisible.value = !menuVisible.value
  emit('menu-toggle', menuVisible.value)
}
</script>
