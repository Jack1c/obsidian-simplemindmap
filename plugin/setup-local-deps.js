#!/usr/bin/env node

/**
 * 设置本地依赖脚本
 * 该脚本会从 GitHub 克隆 simple-mind-map 和 simple-mind-map-plugin-themes 到 libs 目录
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const libsDir = path.join(__dirname, 'libs');
const simpleMindMapDir = path.join(libsDir, 'simple-mind-map');
const themesDir = path.join(libsDir, 'simple-mind-map-plugin-themes');

// 检查是否需要设置代理
const useProxy = process.env.USE_PROXY === 'true';
const proxyEnv = useProxy ? {
  https_proxy: 'http://127.0.0.1:7890',
  http_proxy: 'http://127.0.0.1:7890',
  all_proxy: 'socks5://127.0.0.1:7890'
} : {};

console.log('🚀 开始设置本地依赖...\n');

// 创建 libs 目录
if (!fs.existsSync(libsDir)) {
  fs.mkdirSync(libsDir, { recursive: true });
  console.log('✅ 创建 libs 目录');
}

// 克隆 simple-mind-map
if (!fs.existsSync(simpleMindMapDir)) {
  console.log('📥 克隆 simple-mind-map 仓库...');
  try {
    execSync(
      `git clone https://github.com/wanglin2/mind-map.git ${simpleMindMapDir}`,
      {
        stdio: 'inherit',
        env: { ...process.env, ...proxyEnv }
      }
    );
    console.log('✅ simple-mind-map 克隆完成');
  } catch (error) {
    console.error('❌ 克隆 simple-mind-map 失败:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ simple-mind-map 目录已存在，跳过克隆');
}

// 克隆 simple-mind-map-plugin-themes
if (!fs.existsSync(themesDir)) {
  console.log('📥 克隆 simple-mind-map-plugin-themes 仓库...');
  try {
    execSync(
      `git clone https://github.com/wanglin2/simple-mind-map-plugin-themes.git ${themesDir}`,
      {
        stdio: 'inherit',
        env: { ...process.env, ...proxyEnv }
      }
    );
    console.log('✅ simple-mind-map-plugin-themes 克隆完成');
  } catch (error) {
    console.error('❌ 克隆 simple-mind-map-plugin-themes 失败:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ simple-mind-map-plugin-themes 目录已存在，跳过克隆');
}

console.log('\n🎉 本地依赖设置完成！');
console.log('\n现在可以运行:');
console.log('  npm run build    # 构建插件');
console.log('  npm run dev      # 开发模式\n');

// 检查 node_modules 中是否有所需依赖
console.log('🔍 检查 node_modules 依赖...');
const requiredDeps = [
  '@svgdotjs/svg.js',
  'deepmerge',
  'eventemitter3',
  'jszip',
  'katex',
  'mdast-util-from-markdown',
  'pdf-lib',
  'quill',
  'tern',
  'uuid',
  'ws',
  'xml-js',
  'y-webrtc',
  'yjs'
];

const missingDeps = requiredDeps.filter(dep => {
  try {
    require.resolve(dep);
    return false;
  } catch {
    return true;
  }
});

if (missingDeps.length > 0) {
  console.log('⚠️  缺少以下依赖，需要安装:');
  console.log('  ' + missingDeps.join(', '));
  console.log('\n运行以下命令安装:');
  console.log('  pnpm install  或  npm install');
} else {
  console.log('✅ 所有依赖都已安装');
}
