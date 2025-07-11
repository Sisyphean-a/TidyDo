// 业务逻辑相关的 composables
export { useCategories } from './useCategories'
export { useTodos } from './useTodos'

// UI 状态管理相关的 composables
export { useNotification } from './useNotification'
export { useDialog, useMultipleDialogs } from './useDialog'

/**
 * Composables 使用指南
 * 
 * 业务逻辑 Composables：
 * - useCategories: 分类数据的增删改查和状态管理
 * - useTodos: 待办事项的增删改查和状态管理
 * 
 * UI 状态 Composables：
 * - useNotification: 全局消息通知管理
 * - useDialog: 弹窗状态管理
 * - useMultipleDialogs: 多个弹窗的状态管理
 * 
 * 使用示例：
 * import { useCategories, useTodos, useNotification } from '@/composables'
 */ 