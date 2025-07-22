/**
 * 拖拽排序组合式函数
 * 提供分类拖拽排序的核心逻辑和状态管理
 * 
 * @author TidyDo Team
 * @since v2.1.0
 */

import { ref } from 'vue'
import { withErrorHandling, ErrorTypes } from '@/utils/errorHandler'

/**
 * 拖拽配置常量
 */
const DRAG_CONFIG = {
  LONG_PRESS_DURATION: 500, // 长按时间（毫秒）
  DRAG_THRESHOLD: 10,       // 拖拽阈值（像素）
  DROP_LINE_HEIGHT: 2,      // 拖拽线高度（像素）
}

/**
 * 拖拽排序组合式函数
 * @param {Object} options - 配置选项
 * @param {Function} options.onReorder - 排序回调函数
 * @param {Function} options.onMessage - 消息提示回调函数
 * @returns {Object} 拖拽相关的状态和方法
 */
export function useDragSort(options = {}) {
  const { onReorder, onMessage } = options

  // ==================== 状态管理 ====================
  
  /**
   * 拖拽状态
   * @type {import('vue').Ref<Object>}
   */
  const dragState = ref({
    isDragging: false,           // 是否正在拖拽
    draggedCategoryId: null,     // 被拖拽的分类ID
    dropLinePosition: null,      // 拖拽线位置 { top: number, visible: boolean }
    targetIndex: null,           // 目标插入索引
    longPressTimer: null,        // 长按计时器
    startPosition: { x: 0, y: 0 }, // 拖拽起始位置
  })

  // ==================== 核心方法 ====================

  /**
   * 开始长按检测
   * @param {Object} category - 分类对象
   * @param {Event} event - 事件对象
   */
  const startLongPress = (category, event) => {
    if (dragState.value.isDragging) return

    const clientX = event.clientX || (event.touches && event.touches[0].clientX)
    const clientY = event.clientY || (event.touches && event.touches[0].clientY)
    
    dragState.value.startPosition = { x: clientX, y: clientY }
    
    dragState.value.longPressTimer = setTimeout(() => {
      _startDrag(category, event)
    }, DRAG_CONFIG.LONG_PRESS_DURATION)
  }

  /**
   * 取消长按检测
   */
  const cancelLongPress = () => {
    if (dragState.value.longPressTimer) {
      clearTimeout(dragState.value.longPressTimer)
      dragState.value.longPressTimer = null
    }
  }

  /**
   * 处理拖拽移动
   * @param {Event} event - 事件对象
   */
  const handleDragMove = (event) => {
    if (!dragState.value.isDragging) return
    
    event.preventDefault()
    
    const clientY = event.clientY || (event.touches && event.touches[0].clientY)
    _updateDropLine(clientY)
  }

  /**
   * 结束拖拽
   */
  const endDrag = withErrorHandling(async () => {
    if (!dragState.value.isDragging) return

    const { draggedCategoryId, targetIndex } = dragState.value

    // 移除全局事件监听器
    _removeGlobalListeners()

    // 执行排序操作
    if (draggedCategoryId && targetIndex !== null) {
      try {
        await onReorder?.(draggedCategoryId, targetIndex)
        onMessage?.('分类排序已更新', 'success')
      } catch (error) {
        onMessage?.('排序失败，请重试', 'error')
        throw error
      }
    }

    // 重置状态
    _resetDragState()
  }, '拖拽排序', ErrorTypes.BUSINESS)

  // ==================== 私有方法 ====================

  /**
   * 启动拖拽模式
   * @private
   * @param {Object} category - 分类对象
   * @param {Event} event - 事件对象
   */
  const _startDrag = (category, event) => {
    dragState.value.isDragging = true
    dragState.value.draggedCategoryId = category.id

    // 添加全局事件监听器
    _addGlobalListeners()

    // 阻止默认行为
    event.preventDefault()
    
    onMessage?.('拖拽模式已启动，拖动到目标位置后松开', 'info')
  }

  /**
   * 更新拖拽线位置
   * @private
   * @param {number} clientY - 鼠标Y坐标
   */
  const _updateDropLine = (clientY) => {
    const categoryElements = document.querySelectorAll('.category-wrapper')
    let targetIndex = null
    let dropLineTop = null

    for (let i = 0; i < categoryElements.length; i++) {
      const element = categoryElements[i]
      const rect = element.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2

      if (clientY <= centerY) {
        // 插入到当前元素之前
        targetIndex = i
        dropLineTop = rect.top
        break
      } else if (i === categoryElements.length - 1) {
        // 插入到最后一个元素之后
        targetIndex = i + 1
        dropLineTop = rect.bottom
        break
      }
    }

    // 更新状态
    dragState.value.targetIndex = targetIndex
    dragState.value.dropLinePosition = targetIndex !== null ? {
      top: dropLineTop,
      visible: true
    } : { top: 0, visible: false }
  }

  /**
   * 添加全局事件监听器
   * @private
   */
  const _addGlobalListeners = () => {
    document.addEventListener('mousemove', handleDragMove, { passive: false })
    document.addEventListener('mouseup', endDrag)
    document.addEventListener('touchmove', handleDragMove, { passive: false })
    document.addEventListener('touchend', endDrag)
  }

  /**
   * 移除全局事件监听器
   * @private
   */
  const _removeGlobalListeners = () => {
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', endDrag)
    document.removeEventListener('touchmove', handleDragMove)
    document.removeEventListener('touchend', endDrag)
  }

  /**
   * 重置拖拽状态
   * @private
   */
  const _resetDragState = () => {
    dragState.value = {
      isDragging: false,
      draggedCategoryId: null,
      dropLinePosition: null,
      targetIndex: null,
      longPressTimer: null,
      startPosition: { x: 0, y: 0 },
    }
  }

  // ==================== 清理函数 ====================

  /**
   * 组件卸载时的清理函数
   */
  const cleanup = () => {
    cancelLongPress()
    if (dragState.value.isDragging) {
      _removeGlobalListeners()
      _resetDragState()
    }
  }

  // ==================== 返回接口 ====================

  return {
    // 状态
    dragState,
    
    // 方法
    startLongPress,
    cancelLongPress,
    endDrag,
    cleanup,
    
    // 配置
    DRAG_CONFIG,
  }
}
