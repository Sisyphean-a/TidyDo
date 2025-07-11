import { ref } from 'vue'

export function useDialog(initialVisible = false) {
  // 弹窗状态
  const visible = ref(initialVisible)
  const data = ref(null)

  // 显示弹窗
  const show = (dialogData = null) => {
    data.value = dialogData
    visible.value = true
  }

  // 隐藏弹窗
  const hide = () => {
    visible.value = false
    data.value = null
  }

  // 切换弹窗状态
  const toggle = (dialogData = null) => {
    if (visible.value) {
      hide()
    } else {
      show(dialogData)
    }
  }

  return {
    // 状态
    visible,
    data,
    
    // 方法
    show,
    hide,
    toggle,
  }
}

// 创建多个独立的弹窗管理器
export function useMultipleDialogs(dialogNames = []) {
  const dialogs = {}
  
  dialogNames.forEach(name => {
    dialogs[name] = useDialog()
  })
  
  return dialogs
} 