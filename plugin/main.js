import {
  addIcon,
  Plugin,
  TFolder,
  Notice,
  MarkdownView,
  WorkspaceLeaf,
  Workspace,
  getLanguage
} from 'obsidian'
import './style.css'
import SmmEditView from './SmmEditView.js'
import {
  SMM_VIEW_TYPE,
  SIDE_BAR_ICON,
  SMM_TAG,
  DEFAULT_SETTINGS,
  IGNORE_CHECK_SMM
} from './ob/constant.js'
import {
  createDefaultText,
  createDefaultMindMapData
} from './ob/metadataAndMarkdown.js'
import { around, dedupe } from 'monkey-around'
import { getUidFromSource } from './ob/utils.js'
import MarkdownPostProcessor from './ob/MarkdownPostProcessor.js'
import SmmSettingTab from './ob/SmmSettingTab.js'
import { langList } from './src/config/zh'
import i18n from 'i18next'
import enTranslations from './locales/en.json'
import zhTranslations from './locales/zh.json'
import viTranslations from './locales/vi.json'
import zhtwTranslations from './locales/zhtw.json'
import Commands from './ob/Commands.js'
import markdown from 'simple-mind-map/src/parse/markdown.js'
import Menus from './ob/Menus.js'
import logger from './ob/logger.js'

export default class SimpleMindMapPlugin extends Plugin {
  async onload() {
    // 初始化日志系统
    logger.setPlugin(this);
    logger.info('SimpleMindMap 插件开始加载');

    // 添加设置
    await this._addSetting()

    // 初始化多语言
    i18n.init({
      lng: getLanguage() || 'en', // 自动检测用户语言
      fallbackLng: 'en',
      resources: {
        en: { translation: enTranslations },
        zh: { translation: zhTranslations },
        vi: { translation: viTranslations },
        ['zh-TW']: { translation: zhtwTranslations }
      }
    })
    logger.debug('多语言系统初始化完成');

    addIcon('smm-icon', SIDE_BAR_ICON)
    logger.debug('图标添加完成');

    // 注册自定义视图
    this.registerView(SMM_VIEW_TYPE, leaf => new SmmEditView(leaf, this))
    logger.debug('思维导图视图注册完成');

    // 添加 Ribbon 图标
    this._createSmmFile = this._createSmmFile.bind(this)
    this.addRibbonIcon(
      'smm-icon',
      this._t('action.createMindMap'), // 新建思维导图
      this._createSmmFile
    )
    logger.debug('Ribbon 图标添加完成');

    // 添加命令
    this.commands = new Commands(this)
    logger.debug('命令系统初始化完成');

    // 添加右键菜单
    this.menus = new Menus(this)
    logger.debug('菜单系统初始化完成');

    // 打补丁，拦截默认的打开方法
    this._registerMonkeyPatches()
    logger.debug('Monkey patches 注册完成');

    // 切换到思维导图视图
    this._switchToSmmAfterLoad()
    logger.debug('视图切换初始化完成');

    // 创建状态栏子元素
    this._initStatusBar()
    logger.debug('状态栏初始化完成');

    // 处理嵌入的思维导图
    this.markdownPostProcessor = new MarkdownPostProcessor(this)
    this.markdownPostProcessor.register()
    logger.debug('Markdown 后处理器注册完成');

    // 记录打开文件的子路径，用于定位到指定节点
    this.fileToSubpathMap = {}

    logger.info('SimpleMindMap 插件加载完成');
  }

  // 创建思维导图文件
  async _createSmmFile(folderPath = '', callback) {
    try {
      if (typeof folderPath !== 'string') {
        folderPath = ''
      }
      let { fileNamePrefix, fileNameDateFormat } = this.settings
      fileNamePrefix = fileNamePrefix || 'MindMap'
      folderPath = this._getCreateFolderPath(folderPath)
      await this._ensureDirectoryExists(folderPath)
      const { vault } = this.app
      const filePath = `${
        folderPath ? folderPath + '/' : ''
      }${fileNamePrefix} ${moment().format(fileNameDateFormat)}.smm.md`
      const fileContent = createDefaultText(
        filePath,
        this._getCreateDefaultMindMapOptions()
      )
      try {
        // 检查文件是否已存在
        const existingFile = vault.getFileByPath(filePath)
        if (existingFile) {
          // 文件已经存在
          new Notice(this._t('tip.fileExist'))
        } else {
          // 创建新文件
          await vault.create(filePath, fileContent)
          if (callback && typeof callback === 'function') {
            callback(filePath)
          } else {
            await this.app.workspace.openLinkText(filePath, '', true)
          }
        }
      } catch (error) {
        // 新建思维导图失败
        logger.error('创建思维导图文件失败:', error)
        new Notice(this._t('tip.createMindMapFail'))
      }
    } catch (error) {
      logger.error('创建思维导图过程失败:', error)
      // 新建思维导图失败
      new Notice(this._t('tip.createMindMapFail'))
    }
  }

  // 获取创建文件夹路径
  _getCreateFolderPath(folderPath) {
    if (folderPath) return folderPath
    const { filePathType, filePath } = this.settings
    switch (filePathType) {
      case 'root':
        return ''
      case 'custom':
        return filePath
      case 'currentFileFolder':
        return this._getActiveFileDirectory()
      default:
        return ''
    }
  }

  // 处理文件名重复问题
  async _getAvailableFilaName(filePath, extCount = 1) {
    let counter = 1
    while (await this.app.vault.adapter.exists(filePath)) {
      const parts = filePath.split('.')
      const extList = []
      for (let i = 0; i < extCount; i++) {
        extList.push(parts.pop())
      }
      const ext = extList.reverse().join('.')
      filePath = `${parts.join('.')}_${counter}.${ext}`
      counter++
    }
    return filePath
  }

  // 添加设置
  async _addSetting() {
    await this._loadSettings()
    this.addSettingTab(new SmmSettingTab(this.app, this))
  }

  // 加载设置
  async _loadSettings() {
    const data = await this.loadData()
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data || {})
    const obLang = getLanguage()
    const target = langList.find(
      item => item.value === obLang || item.alias === obLang
    )
    this.settings.lang = target ? target.value : 'en'
  }

  // 保存设置
  async _saveSettings() {
    await this.saveData(this.settings)
  }

  // 打补丁，拦截默认的打开方法
  _registerMonkeyPatches() {
    // 防止其他插件或 Obsidian 核心代码通过 getActiveViewOfType 获取到 SmmEditView 时产生冲突（例如误判为 Markdown 视图）
    const key = 'https://github.com/wanglin2/mind-map'
    this.register(
      around(Workspace.prototype, {
        getActiveViewOfType(old) {
          return dedupe(key, old, function(...args) {
            const result = old && old.apply(this, args)
            if (args[1] === IGNORE_CHECK_SMM) {
              return result
            }
            const currentView = this.app?.workspace?.activeLeaf?.view
            if (!currentView || !(currentView instanceof SmmEditView))
              return result
          })
        }
      })
    )
    // 背景：Obsidian 的嵌套工作区（如拆分窗口或某些插件创建的容器）可能导致 WorkspaceLeaf 的根节点获取异常。原始 getRoot() 可能返回非最顶层的容器
    /*
      修复逻辑：1.先调用原始 getRoot() 获取当前层级的根节点 top
              2.检查 top.getRoot 方法是否与当前实例的 getRoot 相同：
                2.1：如果相同，说明 top 已是最顶层根节点，直接返回
                2.2：如果不同，说明 top 仍是某个子容器，需递归调用 top.getRoot() 继续向上查找
    */
    // 如果该插件已存在，则跳过补丁（因为 hover-editor 已实现相同功能），避免冲突
    if (!this.app.plugins?.plugins?.['obsidian-hover-editor']) {
      this.register(
        around(WorkspaceLeaf.prototype, {
          getRoot(old) {
            return function() {
              const top = old.call(this)
              return top.getRoot === this.getRoot ? top : top.getRoot()
            }
          }
        })
      )
    }
    // 通过修改 Obsidian 核心的 WorkspaceLeaf.setViewState 方法，强制将特定文件定向到自定义视图
    const self = this
    this.register(
      around(WorkspaceLeaf.prototype, {
        detach(next) {
          return function() {
            return next.apply(this)
          }
        },
        setViewState(next) {
          return function(state, ...rest) {
            // 手动将smm视图切换为md视图不用拦截、md的预览和源码视图也不拦截
            if (
              state.state?.isSwitchToMarkdownViewFromSmmView ||
              ['preview', 'source'].includes(state.state?.mode)
            ) {
              return next.apply(this, [state, ...rest])
            }
            if (
              self._loaded &&
              state.type === 'markdown' &&
              state.state?.file
            ) {
              const curFilePath = state.state.file
              if (self._isSmmFile(curFilePath)) {
                let isStop = false
                if (rest && rest[0]) {
                  if (rest[0].subpath) {
                    self.fileToSubpathMap[curFilePath] = rest[0].subpath
                  } else if (
                    rest[0].match &&
                    rest[0].match.matches.length > 0
                  ) {
                    const uid = getUidFromSource(rest[0])
                    if (uid) {
                      // 从当前已经打开的视图中查找是否已存在
                      const existLeaf = this.app.workspace
                        .getLeavesOfType(SMM_VIEW_TYPE)
                        .find(leaf => {
                          const file = leaf.view.file
                            ? leaf.view.file.path
                            : leaf.view.state.file
                          return file && file === curFilePath
                        })
                      if (existLeaf) {
                        if (
                          existLeaf.view instanceof SmmEditView &&
                          existLeaf.view.jumpToNodeByUid
                        ) {
                          existLeaf.view.jumpToNodeByUid(uid)
                        } else {
                          self.fileToSubpathMap[curFilePath] = uid
                        }
                        this.app.workspace.setActiveLeaf(existLeaf)
                        isStop = true
                      } else {
                        self.fileToSubpathMap[curFilePath] = uid
                      }
                    }
                  }
                }
                if (isStop) return
                const newState = {
                  ...state,
                  type: SMM_VIEW_TYPE
                }
                return next.apply(this, [newState, ...rest])
              }
            }
            return next.apply(this, [state, ...rest])
          }
        }
      })
    )
    // 在md视图下的smm文件右上角菜单增加切换为思维导图菜单
    this.menus.addMarkdownFileMenus()
  }

  // 切换到思维导图视图
  _switchToSmmAfterLoad() {
    this.app.workspace.onLayoutReady(async () => {
      let leaf
      const markdownLeaf = this.app.workspace.getLeavesOfType('markdown')
      for (leaf of markdownLeaf) {
        if (
          leaf.view instanceof MarkdownView &&
          leaf.view.file &&
          this._isSmmFile(leaf.view.file)
        ) {
          this._setSmmView(leaf)
        }
      }
    })
  }

  // 设置思维导图视图状态
  async _setSmmView(leaf) {
    await leaf.setViewState({
      type: SMM_VIEW_TYPE,
      state: leaf.view.getState(),
      popstate: true
    })
  }

  // 获取当前激活的思维导图视图
  _getActiveSmmView() {
    return this.app.workspace.getActiveViewOfType(SmmEditView, IGNORE_CHECK_SMM)
  }

  // 判断文件是否为思维导图
  _isSmmFile(file) {
    if (!file) {
      return false
    }
    const isString = typeof file === 'string'
    // 统一获取文件路径
    const filePath = isString ? file : file.path
    if (filePath.endsWith('.smm.md')) {
      return true
    }
    let cache = null
    if (isString) {
      cache = this.app.metadataCache.getCache(file)
    } else {
      if (file.extension === SMM_VIEW_TYPE) {
        return true
      }
      cache = this.app.metadataCache.getFileCache(file)
    }
    if (cache?.frontmatter?.tags?.contains(SMM_TAG)) {
      return true
    }
    if (/\.smm.*\.md$/.test(filePath)) {
      return true
    }
    return false
  }

  // 创建状态栏子元素
  _initStatusBar() {
    // 创建状态栏主元素
    this.statusBarItem = this.addStatusBarItem()
    this.statusBarItem.empty()
    this.statusBarItem.style.display = 'none' // 默认隐藏

    // 创建专门用于显示 smm 文件状态的子元素
    this.smmFileStatus = this.statusBarItem.createEl('div', {
      cls: 'smm-file-status'
    })

    // 监听文件打开和视图变化
    this.registerEvent(
      this.app.workspace.on('file-open', this._updateStatusBar.bind(this))
    )

    this.registerEvent(
      this.app.workspace.on(
        'active-leaf-change',
        this._updateStatusBar.bind(this)
      )
    )

    // 初始更新
    this._updateStatusBar()
  }

  // 更新状态栏显示
  _updateStatusBar() {
    const activeFile = this.app.workspace.getActiveFile()

    // 检查是否是 smm 文件
    const isSmmFile = activeFile && this._isSmmFile(activeFile)

    // 获取状态栏容器
    const statusBar = this.app.statusBar.containerEl

    // 更新状态栏可见性
    if (isSmmFile) {
      this.statusBarItem.style.display = 'block'
      // 添加隐藏默认状态栏的类
      statusBar.classList.add('smm-file-status-active')
    } else {
      this.statusBarItem.style.display = 'none'
      // 移除隐藏类
      statusBar.classList.remove('smm-file-status-active')
    }
  }

  // 确保目录存在
  async _ensureDirectoryExists(dirPath) {
    if (!dirPath) return
    const { vault } = this.app
    // 检查目录是否存在
    // getFolderByPath无法检查到隐藏文件夹
    const exist = await vault.exists(dirPath)
    if (!exist) {
      // 递归创建目录
      await vault.createFolder(dirPath)
    }
  }

  // 多语言
  _t(val) {
    return i18n.t(val)
  }

  // 获取生成默认思维导图数据的配置
  _getCreateDefaultMindMapOptions() {
    const { defaultTheme, defaultThemeDark, defaultLayout } = this.settings
    return {
      theme: this._getObIsDark() ? defaultThemeDark : defaultTheme,
      layout: defaultLayout,
      rootNodeDefaultText: this._t('common.rootNodeDefaultText'),
      secondNodeDefaultText: this._t('common.secondNodeDefaultText'),
      branchNodeDefaultText: this._t('common.branchNodeDefaultText')
    }
  }

  // 根据参数生成默认思维导图数据
  _createDefaultMindMapData() {
    return createDefaultMindMapData(
      this._getCreateDefaultMindMapOptions(),
      false
    )
  }

  // 获取激活文件的目录
  _getActiveFileDirectory() {
    // 获取当前激活文件
    const activeFile = this.app.workspace.getActiveFile()
    if (!activeFile) {
      return null
    }
    // 检查是否为文件（排除文件夹）
    if (activeFile instanceof TFolder) {
      return null
    }
    // 获取父目录路径
    const parent = activeFile.parent
    if (!parent) {
      return null
    }
    // 返回目录路径（Vault 相对路径）
    return parent.path.replace(/\/$/, '')
  }

  // 获取ob是否是暗黑模式
  _getObIsDark() {
    return document.body.classList.contains('theme-dark')
  }

  // md 转思维导图数据
  async _mdToMindmapData(md) {
    // 过滤掉开头的 YAML front matter
    const frontMatterRegex = /^---\n[\s\S]*?\n---\n/
    const cleanedMd = md.replace(frontMatterRegex, '')
    if (!cleanedMd.trim()) {
      return null
    }
    // 解析 Markdown 数据
    const data = await markdown.transformMarkdownTo(cleanedMd, false)
    if (!data) {
      return null
    }
    const { defaultTheme, defaultThemeDark, defaultLayout } = this.settings
    return {
      root: data,
      layout: defaultLayout,
      theme: {
        template: this._getObIsDark() ? defaultThemeDark : defaultTheme,
        config: {}
      }
    }
  }

  // 更新备注字体大小
  _updateNoteFontSize(fontSize) {
    // 通知所有打开的思维导图视图更新字体大小
    this.app.workspace.getLeavesOfType(SMM_VIEW_TYPE).forEach(leaf => {
      if (leaf.view && leaf.view.updateNoteFontSize) {
        leaf.view.updateNoteFontSize(fontSize)
      }
    })
  }

  // 卸载时清理
  onunload() {
    logger.info('SimpleMindMap 插件开始卸载');

    this.app.workspace.detachLeavesOfType(SMM_VIEW_TYPE)
    this.markdownPostProcessor.destroy()
    // 清理状态栏
    this.statusBarItem?.remove()
    this.commands.clear()

    logger.info('SimpleMindMap 插件卸载完成');
  }
}
