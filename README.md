# TidyDo

> 一个现代化的待办事项管理应用，采用优雅的分层架构设计，支持分类管理、智能筛选、标签系统等丰富功能。

## 🚀 项目概述

TidyDo 是一个基于 Vue 3 + Vuetify 构建的高质量待办事项管理应用，经过全面的架构优化，具有简洁优雅的代码结构和强大的功能特性。支持 Web 应用、Chrome 扩展等多种部署方式。

### ✨ 核心特性

- **📂 分类管理** - 支持创建、编辑、删除分类，长按拖拽排序（横线指示插入位置）
- **🔍 智能筛选** - 支持按状态、日期、分类、标签等多维度筛选
- **🏷️ 标签系统** - 为待办事项添加标签，便于分类和检索
- **📅 多时间维度** - 支持创建日期、节点日期、截止日期、更新日期四个时间维度管理
- **📊 状态管理** - 待办/进行中/完成/取消等状态切换
- **🗂️ 归档功能** - 支持归档已完成的待办事项
- **🎯 简单Todo** - 轻量级四象限待办管理，支持拖拽状态切换和内联编辑
- **🔄 数据同步** - 基于 IndexedDB 的本地数据持久化
- **💾 自主备份** - 应用启动时自动检查并执行每日备份，保护数据安全
- **📱 响应式设计** - 完美适配桌面和移动设备
- **🎨 现代化UI** - 基于 Material Design 设计语言
- **⚡ 高性能** - 优化的初始化流程和缓存机制

### 🛠️ 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 组件库**: Vuetify 3
- **状态管理**: Pinia + Vue 3 响应式系统
- **路由**: Vue Router 4
- **样式**: SCSS + Vuetify + Tailwind CSS
- **图标**: Material Design Icons
- **拖拽功能**: VueDraggablePlus (基于Sortable.js)
- **数据存储**: IndexedDB (idb-keyval)
- **构建工具**: Vite
- **开发语言**: JavaScript (JSDoc 类型注释)
- **代码质量**: ESLint + 统一错误处理

## 📚 文档导航

- **[📖 开发者文档](DEVELOPMENT.md)** - 系统架构、开发指南和技术细节
- **[📝 更新日志](CHANGELOG.md)** - 版本更新记录和功能变更历史

## 📋 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0 或 **yarn** >= 1.22.0
- **现代浏览器** 支持 ES2020+ 和 IndexedDB

## ⚡ 快速开始

```bash
# 1. 克隆项目
git clone [repository-url]
cd TidyDo

# 2. 安装依赖
npm install
# 或使用 yarn
yarn install

# 3. 启动开发服务器
npm run dev
# 访问 http://localhost:5173

# 4. 构建生产版本
npm run build

# 5. 构建Chrome扩展
npm run build:extension
```

## 📱 部署方式

### 🌐 Web 应用部署

```bash
# 构建生产版本
npm run build

# 部署到静态服务器
# 将 dist/ 目录上传到你的 Web 服务器
# 支持 Nginx, Apache, GitHub Pages, Vercel, Netlify 等
```

### 🔌 Chrome 扩展部署

```bash
# 构建扩展版本
npm run build:extension

# 安装到 Chrome
# 1. 打开 Chrome 扩展管理页面 (chrome://extensions/)
# 2. 开启"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择项目的 dist/ 目录
```

### 💻 本地开发

```bash
# 开发模式
npm run dev
# 访问 http://localhost:5173

# 预览构建结果
npm run preview
```

## 📄 许可证

本项目采用 **MIT 许可证** - 查看 [LICENSE](LICENSE) 文件了解详情。

## � 相关资源

### 📚 技术文档

- [Vue 3 官方文档](https://vuejs.org/) - 前端框架
- [Vuetify 3 文档](https://vuetifyjs.com/) - UI 组件库
- [Pinia 文档](https://pinia.vuejs.org/) - 状态管理
- [Vite 文档](https://vitejs.dev/) - 构建工具

### 🛠️ 开发工具

- [Vue DevTools](https://devtools.vuejs.org/) - Vue 调试工具
- [ESLint](https://eslint.org/) - 代码质量检查
- [Prettier](https://prettier.io/) - 代码格式化

### 🎨 设计资源

- [Material Design](https://material.io/) - 设计规范
- [Material Design Icons](https://materialdesignicons.com/) - 图标库

---

_📧 如有任何问题或建议，欢迎通过 Issue 或 Pull Request 与我们交流！_