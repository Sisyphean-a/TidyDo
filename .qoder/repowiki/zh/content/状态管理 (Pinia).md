# 状态管理 (Pinia)

<cite>
**Referenced Files in This Document**   
- [useAppStore.js](file://src/stores/useAppStore.js)
- [useCategoriesStore.js](file://src/stores/useCategoriesStore.js)
- [useTodosStore.js](file://src/stores/useTodosStore.js)
- [useReportStore.js](file://src/stores/useReportStore.js)
- [appService.js](file://src/services/appService.js)
- [reportService.js](file://src/services/reportService.js)
</cite>

## 目录
1. [引言](#引言)
2. [核心状态管理概览](#核心状态管理概览)
3. [全局UI状态管理 (useAppStore)](#全局ui状态管理-useappstore)
4. [核心数据状态管理](#核心数据状态管理)
   - [分类状态管理 (useCategoriesStore)](#分类状态管理-usecategoriesstore)
   - [待办事项状态管理 (useTodosStore)](#待办事项状态管理-usetodosstore)
5. [报表状态管理 (useReportStore)](#报表状态管理-usereportstore)
6. [计算属性与业务逻辑](#计算属性与业务逻辑)
7. [Actions与服务层交互](#actions与服务层交互)
8. [总结](#总结)

## 引言

TidyDo 应用采用 Pinia 作为其状态管理解决方案，通过多个专门化的 Store 来组织和管理应用的不同方面状态。这种模块化的设计将全局UI状态、核心数据和报表功能清晰地分离，提高了代码的可维护性和可测试性。本文档旨在全面解析 TidyDo 的状态管理架构，详细阐述每个 Pinia Store 的职责、内部状态、计算属性和 Actions，以及它们如何协同工作以提供流畅的用户体验。

## 核心状态管理概览

TidyDo 的状态管理由四个核心的 Pinia Store 构成，它们共同构成了应用的数据中心：

1.  **`useAppStore`**: 管理全局的UI状态和用户交互逻辑，如当前选中的分类、视图模式和搜索查询。
2.  **`useCategoriesStore`**: 管理所有分类（Category）的核心数据，包括普通分类、筛选分类和简单待办分类。
3.  **`useTodosStore`**: 管理所有普通待办事项（Todo）的核心数据，处理待办事项的增删改查和状态变更。
4.  **`useReportStore`**: 专门负责报表数据的获取、缓存和自动刷新，为报表视图提供数据支持。

这些 Store 通过明确的职责划分和相互依赖，构建了一个高效且响应式的状态管理系统。

## 全局UI状态管理 (useAppStore)

`useAppStore` 是整个应用的“控制中心”，它不直接存储核心业务数据，而是管理影响UI展示和用户导航的全局状态。

**Section sources**
- [useAppStore.js](file://src/stores/useAppStore.js#L5-L276)

### 状态 (State)

`useAppStore` 定义了以下响应式状态变量：
- `selectedCategoryId`: 当前选中分类的ID，`null` 表示未选择任何分类。
- `viewAllMode`: 布尔值，表示是否处于“查看全部”模式。
- `viewMode`: 字符串，表示当前的视图模式，可选值为 `'table'`, `'timeline'`, `'calendar'`, `'report'`。
- `sortBy`: 字符串，表示当前的排序字段（如 `'endDate'`）。
- `sortOrder`: 字符串，表示排序顺序（`'asc'` 或 `'desc'`）。
- `searchQuery`: 字符串，存储用户的搜索关键词。

### 计算属性 (Getters)

该 Store 提供了几个关键的计算属性，用于派生出复杂的UI状态：
- `selectedCategory`: 通过 `selectedCategoryId` 和 `useCategoriesStore` 的 `getCategoryById` 方法，返回当前选中的分类对象。
- `currentTodos`: 这是最重要的计算属性之一。它根据 `viewAllMode`、`selectedCategoryId` 和 `searchQuery` 等状态，结合 `useTodosStore` 和 `useCategoriesStore` 的数据，动态计算出当前应该在界面上展示的待办事项列表。它实现了复杂的过滤逻辑，包括分类过滤、筛选条件过滤和全文搜索。
- `tableColumns`: 根据当前视图模式和分类类型，动态生成表格的列配置，确保在不同模式下显示合适的列。

### Actions

`useAppStore` 提供了一系列 Actions 来响应用户操作：
- `selectCategory(category)`: 选择一个分类，会自动退出“查看全部”模式并清空搜索。
- `enterViewAllMode()` / `exitViewAllMode()`: 进入或退出“查看全部”模式。
- `setViewMode(mode)` / `toggleViewMode()`: 设置或循环切换视图模式。
- `setSearchQuery(query)` / `clearSearch()`: 设置或清空搜索查询。
- `toggleSort(field)`: 切换指定字段的排序顺序。
- `resetState()`: 重置所有状态到初始值。

## 核心数据状态管理

### 分类状态管理 (useCategoriesStore)

`useCategoriesStore` 负责管理应用中所有分类的生命周期和数据。

**Section sources**
- [useCategoriesStore.js](file://src/stores/useCategoriesStore.js#L4-L185)

#### 状态 (State)
- `categories`: 一个响应式数组，存储所有分类对象。
- `isLoading`: 布尔值，表示分类数据是否正在加载。

#### 计算属性 (Getters)
该 Store 提供了多种方式来访问和过滤分类数据：
- `allCategories`: 返回所有分类。
- `regularCategories`: 返回所有普通分类。
- `filterCategories`: 返回所有筛选分类。
- `simpleTodoCategories`: 返回所有简单待办分类。
- `categoriesCount`: 返回分类的总数。
- `getCategoryById`: 一个返回函数的计算属性，用于根据ID查找特定分类。

#### Actions
Actions 主要负责与后端服务交互，实现数据的持久化：
- `loadCategories()`: 从 `CategoryService` 加载所有分类数据。
- `createNewCategory(...)`: 创建一个新的分类，并保存到后端。
- `updateCategory(category, updates)`: 更新现有分类的信息。
- `deleteCategory(categoryId)`: 删除指定ID的分类。
- `reorderCategoriesByDrag(...)`: 处理分类的拖拽排序。
- `resetState()`: 重置状态。

### 待办事项状态管理 (useTodosStore)

`useTodosStore` 与 `useCategoriesStore` 类似，但专注于管理普通待办事项。

**Section sources**
- [useTodosStore.js](file://src/stores/useTodosStore.js#L4-L169)

#### 状态 (State)
- `todos`: 一个响应式数组，存储所有待办事项对象。
- `isLoading`: 布尔值，表示待办事项数据是否正在加载。
- `showArchived`: 布尔值，控制是否在列表中显示已归档的待办事项。

#### 计算属性 (Getters)
- `allTodos`: 返回所有待办事项。
- `activeTodos`: 返回所有未归档的待办事项。
- `archivedTodos`: 返回所有已归档的待办事项。
- `totalTodosCount`: 返回未归档待办事项的总数。
- `getTodosByCategoryId`: 一个返回函数的计算属性，用于根据分类ID获取该分类下的待办事项（考虑 `showArchived` 状态）。
- `todoCounts`: 一个对象，键为分类ID，值为该分类下未归档待办事项的数量。

#### Actions
Actions 与 `todoService` 交互，管理待办事项的CRUD操作：
- `loadTodos()`: 从 `TodoItemService` 加载所有待办事项。
- `createTodo(todoData)`: 创建一个新的待办事项。
- `updateTodo(todoData)`: 更新现有待办事项。
- `deleteTodo(todoId)`: 删除指定ID的待办事项。
- `updateTodoStatus(todo, newStatus)`: 更新待办事项的状态。
- `toggleTodoArchived(todo)`: 切换待办事项的归档状态。
- `toggleShowArchived()`: 切换 `showArchived` 状态。

## 报表状态管理 (useReportStore)

`useReportStore` 专门用于处理报表相关的数据和逻辑，确保报表视图能够高效地展示统计信息。

**Section sources**
- [useReportStore.js](file://src/stores/useReportStore.js#L9-L247)
- [reportService.js](file://src/services/reportService.js#L1-L288)

### 状态 (State)
- `isLoading`: 布尔值，表示报表数据是否正在加载。
- `reportData`: 存储从后端获取的综合报表数据。
- `lastUpdated`: 记录数据最后更新的时间戳。
- `trendDays`: 配置趋势分析的天数，默认为30天。
- `autoRefresh`: 布尔值，控制是否开启自动刷新。
- `refreshInterval`: 存储自动刷新的定时器ID。

### 计算属性 (Getters)
该 Store 提供了对报表数据的便捷访问：
- `projectCountStats`, `statusDistributionStats`, `completionStats`, `timeTrendStats`, `priorityDistributionStats`: 分别从 `reportData` 中提取特定的统计信息。
- `hasData`: 检查是否已有报表数据。
- `isDataStale`: 判断数据是否已过期（超过5分钟）。
- `formattedLastUpdated`: 将 `lastUpdated` 时间戳格式化为可读的字符串。

### Actions
Actions 实现了报表数据的获取和管理：
- `loadReportData(options)`: 从 `ReportService` 获取综合报表数据，并更新 `reportData` 和 `lastUpdated`。
- `refreshReportData()`: 重新加载报表数据。
- `startAutoRefresh(intervalMinutes)`: 启动一个定时器，按指定间隔自动刷新报表数据。
- `stopAutoRefresh()`: 停止自动刷新。
- `getSpecificStats(type)`: 获取特定类型的统计数据。
- `clearReportData()`: 清除所有报表数据和定时器。
- `exportReportData(format)`: 将当前报表数据导出为指定格式。

## 计算属性与业务逻辑

TidyDo 的计算属性是实现复杂业务逻辑的关键。它们不直接修改状态，而是基于现有状态和数据，实时计算出新的、派生的状态。

- **`currentTodos` (useAppStore)**: 这个计算属性是整个应用数据流的核心。它整合了来自 `useAppStore` 的UI状态（`viewAllMode`, `selectedCategoryId`, `searchQuery`）和来自 `useCategoriesStore` 与 `useTodosStore` 的核心数据，实现了多层过滤：
  1.  首先根据 `viewAllMode` 决定是显示所有待办还是特定分类下的待办。
  2.  如果是筛选分类，则应用其 `filterConditions` 进行深度过滤（日期范围、状态、标签等）。
  3.  最后，应用 `searchQuery` 进行全文搜索，支持在标题、描述、标签和编号中查找。
  这种设计确保了UI展示的数据始终是最新且符合用户当前上下文的。

- **`todoCounts` (useTodosStore)**: 这个计算属性遍历所有未归档的待办事项，按 `categoryId` 进行分组计数。它为侧边栏的分类列表提供了每个分类下待办事项数量的实时显示。

- **`isDataStale` (useReportStore)**: 这个计算属性通过比较 `lastUpdated` 时间戳和当前时间，判断缓存的报表数据是否已过时。这为 `startAutoRefresh` 提供了决策依据，确保用户看到的是相对新鲜的数据。

## Actions与服务层交互

每个 Store 的 Actions 都通过调用相应的服务层（Service）来与后端进行通信，实现了状态管理与数据持久化的分离。

- **`useCategoriesStore` Actions**: 如 `loadCategories`、`createNewCategory` 等，都调用了 `CategoryService` 的方法。`CategoryService` 负责处理与分类相关的API请求或本地存储操作。
- **`useTodosStore` Actions**: 类似地，`loadTodos`、`createTodo` 等方法调用了 `TodoItemService`。
- **`useReportStore` Actions**: `loadReportData` 和 `getSpecificStats` 等方法调用了 `ReportService`，该服务聚合了来自 `TodoItemService`、`CategoryService` 等的数据，进行统计计算后返回给 Store。

这种模式的优点在于：
1.  **关注点分离**: Store 专注于状态管理，Service 专注于数据获取和业务逻辑。
2.  **可测试性**: 可以独立测试 Store 的逻辑和 Service 的数据处理。
3.  **可复用性**: Service 可以被多个 Store 或组件复用。

## 总结

TidyDo 的 Pinia 状态管理架构设计精良，通过 `useAppStore`、`useCategoriesStore`、`useTodosStore` 和 `useReportStore` 四个 Store 的协同工作，有效地管理了应用的全局UI状态、核心数据和报表功能。计算属性的巧妙运用实现了复杂的过滤和派生逻辑，而 Actions 与服务层的清晰分离则保证了代码的可维护性和可扩展性。这一架构为 TidyDo 提供了一个稳定、高效且易于理解的数据管理基础。