# TidyDo - Todo工具设计文档

## 概述

TidyDo是一个功能完整的Todo管理工具，采用Vue 3 + Vuetify构建，使用IndexedDB进行本地数据存储。系统设计注重模块化、可扩展性和用户体验。

## 架构设计

### 整体架构

```
┌─────────────────┬───────────────────────────────────┐
│   Sidebar       │            Main Content           │
│   ─────────     │            ─────────────           │
│   - Categories  │   ┌─────────────────────────────┐   │
│   - Collapsible │   │      Toolbar                │   │
│   - Rail Mode   │   ├─────────────────────────────┤   │
│                 │   │      Todo List              │   │
│                 │   │   ┌─────────────────────┐   │   │
│                 │   │   │  TodoItem Component │   │   │
│                 │   │   │  (Reusable Row)     │   │   │
│                 │   │   └─────────────────────┘   │   │
│                 │   └─────────────────────────────┘   │
└─────────────────┴───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Edit Dialog     │
                    │   (Modal)         │
                    └───────────────────┘
```

### 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI组件库**: Vuetify 3
- **状态管理**: Vue 3 响应式系统
- **数据存储**: IndexedDB (通过 idb-keyval)
- **样式**: SCSS + Vuetify主题 + tailwindCss

## 核心组件

### 1. 数据服务层 (`src/services/todoService.js`)

**设计理念**: 分离数据逻辑与界面逻辑，提供统一的数据访问接口。

**主要功能**:
- **CategoryService**: 分类管理 (CRUD操作)
- **TodoItemService**: 待办事项管理 (CRUD操作)
- **数据结构设计**: 面向扩展的数据模型

**扩展性考虑**:
```javascript
// Todo项数据结构 - 预留扩展字段
{
  id, categoryId, title, description, priority, status,
  tags: [],          // 标签系统
  dueDate: null,     // 截止日期
  assignee: null,    // 分配人
  attachments: [],   // 附件系统
  createdAt, updatedAt
}
```

### 2. 侧边栏组件 (`src/components/TodoSidebar.vue`)

**设计特点**:
- **轨道模式**: 支持收缩为图标栏
- **折叠功能**: 分类可独立折叠
- **计数显示**: 实时显示各分类下的待办数量
- **上下文菜单**: 分类编辑、删除操作

**响应式设计**:
- 自适应不同屏幕尺寸
- 移动端友好的交互方式

### 3. Todo行组件 (`src/components/TodoItem.vue`)

**设计理念**: 高度模块化、可复用的列表项组件。

**列扩展性**:
```javascript
// 当前列结构 (易于添加新列)
- 第一列: 编号 (可点击复制)
- 第二列: 标题 (可点击复制)  
- 第三列: 状态 (扩展列)
- 第四列: 操作按钮
// 未来可轻松添加:
// - 截止日期列
// - 分配人列  
// - 标签列
```

**交互设计**:
- 悬停效果增强用户体验
- 一键复制功能提升效率
- 优先级视觉标识 (颜色+图标)

### 4. 编辑弹窗组件 (`src/components/TodoEditDialog.vue`)

**模式设计**:
- **创建模式**: 新建待办事项
- **编辑模式**: 修改现有事项

**表单设计**:
- 基础字段: 标题、描述、优先级、状态
- 高级选项: 可折叠的扩展字段区域
- 表单验证: 实时校验用户输入

**用户体验**:
- 持久化弹窗 (防止误操作关闭)
- 加载状态反馈
- 操作确认机制

### 5. 主页面 (`src/views/tidyDo/index.vue`)

**页面布局**:
- **三栏式布局**: 侧边栏 + 工具栏 + 内容区
- **状态管理**: 集中管理所有组件状态
- **数据流控制**: 统一的数据加载和更新逻辑

## 数据存储设计

### IndexedDB存储策略

```javascript
// 存储键值
TODO_CATEGORIES_KEY = 'todo-categories'  // 分类数据
TODO_ITEMS_KEY = 'todo-items'            // 待办数据

// 数据关系
Category 1:N TodoItem (一个分类包含多个待办)
```

### 数据同步机制

- **实时更新**: 操作后立即同步到IndexedDB
- **状态同步**: 界面状态与数据状态保持一致
- **错误处理**: 完善的错误捕获和用户反馈

## 设计模式

### 1. 组件通信模式

```
Parent Component (index.vue)
├── TodoSidebar (props down, events up)
├── TodoItem (props down, events up)  
└── TodoEditDialog (v-model, events up)
```

### 2. 状态管理模式

使用Vue 3的响应式系统而非Vuex/Pinia，适合中小型应用:

```javascript
// 集中式状态
const categories = ref([])     // 分类列表
const todos = ref([])          // 待办列表  
const selectedCategoryId = ref(null)  // 当前选中分类

// 计算属性实现派生状态
const currentTodos = computed(() => { ... })
const todoCounts = computed(() => { ... })
```

### 3. 错误处理模式

```javascript
// 统一错误处理
try {
  await operation()
  showMessage('操作成功', 'success')
} catch (error) {
  showMessage('操作失败', 'error')
  console.error(error)
}
```

## 扩展指南

### 添加新列

1. 在`TodoItem.vue`中添加新列的HTML结构
2. 在表头中添加对应的列标题
3. 调整列宽比例 (cols属性)

### 添加新字段

1. 在`todoService.js`中更新数据结构
2. 在`TodoEditDialog.vue`中添加表单字段
3. 更新验证规则和保存逻辑

### 添加新功能模块

1. 创建新的服务类 (仿照CategoryService)
2. 创建对应的组件
3. 在主页面中集成新组件

## 性能优化

### 渲染优化

- **虚拟滚动**: 大量数据时考虑使用虚拟滚动
- **计算属性缓存**: 利用Vue的计算属性缓存机制
- **组件懒加载**: 大型组件采用动态导入

### 数据优化

- **批量操作**: 避免频繁的单个数据库操作
- **分页加载**: 大数据集采用分页策略
- **索引优化**: IndexedDB查询优化

## 主题和样式

### Vuetify主题定制

```scss
// 支持主题切换
.v-theme--light { ... }
.v-theme--dark { ... }

// 自定义样式变量
:root {
  --sidebar-width: 280px;
  --rail-width: 72px;
}
```

### 响应式断点

- **移动端**: < 960px (自动收缩侧边栏)
- **平板**: 960px - 1264px  
- **桌面**: > 1264px

## 用户体验设计

### 交互反馈

- **即时反馈**: 操作后立即显示结果
- **加载状态**: 长时间操作显示loading
- **错误提示**: 友好的错误信息展示

### 无障碍设计

- **键盘导航**: 支持Tab键导航
- **语义化HTML**: 正确使用语义标签
- **对比度**: 符合WCAG标准的颜色对比度

## 数据迁移和备份

### 导出功能 (未来扩展)

```javascript
// 数据导出
const exportData = async () => {
  const categories = await CategoryService.getAll()
  const todos = await TodoItemService.getAll()
  return { categories, todos, version: '1.0' }
}
```

### 导入功能 (未来扩展)

```javascript
// 数据导入
const importData = async (data) => {
  // 验证数据格式
  // 清空现有数据
  // 导入新数据
}
```

## 配置系统优化 (v1.1)

### 新增功能

1. **配置管理系统** (`src/services/configService.js`)
   - 统一管理状态文本、优先级、字段显示等配置
   - 支持动态更新和持久化存储 (IndexedDB)
   - 提供默认配置和合并机制

2. **配置管理界面** (`src/components/ConfigDialog.vue`)
   - 分类管理: 状态/优先级/字段/系统设置
   - 实时预览编辑效果
   - 支持重置为默认配置

3. **字段优化**
   - 将`dueDate`改为`endDate`并设为必填
   - 兼容旧数据: 自动映射旧字段

### 技术实现

- **数据结构**: 分层配置设计 (状态/优先级/字段/系统)
- **存储方式**: IndexedDB (`app-config`键)
- **动态加载**: 组件挂载时自动获取最新配置
- **错误处理**: 完善的错误捕获和日志

### 扩展性提升

- 所有显示文本可配置化
- 字段必填状态可配置
- 系统主题/语言等设置可扩展

## 总结

TidyDo采用现代前端架构，注重代码组织、用户体验和可扩展性。通过模块化设计和清晰的数据流，为后续功能扩展提供了良好的基础。

**核心优势**:
- 🎯 **模块化设计**: 组件职责清晰，易于维护
- 🔧 **高扩展性**: 数据结构和组件都支持轻松扩展  
- 💡 **用户友好**: 直观的界面和流畅的交互
- 📱 **响应式**: 适配各种设备和屏幕尺寸
- 🚀 **性能优化**: 合理的状态管理和渲染策略 