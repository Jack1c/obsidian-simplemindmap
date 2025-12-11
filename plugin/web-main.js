/**
 * 网页版本的入口文件
 * 用于在浏览器中独立运行思维导图应用
 */

import { initApp } from './src/main.js'
import './style.css'

// 模拟 Obsidian API
const mockObsidianAPI = {
  getSettings: () => ({
    lang: 'zh',
    noteFontSize: 14,
    defaultTheme: 'classic',
    defaultThemeDark: 'dark',
    defaultLayout: 'logicalStructure'
  }),

  // 文件操作模拟
  file: {
    read: async (path) => {
      console.log('模拟读取文件:', path)
      // 返回示例数据
      return `---
smm: true
---

# 示例思维导图

这是一个网页版本的思维导图示例。

## 子节点1

### 子节点1.1

## 子节点2`
    },

    write: async (path, content) => {
      console.log('模拟写入文件:', path, content.length)
      return true
    },

    exists: async (path) => {
      console.log('模拟检查文件是否存在:', path)
      return false
    }
  },

  // 对话框模拟
  dialog: {
    open: async (options) => {
      console.log('模拟打开对话框:', options)
      return new Promise((resolve) => {
        setTimeout(() => {
          if (options.type === 'file') {
            // 模拟选择文件
            resolve('/mock/path/to/file.smm.md')
          } else {
            resolve(null)
          }
        }, 100)
      })
    }
  },

  // 通知模拟
  notice: (message) => {
    console.log('模拟通知:', message)
    alert(message)
  },

  // 国际化模拟
  t: (key) => {
    const translations = {
      'action.createMindMap': '新建思维导图',
      'action.openMindMap': '打开思维导图',
      'action.saveMindMap': '保存思维导图',
      'action.exportMindMap': '导出思维导图',
      'common.rootNodeDefaultText': '中心主题',
      'common.secondNodeDefaultText': '分支主题',
      'common.branchNodeDefaultText': '子主题'
    }
    return translations[key] || key
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app')
  if (!appContainer) {
    console.error('找不到 #app 容器元素')
    return
  }

  try {
    const app = initApp(appContainer, mockObsidianAPI)
    console.log('思维导图应用初始化成功')

    // 暴露应用实例到全局，方便调试
    window.smmApp = app

    // 添加一些示例数据
    setTimeout(() => {
      if (app.$store && app.$bus) {
        // 可以在这里添加一些初始数据或触发事件
        console.log('应用已完全加载')
      }
    }, 1000)

  } catch (error) {
    console.error('初始化应用失败:', error)
    appContainer.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h3>初始化失败</h3>
        <p>${error.message}</p>
        <p>请检查控制台获取更多信息</p>
      </div>
    `
  }
})

// 导出初始化函数，方便其他脚本调用
export function initSimpleMindMap(el, options = {}) {
  const api = {
    ...mockObsidianAPI,
    ...options
  }
  return initApp(el, api)
}