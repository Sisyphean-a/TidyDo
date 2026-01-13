# TidyDo 开发核心索引 (AI Optimized)

## 1. 核心架构层级 (Architecture Hierarchy)

- **UI 层 (Vue Components)**: 视图展示、用户交互、Props/Events 通信。
- **组合式函数层 (Composables)**: UI 相关响应式逻辑（弹窗、通知、配置访问）。
- **状态管理层 (Pinia Stores)**: 业务逻辑核心、持久化状态、计算属性。
- **服务层 (Services)**: 纯数据操作 (CRUD)、初始化流程、外部 API/存储交互。
- **工具层 (Utils)**: 无状态纯函数（错误处理、ID 生成）。
- **存储层 (Storage)**: `IndexedDB` (通过 `idb-keyval`)。

## 2. 项目目录结构 (Condensed Tree)

```text
src/
├── services/      # 核心逻辑: app(初始化), config(配置), todo(CRUD), data(备份), report(统计)
├── stores/        # 状态中心: AppStore(全局), Categories(分类), Todos(待办), Report(报表)
├── composables/   # UI 逻辑: useConfig, useDialog, useNotification, useDragSort
├── components/    # 组件: Sidebar, Header, Content, Item, Report(ECharts)
├── model/         # 弹窗组件: CategoryEdit, Config, TodoEdit
├── utils/         # 工具: errorHandler, idGenerator
├── views/         # 页面入口: tidyDo/index.vue
└── main.js/extension.js # 应用入口

```

## 3. 核心模块映射表 (Module Mapping)

| 模块              | 职责 (Responsibility) | 关键方法/状态 (Key APIs/State)                       |
| ----------------- | --------------------- | ---------------------------------------------------- |
| **AppService**    | 初始化时序、并发控制  | `initializeApp()`, `reloadAppData()`                 |
| **ConfigService** | 配置持久化、深度合并  | `getConfig()`, `saveConfig()`                        |
| **TodoService**   | 待办/分类数据操作     | `CategoryService`, `TodoItemService` (CRUD)          |
| **AppStore**      | 全局 UI 状态          | `viewMode`, `selectedCategoryId`, `currentTodos`     |
| **TodosStore**    | 待办业务逻辑          | `loadTodos()`, `updateTodoStatus()`, `todoCounts`    |
| **useConfig**     | 配置响应式代理        | `statusConfig`, `priorityConfig`, `getStatusColor()` |
| **errorHandler**  | 统一异常监控          | `withErrorHandling(fn, title, type)`                 |

## 4. 关键工作流 (Critical Workflows)

### A. 初始化启动 (App Startup)

1. `AppService.initializeApp` 并行触发 -> `ConfigService` + `DefaultData` + `StorageCheck`。
2. 基础数据就绪后 -> 并行执行 `Stores.loadX()` (Categories/Todos/SimpleTodos)。
3. 状态挂载完毕 -> 渲染 Vue 组件。

### B. 异常处理 (Error Handling)

- 使用 `withErrorHandling` 高阶函数封装 Service 层异步操作。
- 自动触发 `useNotification` 提示 UI。
- 错误分类：`STORAGE`, `VALIDATION`, `BUSINESS`, `NETWORK`。

### C. 排序逻辑 (Drag & Sort)

- `useDragSort` 监听长按 (500ms) -> 开启拖拽 -> 实时计算索引 -> 回调 `onReorder` 更新存储。

## 5. 开发规范 (Coding Rules)

- **API**: Vue 3 Composition API。
- **逻辑位置**: 复杂数据转换放 `Services`，UI 响应式状态放 `Composables`，跨组件共享放 `Stores`。
- **ID 策略**: 统一调用 `idGenerator` (前缀 + 时间戳 + 随机数)。
- **配置访问**: 禁止直接读取存储，必须通过 `useConfig` 组合式函数。

## 6. 功能路线图 (Roadmap)

- **已完成**: CRUD、四象限/时间线/报表视图、导入导出、拖拽排序、ECharts 统计。
- **规划中**: 深色模式、i18n、云端同步、提醒系统。
