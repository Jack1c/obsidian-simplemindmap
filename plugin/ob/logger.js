/**
 * SimpleMindMap 插件日志系统
 * 提供分级日志功能，支持开发和生产环境配置
 */

// 日志级别常量
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// 日志级别名称映射
const levelNames = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR'
};

// 默认配置
const defaultConfig = {
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  prefix: 'SimpleMindMap',
  showTimestamp: true,
  showLevel: true,
  colors: true
};

// 控制台颜色
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 级别对应的颜色
const levelColors = {
  [LogLevel.DEBUG]: colors.cyan,
  [LogLevel.INFO]: colors.green,
  [LogLevel.WARN]: colors.yellow,
  [LogLevel.ERROR]: colors.red
};

class Logger {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.plugin = null; // 将在插件初始化时设置
  }

  /**
   * 设置插件实例（用于访问 Obsidian API）
   */
  setPlugin(plugin) {
    this.plugin = plugin;
  }

  /**
   * 格式化时间戳
   */
  formatTimestamp() {
    if (!this.config.showTimestamp) return '';
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:` +
           `${now.getMinutes().toString().padStart(2, '0')}:` +
           `${now.getSeconds().toString().padStart(2, '0')}.` +
           `${now.getMilliseconds().toString().padStart(3, '0')}`;
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, ...args) {
    const parts = [];

    // 时间戳
    if (this.config.showTimestamp) {
      const timestamp = this.formatTimestamp();
      if (this.config.colors) {
        parts.push(`${colors.dim}[${timestamp}]${colors.reset}`);
      } else {
        parts.push(`[${timestamp}]`);
      }
    }

    // 前缀
    if (this.config.prefix) {
      if (this.config.colors) {
        parts.push(`${colors.bright}${colors.blue}[${this.config.prefix}]${colors.reset}`);
      } else {
        parts.push(`[${this.config.prefix}]`);
      }
    }

    // 日志级别
    if (this.config.showLevel && levelNames[level]) {
      const levelName = levelNames[level];
      if (this.config.colors && levelColors[level]) {
        parts.push(`${levelColors[level]}[${levelName}]${colors.reset}`);
      } else {
        parts.push(`[${levelName}]`);
      }
    }

    // 消息内容
    return parts.join(' ') + ' ' + args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      } else if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  shouldLog(level) {
    return level >= this.config.level;
  }

  /**
   * 记录日志
   */
  log(level, ...args) {
    if (!this.shouldLog(level)) return;

    const message = this.formatMessage(level, ...args);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        // 如果是错误级别，同时输出到 Obsidian 通知（如果插件实例可用）
        if (this.plugin && args[0] instanceof Error) {
          this.plugin.showError(args[0]);
        }
        break;
      default:
        console.log(message);
    }
  }

  /**
   * 调试日志
   */
  debug(...args) {
    this.log(LogLevel.DEBUG, ...args);
  }

  /**
   * 信息日志
   */
  info(...args) {
    this.log(LogLevel.INFO, ...args);
  }

  /**
   * 警告日志
   */
  warn(...args) {
    this.log(LogLevel.WARN, ...args);
  }

  /**
   * 错误日志
   */
  error(...args) {
    this.log(LogLevel.ERROR, ...args);
  }

  /**
   * 性能测量
   */
  time(label) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.time(`${this.config.prefix}: ${label}`);
  }

  timeEnd(label) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.timeEnd(`${this.config.prefix}: ${label}`);
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    if (level >= LogLevel.DEBUG && level <= LogLevel.NONE) {
      this.config.level = level;
      this.info(`日志级别设置为: ${levelNames[level] || level}`);
    }
  }

  /**
   * 获取当前日志级别
   */
  getLevel() {
    return this.config.level;
  }

  /**
   * 启用/禁用颜色
   */
  setColors(enabled) {
    this.config.colors = enabled;
  }

  /**
   * 启用/禁用时间戳
   */
  setTimestamp(enabled) {
    this.config.showTimestamp = enabled;
  }
}

// 创建默认日志实例
const logger = new Logger();

export { Logger, logger as default };