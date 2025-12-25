# 构建和部署指南

本文档说明如何使用 GitHub Actions 自动构建 Obsidian Simple Mind Map 插件。

## GitHub Actions 自动构建

### 工作流配置

项目包含 GitHub Actions 工作流文件：`.github/workflows/build.yml`

**触发条件：**
- 推送到 `main` 或 `note` 分支时
- 手动触发工作流

**自动执行的操作：**
1. 检出代码
2. 设置 Node.js 18 环境
3. 缓存依赖以加速构建
4. 自动设置本地依赖（如果不存在）
5. 安装 npm 依赖
6. 构建插件（main.js + styles.css）
7. 验证构建产物
8. 创建 GitHub Release
9. 上传构建文件到 Release

### 使用方法

#### 1. 推送代码触发自动构建

```bash
# 开发完成后，提交代码
git add .
git commit -m "feat: 添加新功能"
git push origin main

# GitHub Actions 会自动：
# 1. 构建插件
# 2. 创建 Release
# 3. 上传 main.js, styles.css, manifest.json
```

#### 2. 手动触发构建

在 GitHub 页面：
1. 进入仓库的 **Actions** 标签页
2. 选择 **Build and Release Obsidian Plugin** 工作流
3. 点击 **Run workflow**
4. 选择分支并运行

#### 3. 下载构建产物

构建完成后，在 **Releases** 页面可以找到：
- `main.js` - 插件主文件
- `styles.css` - 样式文件
- `manifest.json` - 插件清单

## 本地构建

### 快速构建并复制到 Obsidian

```bash
cd plugin
npm run build:copy
```

这个命令会：
1. 检查本地依赖是否存在
2. 运行构建
3. 验证构建产物
4. 自动复制到 Obsidian 插件目录

### 仅构建（不复制）

```bash
cd plugin
npm run build:local
```

### 手动构建

```bash
cd plugin
npm run build
```

构建产物会生成在项目根目录：
- `../main.js`
- `../styles.css`

## Obsidian 插件目录结构

```
~/.obsidian/plugins/simple-mind-map/
├── main.js          # 插件主文件（自动构建）
├── styles.css       # 样式文件（自动构建）
├── manifest.json    # 插件清单（需要手动维护）
└── (其他文件)
```

## 版本管理

### 更新版本号

在推送代码前，记得更新 `manifest.json` 中的版本号：

```json
{
  "id": "simple-mind-map",
  "name": "Simple mind map",
  "version": "0.1.4",  // ← 更新这里
  "minAppVersion": "1.8.3",
  "description": "A relatively powerful mind map.",
  "author": "wanglin",
  "authorUrl": "https://github.com/wanglin2",
  "isDesktopOnly": false
}
```

### Release 版本命名

GitHub Actions 会自动创建版本号：`v{运行序号}`，例如：
- `v1`
- `v2`
- `v3`

## 故障排除

### 构建失败

1. **检查依赖**
   ```bash
   cd plugin
   npm run setup:local-deps
   npm install
   ```

2. **检查 Node.js 版本**
   ```bash
   node --version  # 应该是 v18 或更高
   ```

3. **查看详细日志**
   在 GitHub Actions 页面查看详细的构建日志。

### 本地依赖问题

如果构建时出现模块找不到的错误：

```bash
cd plugin
rm -rf libs/
npm run setup:local-deps
```

### 文件复制失败

如果 `build:copy` 命令无法找到 Obsidian 目录：

```bash
# 指定自定义目录
OBSIDIAN_PLUGIN_DIR=/path/to/your/plugins node ./scripts/build-and-copy.js
```

## 开发工作流建议

### 1. 本地开发
```bash
cd plugin
npm run dev  # 监听模式，自动重新构建
```

### 2. 测试构建
```bash
cd plugin
npm run build:copy  # 构建并复制到 Obsidian
```

### 3. 提交代码
```bash
# 在项目根目录
git add .
git commit -m "feat: 功能描述"
git push origin main  # 触发自动构建
```

### 4. 获取构建产物
- 等待 GitHub Actions 完成
- 在 Releases 页面下载文件
- 或直接使用本地构建的文件

## CI/CD 配置详解

### 环境变量

- `NODE_ENV=production` - 生产环境构建
- `OBSIDIAN_PLUGIN_DIR` - 自定义 Obsidian 插件目录（可选）

### 缓存策略

- npm 依赖缓存：基于 `package.json` 的 hash
- 本地依赖缓存：如果已存在则跳过下载

### 构建优化

- 代码压缩（TerserPlugin）
- CSS 压缩（CssMinimizerPlugin）
- 移除 console.log
- 生成 Source Map（开发环境）

## 相关命令速查

| 命令 | 说明 |
|------|------|
| `npm run build` | 标准构建 |
| `npm run build:local` | 仅构建，不复制 |
| `npm run build:copy` | 构建并复制到 Obsidian |
| `npm run dev` | 开发模式（监听） |
| `npm run lint` | 代码检查 |
| `npm run format` | 代码格式化 |
| `npm run setup:local-deps` | 设置本地依赖 |

## 注意事项

1. **本地依赖**：项目使用本地依赖而非 npm 包，确保 `plugin/libs/` 目录存在
2. **文件大小**：构建产物较大（~7MB），这是正常的，因为包含了所有依赖
3. **版本号**：记得在发布前更新 `manifest.json` 中的版本号
4. **测试**：建议在本地测试通过后再推送到 GitHub