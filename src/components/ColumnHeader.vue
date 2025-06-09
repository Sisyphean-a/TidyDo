<template>
  <div
    class="flex justify-center items-center h-9 px-4 border-b border-slate-200/20 bg-slate-50/90 backdrop-blur-sm sticky top-0 z-10 cursor-pointer transition-all duration-300 hover:bg-slate-800/8 hover:border-slate-400/50 active:bg-slate-800/12"
    @click="$emit('toggle')"
  >
    <span
      class="text-base font-medium text-slate-500 transition-all duration-300 hover:text-slate-700 hover:scale-110 select-none"
    >
      {{ isCollapsed ? '⟶' : '⟷' }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  isCollapsed: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['toggle'])
</script>
