/**
 * 测试日志系统
 */

// 模拟 Obsidian 插件环境
const mockPlugin = {
  showError: (error) => {
    console.log('Mock Plugin.showError called:', error.message);
  }
};

// 测试日志系统
async function testLogger() {
  console.log('=== 开始测试日志系统 ===\n');

  // 动态导入日志模块
  const { Logger, LogLevel } = await import('./ob/logger.js');

  // 创建测试日志实例
  const testLogger = new Logger({
    level: LogLevel.DEBUG,
    prefix: 'TestLogger',
    showTimestamp: true,
    showLevel: true,
    colors: false // 测试时禁用颜色
  });

  testLogger.setPlugin(mockPlugin);

  console.log('1. 测试不同日志级别:');
  testLogger.debug('这是一条调试消息');
  testLogger.info('这是一条信息消息');
  testLogger.warn('这是一条警告消息');
  testLogger.error('这是一条错误消息', new Error('测试错误'));

  console.log('\n2. 测试性能测量:');
  testLogger.time('测试操作');
  await new Promise(resolve => setTimeout(resolve, 100));
  testLogger.timeEnd('测试操作');

  console.log('\n3. 测试不同数据类型:');
  testLogger.info('字符串:', 'Hello World');
  testLogger.info('数字:', 42);
  testLogger.info('布尔值:', true);
  testLogger.info('数组:', [1, 2, 3]);
  testLogger.info('对象:', { name: 'Test', value: 123 });
  testLogger.info('错误对象:', new Error('测试错误对象'));

  console.log('\n4. 测试日志级别过滤:');
  testLogger.setLevel(LogLevel.WARN);
  testLogger.debug('这条调试消息应该不会显示');
  testLogger.info('这条信息消息应该不会显示');
  testLogger.warn('这条警告消息应该显示');
  testLogger.error('这条错误消息应该显示');

  console.log('\n5. 重置为 DEBUG 级别:');
  testLogger.setLevel(LogLevel.DEBUG);
  testLogger.debug('现在调试消息应该显示');

  console.log('\n=== 日志系统测试完成 ===');
}

// 运行测试
testLogger().catch(error => {
  console.error('测试失败:', error);
});