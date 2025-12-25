# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Obsidian 插件项目，名为 SimpleMindMap，为 Obsidian 笔记软件提供思维导图功能。插件基于 [mind-map](https://github.com/wanglin2/mind-map) 项目构建，使用 Vue 2 + Element UI 作为前端框架。

## 项目结构

```
obsidian-simplemindmap/
├── plugin/                    # 开发目录（源代码）
│   ├── main.js               # 插件主入口（继承 Obsidian Plugin 类）
│   ├── SmmEditView.js        # 思维导图编辑视图（继承 TextFileView）
│   ├── src/                  # Vue 应用源代码
│   │   ├── main.js           # Vue 应用初始化
│   │   ├── store.js          # Vuex 状态管理
│   │   ├── pages/Edit/       # 编辑页面组件
│   │   ├── components/       # 通用组件
│   │   └── config/           # 配置文件（主题、图标、常量等）
│   ├── ob/                   # Obsidian 集成模块
│   │   ├── Commands.js       # 命令系统
│   │   ├── Menus.js          # 菜单系统
│   │   ├── SmmSettingTab.js  # 设置面板
│   │   └── utils.js          # 工具函数
│   ├── locales/              # 国际化文件
│   ├── libs/                 # 本地依赖（simple-mind-map 和 themes 插件）
│   │   ├── simple-mind-map/  # 思维导图核心库（从 GitHub 克隆）
│   │   └── simple-mind-map-plugin-themes/  # 主题插件（从 GitHub 克隆）
│   ├── webpack.config.js     # Webpack 配置
│   └── setup-local-deps.js   # 本地依赖设置脚本
├── main.js                   # 构建后的插件主文件（输出到根目录）
├── styles.css                # 构建后的样式文件（输出到根目录）
└── manifest.json             # Obsidian 插件清单
```

## 开发工作流程

### 常用命令（在 plugin/ 目录下运行）

```bash
# 设置本地依赖（首次运行需要）
npm run setup:local-deps

# 使用代理设置本地依赖（如果网络有问题）
npm run setup:local-deps:proxy

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint

# 代码格式化
npm run format

# 创建节点图片列表（脚本工具）
npm run createNodeImageList

# AI 服务（脚本工具）
npm run ai:serve
```

### 开发流程

1. **设置本地依赖**（首次运行）：
   ```bash
   # 直接克隆（需要网络访问 GitHub）
   npm run setup:local-deps

   # 或使用代理（如果网络有问题）
   npm run setup:local-deps:proxy
   ```

   这会将 `simple-mind-map` 和 `simple-mind-map-plugin-themes` 克隆到 `plugin/libs/` 目录。

2. **进入开发目录**：所有开发工作都在 `plugin/` 目录下进行
3. **启动开发模式**：运行 `npm run dev`，Webpack 会监听文件变化并自动重新构建
4. **测试插件**：构建后的文件输出到项目根目录（`main.js` 和 `styles.css`），需要复制到 Obsidian 的插件目录进行测试
5. **生产构建**：完成开发后运行 `npm run build` 生成最终版本

### 本地依赖说明

项目使用本地依赖而不是 npm 包，原因：
- 可以直接修改和调试 `simple-mind-map` 核心代码
- 避免 npm 包版本锁定问题
- 支持私有分支和自定义修改

本地依赖位置：
- `plugin/libs/simple-mind-map/` - 思维导图核心库
- `plugin/libs/simple-mind-map-plugin-themes/` - 主题插件

### 文件输出

- 构建输出到项目根目录：`main.js` 和 `styles.css`
- Obsidian 插件需要三个文件：`main.js`、`styles.css`、`manifest.json`
- `manifest.json` 版本号需要手动更新

## 架构说明

### 核心架构

```
Obsidian Plugin System
    ↓
SimpleMindMapPlugin (plugin/main.js)
    ↓
SmmEditView (plugin/SmmEditView.js)
    ↓
Vue 2 Application (plugin/src/main.js)
    ↓
Vue Components + Vuex Store
    ↓
simple-mind-map 核心库
```

### 关键技术栈

- **前端框架**：Vue 2.6.14
- **UI 组件库**：Element UI 2.15.1
- **状态管理**：Vuex 3.6.2
- **国际化**：vue-i18n 8.27.2 + i18next 25.2.1
- **构建工具**：Webpack 5.98.0 + Babel
- **核心思维导图库**：simple-mind-map 0.14.0-fix.1
- **富文本编辑器**：@toast-ui/editor 3.1.5

### 模块职责

1. **Obsidian 集成层** (`plugin/ob/`)
   - `Commands.js`：注册 Obsidian 命令（新建思维导图等）
   - `Menus.js`：右键菜单集成
   - `SmmSettingTab.js`：插件设置面板
   - `MarkdownPostProcessor.js`：处理 Markdown 中的思维导图嵌入

2. **Vue 应用层** (`plugin/src/`)
   - `main.js`：初始化 Vue 应用，配置 Element UI、国际化
   - `store.js`：Vuex 状态管理
   - `pages/Edit/`：思维导图编辑主界面
   - `config/`：主题、图标、常量等配置

3. **文件处理**
   - 文件格式：`.smm.md`（包含元数据、压缩的思维导图数据、图片数据）
   - 数据压缩：使用 `lz-string` 库压缩/解压数据
   - 图片处理：支持从 Vault 选择图片，上传到指定目录

### 国际化

- 支持中文、英文、越南语、繁体中文
- 使用 i18next + vue-i18n 双框架
- 语言文件：`plugin/locales/` 和 `plugin/src/lang/`
- 自动跟随 Obsidian 语言设置

## 构建配置

### Webpack 配置要点

- 入口：`plugin/main.js`
- 输出：`../main.js` 和 `../styles.css`
- 排除 Obsidian API 作为外部依赖（减小包体积）
- 生产环境压缩 JS 和 CSS，移除 `console.log`
- 支持 Vue、CSS、SCSS、Less、图片等资源

### 依赖说明

- `obsidian`：仅作为开发依赖，用于类型定义
- `simple-mind-map`：核心思维导图功能库
- `element-ui`：UI 组件库，按需引入
- `lz-string`：数据压缩，用于文件存储

## 开发注意事项

1. **文件路径**：所有构建相关的路径都相对于 `plugin/` 目录
2. **Obsidian API**：通过 `externals` 排除，运行时从 Obsidian 获取
3. **Vue 版本**：使用 Vue 2 完整版（包含模板编译器）
4. **图片处理**：图片资源使用 `asset/inline` 转换为 base64
5. **代码规范**：使用 ESLint + Prettier，可运行 `npm run lint` 和 `npm run format`

## 插件功能要点

- 思维导图文件格式：`.smm.md`
- 支持 Obsidian 内链和文件链接
- 支持导入/导出（smm、json、xmind、png、svg、pdf）
- 支持大纲模式和思维导图模式切换
- 支持在 Markdown 中嵌入思维导图预览
- 支持多语言（自动跟随 Obsidian 语言设置）
- 支持主题切换（暗黑、浅色、跟随 Obsidian）

## 调试指南

### 开发环境调试

#### 1. 启用 Source Map
当前 Webpack 配置中 `devtool: false`，如果需要调试，可以修改 `plugin/webpack.config.js`：

```javascript
// 开发环境使用 source map
devtool: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,
```

或者创建单独的调试配置。

#### 2. 控制台日志
- **开发模式**：`console.log` 语句会保留
- **生产构建**：Webpack 会移除 `console.log`（通过 TerserPlugin 配置）
- **调试输出**：可以在代码中添加 `console.debug` 或 `console.warn` 用于调试

#### 3. Vue DevTools
由于这是 Obsidian 插件，Vue DevTools 可能无法直接使用。但可以通过以下方式调试：
- 在 Vue 组件中添加 `debugger` 语句
- 使用浏览器开发者工具的 Sources 面板

### Obsidian 环境调试

#### 1. 开发者工具
在 Obsidian 中打开开发者工具：
- **macOS**：`Cmd+Option+I`
- **Windows/Linux**：`Ctrl+Shift+I`
- 或通过菜单：帮助 → 切换开发者工具

#### 2. 插件日志
在插件代码中添加日志：
```javascript
console.log('SimpleMindMap: 插件加载');
console.debug('调试信息:', data);
console.error('错误信息:', error);
```

日志会在 Obsidian 开发者工具的 Console 面板显示。

#### 3. 错误追踪
- 检查 Console 面板的错误和警告
- 使用 Network 面板查看文件加载和 API 请求
- 使用 Sources 面板设置断点（需要 source map）

### 常见调试场景

#### 1. 插件加载失败
- 检查 `manifest.json` 版本号和格式
- 查看 Console 中的错误信息
- 确认文件路径正确

#### 2. Vue 组件问题
- 在组件中添加 `debugger` 语句
- 检查 Vue 实例是否正确初始化
- 查看 Vuex store 状态

#### 3. 文件读写问题
- 检查 `.smm.md` 文件格式
- 验证数据压缩/解压逻辑
- 查看文件权限

#### 4. 样式问题
- 使用 Elements 面板检查 CSS 样式
- 确认 `styles.css` 正确加载
- 检查 Element UI 组件样式

### 调试脚本

项目提供了两个调试脚本：

```bash
# 创建节点图片列表（调试图片相关功能）
npm run createNodeImageList

# AI 服务（调试 AI 相关功能）
npm run ai:serve
```

### 性能调试

1. **内存使用**：使用 Performance 面板记录性能
2. **包大小**：运行 `npm run build` 后检查输出文件大小
3. **加载时间**：使用 Network 面板查看资源加载时间

### 测试建议

1. **单元测试**：可以为关键函数添加单元测试
2. **集成测试**：在 Obsidian 中手动测试各种场景
3. **跨平台测试**：测试在不同操作系统上的表现

### 快速测试技巧

#### 1. 自动复制脚本
可以创建脚本自动将构建文件复制到 Obsidian 插件目录：

```bash
#!/bin/bash
# build-and-copy.sh
cd plugin
npm run build
cp ../main.js ../styles.css ~/Library/Application\ Support/obsidian/plugins/simple-mind-map/
echo "构建完成并已复制到插件目录"
```

#### 2. 开发模式热重载
1. 运行 `npm run dev` 启动监听模式
2. Webpack 会自动重新构建文件变化
3. 在 Obsidian 中重新加载插件：`Cmd+R`（macOS）或 `Ctrl+R`（Windows/Linux）

#### 3. 调试特定功能
- **思维导图核心**：测试 `simple-mind-map` 库的功能
- **Vue 组件**：检查组件 props 和事件
- **文件处理**：验证 `.smm.md` 文件的读写
- **国际化**：切换 Obsidian 语言测试多语言支持

## 测试部署

1. 运行 `npm run build` 生成生产版本
2. 将根目录的 `main.js`、`styles.css`、`manifest.json` 复制到 Obsidian 插件目录
3. 在 Obsidian 中启用插件
4. 创建 `.smm.md` 文件测试功能