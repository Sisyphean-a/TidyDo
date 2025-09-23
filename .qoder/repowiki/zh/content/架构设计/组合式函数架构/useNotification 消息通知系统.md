<cite>
**本文档中引用的文件**
- [useNotification.js](file://src/composables/useNotification.js)
- [errorHandler.js](file://src/utils/errorHandler.js)
- [todoService.js](file://src/services/todoService.js)
</cite>

## 目录
1. [简介](#简介)
2. [核心状态结构](#核心状态结构)
3. [消息显示方法](#消息显示方法)
4. [自动隐藏机制](#自动隐藏机制)
5. [错误处理集成](#错误处理集成)
6. [使用场景与示例](#使用场景与示例)

## 简介
`useNotification` 是 TidyDo 应用中的组合式函数，提供了一套统一、响应式的消息通知系统。该系统旨在为用户提供及时、清晰的操作反馈，涵盖成功、错误、警告和信息等多种通知类型。通过集中管理通知状态，该机制确保了应用内消息提示的一致性和可维护性。

**Section sources**
- [useNotification.js](file://src/composables/useNotification.js#L1-L58)

## 核心状态结构
`useNotification` 组合式函数的核心是一个名为 `notification` 的响应式状态对象，它使用 Vue 的 `ref` 创建，确保了状态变化能够自动触发视图更新。该对象包含四个关键属性：

- **visible**: 布尔值，控制通知组件的显示与隐藏。
- **message**: 字符串，存储要向用户展示的具体消息内容。
- **color**: 字符串，定义通知的视觉样式，支持 `success`、`error`、`warning` 和 `info` 四种类型，通常与前端UI框架的配色方案关联。
- **timeout**: 数值，指定通知自动隐藏的延迟时间（毫秒）。

此状态对象是全局共享的，任何调用 `useNotification` 的组件都能访问和修改它，从而实现跨组件的消息通知。

**Section sources**
- [useNotification.js](file://src/composables/useNotification.js#L3-L8)

## 消息显示方法
`useNotification` 提供了多个方法来触发不同类型的通知，其设计遵循了封装与复用的原则。

### 核心方法：`showMessage`
`showMessage(message, color = 'success', timeout = 1000)` 是底层核心方法，负责直接更新 `notification` 状态。它接受三个参数：
- `message`：必填，要显示的消息文本。
- `color`：可选，通知类型，默认为 `'success'`。
- `timeout`：可选，自动隐藏时间，默认为 `1000` 毫秒。

### 别名方法
为了提升代码的可读性和易用性，`useNotification` 定义了一系列别名方法，它们都基于 `showMessage` 进行封装：
- `showSuccess(message, timeout = 1000)`: 用于显示成功提示，自动设置 `color` 为 `'success'`。
- `showError(message, timeout = 1000)`: 用于显示错误提示，自动设置 `color` 为 `'error'`。
- `showWarning(message, timeout = 1000)`: 用于显示警告提示，自动设置 `color` 为 `'warning'`。
- `showInfo(message, timeout = 1000)`: 用于显示信息提示，自动设置 `color` 为 `'info'`。

这些别名方法简化了常见场景下的调用，开发者无需记忆颜色值，代码意图更加明确。

**Section sources**
- [useNotification.js](file://src/composables/useNotification.js#L10-L45)

## 自动隐藏机制
`useNotification` 的自动隐藏功能是其核心特性之一。当调用 `showMessage` 或其别名方法时，不仅会更新 `notification` 对象的 `visible`、`message`、`color` 和 `timeout` 属性，还会利用 `timeout` 的值来安排一个延迟操作。

其工作原理如下：
1.  调用 `showSuccess("操作成功")`。
2.  `notification.value` 被更新为 `{ visible: true, message: "操作成功", color: "success", timeout: 1000 }`。
3.  前端UI组件（如一个Toast组件）监听到 `notification` 的变化，立即显示通知。
4.  系统内部会启动一个计时器（`setTimeout`），其延迟时间等于 `timeout` 的值（1000毫秒）。
5.  计时器到期后，自动调用 `hideMessage()` 方法。
6.  `hideMessage()` 将 `notification.value.visible` 设置为 `false`。
7.  UI组件再次监听到 `visible` 变为 `false`，从而隐藏通知。

这种机制确保了通知不会永久停留在屏幕上，提升了用户体验。

**Section sources**
- [useNotification.js](file://src/composables/useNotification.js#L10-L58)

## 错误处理集成
`useNotification` 与应用的错误处理系统紧密集成，特别是在 `todoService.js` 中得到了实际应用。当数据操作（如保存待办事项）失败时，`withErrorHandling` 高阶函数会捕获异常，并通过 `useNotification` 向用户展示友好的错误信息。

例如，在 `todoService.js` 中，`CategoryService.save` 和 `TodoItemService.save` 方法都使用了 `withErrorHandling`。一旦发生存储错误（`ErrorTypes.STORAGE`），该函数会记录错误日志，并将一个包含用户友好信息的 `AppError` 抛出。上层调用者（如Vue组件）可以捕获此错误，并调用 `useNotification.showError()` 将错误信息呈现给用户。

这种集成方式实现了错误处理的分层：底层负责捕获和包装错误，上层负责展示反馈，保持了代码的清晰和职责分离。

**Section sources**
- [useNotification.js](file://src/composables/useNotification.js#L47-L58)
- [errorHandler.js](file://src/utils/errorHandler.js#L1-L109)
- [todoService.js](file://src/services/todoService.js#L1-L313)

## 使用场景与示例
`useNotification` 适用于各种需要向用户传递即时反馈的场景。

### 基本使用
```javascript
import { useNotification } from '@/composables/useNotification'

const { showSuccess, showError } = useNotification()

// 显示成功通知
showSuccess('待办事项已保存！')

// 显示错误通知
showError('保存失败，请检查网络连接。', 3000) // 自定义超时为3秒
```

### 手动关闭控制
除了自动隐藏，开发者也可以通过 `hideMessage()` 方法手动关闭通知，这在需要用户确认的场景下非常有用。
```javascript
const { showMessage, hideMessage } = useNotification()

// 显示一个需要手动关闭的通知
showMessage('请确认您的操作...', 'warning', 0) // timeout设为0表示不自动隐藏

// 在用户点击“确认”按钮后
function onConfirm() {
  hideMessage() // 手动关闭通知
  // 执行后续操作...
}
```

### 在复杂流程中的集成
在复杂的业务流程中，`useNotification` 可以作为流程状态的可视化反馈。
```javascript
async function handleComplexOperation() {
  try {
    showMessage('正在处理...', 'info', 0) // 显示处理中状态，不自动隐藏
    
    await stepOne()
    await stepTwo()
    await stepThree()
    
    hideMessage() // 隐藏处理中状态
    showSuccess('操作全部完成！') // 显示成功状态
  } catch (error) {
    hideMessage() // 隐藏处理中状态
    showError(`操作失败: ${error.message}`) // 显示错误状态
  }
}
```

**Section sources**
- [useNotification.js](file://src/composables/useNotification.js#L10-L58)