#!/usr/bin/env node

/**
 * 构建脚本 - 用于本地快速构建和测试
 * 自动构建并将文件复制到 Obsidian 插件目录
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // Obsidian 插件目录（根据系统自动选择）
  obsidianPluginDir: process.env.OBSIDIAN_PLUGIN_DIR ||
    (process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA, 'Obsidian', 'plugins', 'simple-mind-map')
      : path.join(process.env.HOME, '.obsidian', 'plugins', 'simple-mind-map')),

  // 构建输出目录（项目根目录）
  outputDir: path.resolve(__dirname, '../../'),

  // 插件开发目录
  pluginDir: path.resolve(__dirname, '..'),

  // 需要复制的文件
  filesToCopy: ['main.js', 'styles.css', 'manifest.json']
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️ ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️ ${message}`, 'yellow');
}

// 检查本地依赖
function checkLocalDependencies() {
  const simpleMindMapPath = path.join(CONFIG.pluginDir, 'libs', 'mind-map', 'simple-mind-map');
  const themesPath = path.join(CONFIG.pluginDir, 'libs', 'simple-mind-map-plugin-themes');

  info('检查本地依赖...');

  if (!fs.existsSync(simpleMindMapPath)) {
    warn('simple-mind-map 依赖不存在，运行 setup:local-deps...');
    try {
      execSync('npm run setup:local-deps', {
        cwd: CONFIG.pluginDir,
        stdio: 'inherit'
      });
    } catch (e) {
      error('本地依赖设置失败，请手动运行: npm run setup:local-deps');
    }
  } else {
    success('simple-mind-map 依赖已存在');
  }

  if (!fs.existsSync(themesPath)) {
    warn('simple-mind-map-plugin-themes 依赖不存在');
  } else {
    success('simple-mind-map-plugin-themes 依赖已存在');
  }
}

// 运行构建
function runBuild() {
  info('开始构建...');

  try {
    execSync('npm run build', {
      cwd: CONFIG.pluginDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    success('构建完成');
  } catch (e) {
    error('构建失败，请检查错误信息');
  }
}

// 验证构建产物
function verifyBuild() {
  info('验证构建产物...');

  const mainJs = path.join(CONFIG.outputDir, 'main.js');
  const stylesCss = path.join(CONFIG.outputDir, 'styles.css');

  if (!fs.existsSync(mainJs)) {
    error('main.js 不存在');
  }

  if (!fs.existsSync(stylesCss)) {
    error('styles.css 不存在');
  }

  const mainJsSize = fs.statSync(mainJs).size;
  const stylesCssSize = fs.statSync(stylesCss).size;

  success(`main.js: ${mainJsSize.toLocaleString()} 字节`);
  success(`styles.css: ${stylesCssSize.toLocaleString()} 字节`);

  if (mainJsSize < 1000) {
    warn('main.js 文件过小，可能构建异常');
  }
}

// 复制到 Obsidian 插件目录
function copyToObsidian() {
  info('复制文件到 Obsidian 插件目录...');

  // 检查目标目录是否存在，不存在则创建
  if (!fs.existsSync(CONFIG.obsidianPluginDir)) {
    warn(`Obsidian 插件目录不存在: ${CONFIG.obsidianPluginDir}`);

    // 询问用户是否创建
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('是否创建该目录? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        fs.mkdirSync(CONFIG.obsidianPluginDir, { recursive: true });
        success(`目录已创建: ${CONFIG.obsidianPluginDir}`);
        doCopy();
      } else {
        info('跳过复制到 Obsidian 目录');
      }
      readline.close();
    });
  } else {
    doCopy();
  }

  function doCopy() {
    if (!fs.existsSync(CONFIG.obsidianPluginDir)) {
      warn('目标目录不存在，跳过复制');
      return;
    }

    CONFIG.filesToCopy.forEach(file => {
      const source = path.join(CONFIG.outputDir, file);
      const target = path.join(CONFIG.obsidianPluginDir, file);

      if (fs.existsSync(source)) {
        fs.copyFileSync(source, target);
        success(`已复制: ${file}`);
      } else {
        warn(`文件不存在: ${file}`);
      }
    });

    info(`\n插件文件已复制到: ${CONFIG.obsidianPluginDir}`);
    info('请在 Obsidian 中重新加载插件 (Ctrl+R 或 Cmd+R)');
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
${colors.cyan}Obsidian Simple Mind Map 构建工具${colors.reset}

用法:
  node build-and-copy.js [选项]

选项:
  --no-copy    仅构建，不复制到 Obsidian 目录
  --help       显示帮助信息

环境变量:
  OBSIDIAN_PLUGIN_DIR  自定义 Obsidian 插件目录路径

示例:
  node build-and-copy.js                    # 构建并复制
  node build-and-copy.js --no-copy          # 仅构建
  OBSIDIAN_PLUGIN_DIR=/path/to/plugins node build-and-copy.js

当前配置:
  Obsidian 插件目录: ${CONFIG.obsidianPluginDir}
  构建输出目录: ${CONFIG.outputDir}
  `);
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    showHelp();
    return;
  }

  const shouldCopy = !args.includes('--no-copy');

  info('=== Obsidian Simple Mind Map 构建工具 ===\n');

  // 步骤1: 检查依赖
  checkLocalDependencies();

  // 步骤2: 构建
  runBuild();

  // 步骤3: 验证
  verifyBuild();

  // 步骤4: 复制到 Obsidian
  if (shouldCopy) {
    copyToObsidian();
  } else {
    info('跳过复制到 Obsidian 目录');
  }

  success('\n完成！');
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { CONFIG, checkLocalDependencies, runBuild, verifyBuild, copyToObsidian };