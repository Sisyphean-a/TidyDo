import { ref } from 'vue'

// 全局通知状态
const notification = ref({
  visible: false,
  message: '',
  color: 'success',
  timeout: 1000,
})

export function useNotification() {
  // 显示消息
  const showMessage = (message, color = 'success', timeout = 1000) => {
    notification.value = {
      visible: true,
      message,
      color,
      timeout,
    }
  }

  // 显示成功消息
  const showSuccess = (message, timeout = 1000) => {
    showMessage(message, 'success', timeout)
  }

  // 显示错误消息
  const showError = (message, timeout = 1000) => {
    showMessage(message, 'error', timeout)
  }

  // 显示警告消息
  const showWarning = (message, timeout = 1000) => {
    showMessage(message, 'warning', timeout)
  }

  // 显示信息消息
  const showInfo = (message, timeout = 1000) => {
    showMessage(message, 'info', timeout)
  }

  // 隐藏消息
  const hideMessage = () => {
    notification.value.visible = false
  }

  return {
    // 状态
    notification,
    
    // 方法
    showMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideMessage,
  }
} 