<template>
  <resizable-layout :column-count="columnCount">
    <template #column1>
    </template>

    <template #column2>
    </template>

    <template #column3>
    </template>

    <template #column4>
    </template>
  </resizable-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ResizableLayout from '@/components/ResizableLayout.vue'

const columnCount = ref(4) // 默认4列，可以根据需要调整

</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  font-style: italic;
}
</style>
