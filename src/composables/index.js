// UI 状态管理相关的 composables
export { useNotification } from './useNotification'
export { useDialog, useMultipleDialogs } from './useDialog'

/**
 * Composables 使用指南
 * 
 * 业务逻辑现已统一使用 Pinia Stores：
 * - 分类管理: useCategoriesStore (from '@/stores/useCategoriesStore')
 * - 待办事项管理: useTodosStore (from '@/stores/useTodosStore')
 * 
 * UI 状态 Composables：
 * - useNotification: 全局消息通知管理
 * - useDialog: 弹窗状态管理
 * - useMultipleDialogs: 多个弹窗的状态管理
 * 
 * 使用示例：
 * import { useNotification } from '@/composables'
 * import { useTodosStore, useCategoriesStore } from '@/stores'
 */ 