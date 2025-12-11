# SimpleMindMap 网页版本构建指南

本文档介绍如何构建和运行 SimpleMindMap 的网页版本。

## 概述

现在项目支持两种构建目标：
1. **Obsidian 插件版本**：传统的 Obsidian 插件构建
2. **网页版本**：独立的网页应用，可在浏览器中直接运行

## 项目结构变化

### 新增文件

```
plugin/
├── web-main.js              # 网页版本入口文件
├── web-index.html           # 网页版本 HTML 模板
├── webpack.web.config.js    # 网页版本 Webpack 配置
└── package.json             # 新增构建脚本

dist/                        # 网页版本输出目录（构建后生成）
├── index.html              # 主页面
├── js/                     # JavaScript 文件
├── css/                    # CSS 样式文件
├── images/                 # 图片资源
├── fonts/                  # 字体文件
└── manifest.json           # 插件清单（复制）
```

### 修改文件

- `plugin/package.json`：新增网页构建脚本

## 构建命令

### Obsidian 插件版本（原有）

```bash
# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build
```

### 网页版本（新增）

```bash
# 开发模式（启动开发服务器，支持热重载）
npm run web:dev

# 生产构建
npm run web:build

# 生产环境预览
npm run web:serve
```

## 使用说明

### 1. 开发网页版本

```bash
cd plugin
npm run web:dev
```

开发服务器将在 http://localhost:3000 启动，支持：
- 热重载（修改代码自动刷新）
- Source Map 调试
- 实时错误提示

### 2. 构建生产版本

```bash
cd plugin
npm run web:build
```

构建结果输出到 `dist/` 目录，包含：
- 优化和压缩的 JS/CSS 文件
- 资源文件（图片、字体）
- 完整的 HTML 页面

### 3. 部署网页版本

构建后的 `dist/` 目录可以直接部署到任何静态网站托管服务：

```bash
# 示例：部署到 GitHub Pages
git add dist/
git commit -m "部署网页版本"
git subtree push --prefix dist origin gh-pages

# 或使用其他静态托管服务
# - Netlify
# - Vercel
# - Cloudflare Pages
# - 自建 Nginx/Apache
```

## 技术实现

### 模拟 Obsidian API

网页版本通过 `web-main.js` 中的 `mockObsidianAPI` 模拟了 Obsidian 的核心功能：

```javascript
const mockObsidianAPI = {
  getSettings: () => ({ /* 设置数据 */ }),
  file: { /* 文件操作 */ },
  dialog: { /* 对话框 */ },
  notice: (message) => alert(message),
  t: (key) => translations[key] || key
}
```

### 构建配置差异

| 特性 | Obsidian 版本 | 网页版本 |
|------|---------------|----------|
| 入口文件 | `main.js` | `web-main.js` |
| 输出格式 | CommonJS 模块 | 浏览器脚本 |
| 外部依赖 | 排除 `obsidian` | 无外部依赖 |
| 资源处理 | Base64 内联 | 文件输出 |
| 开发服务器 | 无 | Webpack Dev Server |
| HTML 生成 | 无 | HtmlWebpackPlugin |

## 功能对比

### 完整功能
- ✓ 思维导图编辑
- ✓ 主题切换
- ✓ 布局调整
- ✓ 节点样式
- ✓ 导入/导出
- ✓ 多语言支持

### 网页版本限制
- ✗ Obsidian 文件系统集成
- ✗ Obsidian 命令系统
- ✗ Obsidian 插件生态
- ✗ 本地文件持久化（需自行实现）

### 网页版本优势
- ✓ 无需安装 Obsidian
- ✓ 跨平台（任何现代浏览器）
- ✓ 易于分享和部署
- ✓ 可嵌入其他网页应用

## 自定义开发

### 扩展网页版本功能

1. **添加本地存储**：
   ```javascript
   // 在 web-main.js 中扩展 mockObsidianAPI
   mockObsidianAPI.file = {
     read: async (path) => localStorage.getItem(path),
     write: async (path, content) => localStorage.setItem(path, content),
     exists: async (path) => localStorage.getItem(path) !== null
   }
   ```

2. **添加文件上传**：
   ```javascript
   // 实现真实的文件选择对话框
   mockObsidianAPI.dialog.open = async (options) => {
     return new Promise((resolve) => {
       const input = document.createElement('input')
       input.type = 'file'
       input.accept = options.filters?.map(f => f.extensions).join(',')
       input.onchange = (e) => resolve(e.target.files[0].path)
       input.click()
     })
   }
   ```

3. **添加后端集成**：
   ```javascript
   // 连接到后端 API
   mockObsidianAPI.file = {
     read: async (path) => {
       const response = await fetch(`/api/files/${path}`)
       return response.text()
     },
     write: async (path, content) => {
       await fetch(`/api/files/${path}`, {
         method: 'POST',
         body: content
       })
     }
   }
   ```

## 故障排除

### 常见问题

1. **构建失败：依赖缺失**
   ```bash
   cd plugin
   npm install
   ```

2. **开发服务器无法启动**
   - 检查端口 3000 是否被占用
   - 检查 Node.js 版本（需要 Node.js 14+）

3. **页面空白或错误**
   - 检查浏览器控制台错误
   - 确保所有资源正确加载
   - 检查网络请求状态

4. **功能异常**
   - 确认模拟 API 实现正确
   - 检查 Vue 应用初始化
   - 验证数据格式

### 调试技巧

1. **启用详细日志**：
   ```javascript
   // 在 web-main.js 中
   console.debug('调试信息:', data)
   ```

2. **检查 Vue 实例**：
   ```javascript
   // 在浏览器控制台中
   window.smmApp // 全局应用实例
   ```

3. **网络请求监控**：
   - 使用浏览器开发者工具的 Network 面板
   - 检查资源加载状态

## 性能优化

### 构建优化

1. **代码分割**：已配置按需加载
2. **资源压缩**：生产环境自动启用
3. **缓存策略**：文件名包含哈希值

### 运行时优化

1. **懒加载**：可进一步拆分大型模块
2. **虚拟滚动**：处理大量节点时
3. **Web Worker**：复杂计算移出主线程

## 后续开发建议

1. **渐进式 Web 应用 (PWA)**：
   - 添加 Service Worker
   - 实现离线功能
   - 添加到主屏幕

2. **协作功能**：
   - WebSocket 实时同步
   - 多人协同编辑
   - 版本历史

3. **云存储集成**：
   - Google Drive
   - Dropbox
   - OneDrive

4. **移动端优化**：
   - 响应式设计改进
   - 触摸手势支持
   - 移动端专属 UI

## 许可证

网页版本遵循与原始项目相同的许可证。请参考项目根目录的 LICENSE 文件。

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进网页版本功能。

1. 在 `plugin/` 目录下进行开发
2. 确保网页版本和 Obsidian 版本都能正常构建
3. 更新相关文档
4. 提交 Pull Request