# 本地依赖说明

本项目使用本地依赖而不是 npm 包，这样可以：

1. **直接调试和修改** `simple-mind-map` 核心代码
2. **避免版本锁定问题**，可以随时同步最新代码
3. **支持私有分支**和自定义修改
4. **离线开发**，不依赖 npm registry

## 如何设置本地依赖

### 方法一：使用脚本（推荐）

```bash
# 直接克隆（需要访问 GitHub）
npm run setup:local-deps

# 如果网络有问题，使用代理
npm run setup:local-deps:proxy
```

### 方法二：手动克隆

```bash
cd plugin
mkdir -p libs
cd libs

# 克隆 simple-mind-map
git clone https://github.com/wanglin2/mind-map.git simple-mind-map

# 克隆主题插件
git clone https://github.com/wanglin2/simple-mind-map-plugin-themes.git simple-mind-map-plugin-themes
```

## 目录结构

```
plugin/
├── libs/
│   ├── simple-mind-map/           # 思维导图核心库
│   │   ├── index.js              # 主入口
│   │   ├── src/                  # 源代码
│   │   └── package.json
│   └── simple-mind-map-plugin-themes/
│       ├── index.js              # 主入口
│       ├── themeList.js          # 主题列表
│       └── src/                  # 主题源代码
```

## 如何更新本地依赖

### 更新到最新版本

```bash
cd plugin/libs/simple-mind-map
git pull origin main

cd ../simple-mind-map-plugin-themes
git pull origin main

# 回到 plugin 目录重新构建
cd ../..
npm run build
```

### 切换到特定版本/分支

```bash
cd plugin/libs/simple-mind-map
git checkout v0.14.0  # 或其他版本号
git pull

# 同样更新 themes
cd ../simple-mind-map-plugin-themes
git checkout main
git pull
```

## Webpack 配置

在 `webpack.config.js` 中配置了别名：

```javascript
alias: {
  'simple-mind-map': path.resolve(__dirname, './libs/simple-mind-map'),
  'simple-mind-map-plugin-themes': path.resolve(__dirname, './libs/simple-mind-map-plugin-themes')
}
```

这样所有 `import 'simple-mind-map'` 都会指向本地目录。

## 开发工作流

1. **首次设置**：
   ```bash
   cd plugin
   npm install
   npm run setup:local-deps
   ```

2. **开发**：
   ```bash
   npm run dev
   ```

3. **构建**：
   ```bash
   npm run build
   ```

4. **更新依赖**：
   ```bash
   cd libs/simple-mind-map && git pull
   cd ../simple-mind-map-plugin-themes && git pull
   cd ../.. && npm run build
   ```

## 常见问题

### Q: 为什么不用 npm 包？

A: 使用本地依赖可以：
- 直接修改和调试核心代码
- 避免 npm 包版本问题
- 支持私有修改和实验性功能

### Q: 如何添加新的依赖？

A: 如果 `simple-mind-map` 需要新依赖：
1. 在 `plugin/package.json` 中添加
2. 运行 `npm install`
3. 重新构建

### Q: 构建失败怎么办？

A: 检查：
1. `plugin/libs/` 目录是否存在且包含正确文件
2. `node_modules` 是否完整（运行 `npm install`）
3. 查看构建错误信息

### Q: 可以提交 libs 目录到 git 吗？

A: 不建议。`.gitignore` 已配置忽略 `plugin/libs/`。每个开发者应该自己克隆最新版本。
