import manifestJson from '../../manifest.json'
import { Modal } from 'obsidian'

//  极简的深拷贝
export const simpleDeepClone = data => {
  try {
    return JSON.parse(JSON.stringify(data))
  } catch (error) {
    return null
  }
}

export const generateRandomString = (
  length = 12,
  charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
) => {
  // 参数验证
  if (typeof length !== 'number' || length <= 0) {
    throw new Error('长度必须是正整数')
  }
  if (typeof charSet !== 'string' || charSet.length === 0) {
    throw new Error('字符集不能为空')
  }

  // 使用加密安全的随机数生成器（如果可用）
  let randomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    randomValues = new Uint32Array(length)
    crypto.getRandomValues(randomValues)
  } else {
    randomValues = new Array(length)
      .fill(0)
      .map(() => Math.random() * 0x100000000)
  }

  // 生成随机字符串
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % charSet.length
    result += charSet.charAt(randomIndex)
  }

  return result
}

export const hideTargetMenu = (menu, text = '在新窗口中打开') => {
  // 隐藏特定默认菜单项
  menu.items.forEach(item => {
    // 通过菜单项标题或ID识别要隐藏的项
    if (item.title === text || item.dom?.innerText?.includes(text)) {
      item.dom.hide()
    }
  })
}

export const dataURItoBlob = dataURI => {
  const byteString = atob(dataURI.split(',')[1])
  const mimeString = dataURI
    .split(',')[0]
    .split(':')[1]
    .split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeString })
}

export const getUidFromSource = data => {
  const { matches, content } = data.match
  const total = content.length
  const last = matches[matches.length - 1]
  let index = last[1]
  let str = content[index]
  // 当检测到^时，记录后面的字符
  // 当检测到换行符时，跳出循环
  let uid = ''
  let isJoin = false
  while (true || index >= total) {
    if (isJoin && (str === '\n' || str === undefined)) {
      break
    }
    if (isJoin) {
      uid += str
    }
    if (str === '^') {
      isJoin = true
    }
    index++
    str = content[index]
  }
  return uid
}

export let versionUpdateCheckTimer = null
let versionUpdateChecked = false
export const checkVersion = async (
  callback = () => {},
  force = false,
  err = () => {}
) => {
  if (!force && versionUpdateChecked) {
    return
  }
  versionUpdateChecked = true
  try {
    const gitAPIrequest = async () => {
      return JSON.parse(
        await request({
          url: `https://api.github.com/repos/jack1c/obsidian-simplemindmap/releases?per_page=15&page=1`
        })
      )
    }
    const releases = (await gitAPIrequest())
      .filter(el => !el.draft && !el.prerelease)
      .map(el => {
        return {
          ...el,
          version: el.tag_name,
          published: new Date(el.published_at)
        }
      })
      .filter(el => el.version.match(/^\d+\.\d+\.\d+$/))
      .sort((el1, el2) => el2.published - el1.published)

    if (releases.length === 0) {
      callback()
      return
    }

    const latestRelease = releases[0]
    if (isVersionNewerThanOther(latestRelease.version, manifestJson.version)) {
      callback(latestRelease.version, latestRelease)
    } else {
      callback()
    }
  } catch (e) {
    console.error('检查更新失败', e)
    err(e)
  }
  versionUpdateCheckTimer = window.setTimeout(() => {
    versionUpdateChecked = false
    versionUpdateCheckTimer = null
  }, 28800000 * 3) // 24小时检查一次
}

export const isVersionNewerThanOther = (version, otherVersion) => {
  if (!version || !otherVersion) return true
  const v = version.match(/(\d*)\.(\d*)\.(\d*)/)
  const o = otherVersion.match(/(\d*)\.(\d*)\.(\d*)/)
  return Boolean(
    v &&
      v.length === 4 &&
      o &&
      o.length === 4 &&
      !(
        isNaN(parseInt(v[1])) ||
        isNaN(parseInt(v[2])) ||
        isNaN(parseInt(v[3]))
      ) &&
      !(
        isNaN(parseInt(o[1])) ||
        isNaN(parseInt(o[2])) ||
        isNaN(parseInt(o[3]))
      ) &&
      (parseInt(v[1]) > parseInt(o[1]) ||
        (parseInt(v[1]) >= parseInt(o[1]) && parseInt(v[2]) > parseInt(o[2])) ||
        (parseInt(v[1]) >= parseInt(o[1]) &&
          parseInt(v[2]) >= parseInt(o[2]) &&
          parseInt(v[3]) > parseInt(o[3])))
  )
}

/**
 * 安装插件更新
 * @param {Object} plugin - 插件实例
 * @param {Object} release - GitHub release 信息
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<boolean>} 更新是否成功
 */
export const installPluginUpdate = async (plugin, release, onProgress = () => {}) => {
  try {
    if (!plugin || !release || !release.assets) {
      throw new Error('无效的参数')
    }

    // 查找需要的文件
    const mainJsAsset = release.assets.find(asset => asset.name === 'main.js')
    const stylesCssAsset = release.assets.find(asset => asset.name === 'styles.css')
    const manifestJsonAsset = release.assets.find(asset => asset.name === 'manifest.json')

    if (!mainJsAsset || !stylesCssAsset || !manifestJsonAsset) {
      throw new Error('Release 中缺少必要的文件')
    }

    // 获取插件目录
    const pluginId = 'simple-mind-map'
    const pluginsDir = `${plugin.app.vault.configDir}/plugins`
    const pluginDir = `${pluginsDir}/${pluginId}`

    // 确保插件目录存在
    if (!await plugin.app.vault.adapter.exists(pluginDir)) {
      await plugin.app.vault.adapter.mkdir(pluginDir)
    }

    // 下载并保存文件
    const downloadAndSave = async (asset, filename) => {
      onProgress(`正在下载 ${filename}...`)
      const response = await request({
        url: asset.browser_download_url,
        method: 'GET'
      })

      const filePath = `${pluginDir}/${filename}`
      await plugin.app.vault.adapter.writeBinary(filePath, response)
      onProgress(`已保存 ${filename}`)
    }

    // 下载三个文件
    await downloadAndSave(mainJsAsset, 'main.js')
    await downloadAndSave(stylesCssAsset, 'styles.css')
    await downloadAndSave(manifestJsonAsset, 'manifest.json')

    onProgress('更新完成！文件已保存到插件目录。')
    return true
  } catch (error) {
    console.error('安装更新失败:', error)
    onProgress(`更新失败: ${error.message}`)
    return false
  }
}

/**
 * 显示更新对话框
 * @param {Object} plugin - 插件实例
 * @param {string} version - 新版本号
 * @param {Object} release - GitHub release 信息
 */
export const showUpdateDialog = (plugin, version, release) => {
  // 创建模态对话框
  const modal = new Modal(plugin.app)

  modal.setTitle(`发现新版本 ${version}`)

  // 创建内容容器
  const contentEl = modal.contentEl
  contentEl.createEl('p', {
    text: `当前版本: ${manifestJson.version}，发现新版本: ${version}`
  })

  contentEl.createEl('p', {
    text: '是否立即更新？更新后需要重启 Obsidian。'
  })

  // 更新按钮
  const updateButton = contentEl.createEl('button', {
    text: '立即更新',
    cls: 'mod-cta'
  })

  updateButton.addEventListener('click', async () => {
    updateButton.setText('更新中...')
    updateButton.disabled = true

    const progressEl = contentEl.createEl('p', {
      text: '开始下载更新...'
    })

    const result = await installPluginUpdate(plugin, release, (message) => {
      progressEl.setText(message)
    })

    if (result) {
      progressEl.setText('更新成功！您可以选择：')
      updateButton.remove()

      // 重新加载按钮
      const reloadButton = contentEl.createEl('button', {
        text: '立即重新加载插件',
        cls: 'mod-cta'
      })

      reloadButton.addEventListener('click', async () => {
        reloadButton.setText('重新加载中...')
        reloadButton.disabled = true

        try {
          // 尝试重新加载插件
          const pluginId = 'simple-mind-map'

          // 先禁用插件
          await plugin.app.plugins.disablePlugin(pluginId)
          progressEl.setText('插件已禁用，正在重新启用...')

          // 等待短暂时间确保禁用完成
          await new Promise(resolve => setTimeout(resolve, 1000))

          // 重新启用插件
          await plugin.app.plugins.enablePlugin(pluginId)

          progressEl.setText('插件重新加载成功！')
          reloadButton.remove()

          // 提示用户可能需要刷新视图
          contentEl.createEl('p', {
            text: '插件已重新加载。如果思维导图视图没有更新，请关闭并重新打开文件。',
            cls: 'mod-success'
          })

        } catch (reloadError) {
          console.error('重新加载插件失败:', reloadError)
          progressEl.setText(`重新加载失败: ${reloadError.message}`)
          reloadButton.setText('重试重新加载')
          reloadButton.disabled = false

          // 提供手动重新加载提示
          contentEl.createEl('p', {
            text: '请手动重启 Obsidian 或通过插件管理界面重新加载插件。',
            cls: 'mod-warning'
          })
        }
      })

      // 手动重启提示
      contentEl.createEl('p', {
        text: '或手动重启 Obsidian 使更改生效。',
        cls: 'mod'
      })
    } else {
      progressEl.setText('更新失败，请手动下载安装。')
      updateButton.setText('重试')
      updateButton.disabled = false
    }
  })

  // 取消按钮
  const cancelButton = contentEl.createEl('button', {
    text: '稍后更新',
    cls: 'mod'
  })

  cancelButton.addEventListener('click', () => {
    modal.close()
  })

  modal.open()
}
