<template>
  <el-dialog
    class="nodeNoteDialog smmElDialog"
    :title="$t('nodeNote.title')"
    :visible.sync="dialogVisible"
    :width="'70%'"
    :top="isMobile ? '20px' : '10vh'"
    :modal-append-to-body="false"
    :close-on-click-modal="false"
    :resize="true"
  >
    <div class="noteEditorContainer">
      <div class="noteEditor" ref="noteEditor" @keyup.stop @keydown.stop :style="{ height: editorHeight + 'px' }"></div>
      <div class="resize-handle" @mousedown="startResize" @touchstart="startResize"></div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="cancel" size="small" class="smmElButtonSmall">{{
        $t('dialog.cancel')
      }}</el-button>
      <el-button
        type="primary"
        @click="confirm"
        size="small"
        class="smmElButtonSmall"
        >{{ $t('dialog.confirm') }}</el-button
      >
    </span>
  </el-dialog>
</template>

<script>
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/i18n/zh-cn'
import '@toast-ui/editor/dist/i18n/zh-tw'
import { mapState } from 'vuex'
import { toastUiEditorLangMap } from '@/config/constant'
import { compressImage, isNormalUrl } from '@/utils'
import noteMixin from '@/mixins/note'

// 节点备注内容设置
export default {
  name: 'NodeNote',
  mixins: [noteMixin],
  data() {
    return {
      dialogVisible: false,
      note: '',
      activeNodes: [],
      editor: null,
      appointNode: null,
      editorHeight: 500, // 编辑器高度
      isResizing: false, // 是否正在调整大小
      startY: 0, // 调整大小开始时的Y坐标
      startHeight: 0 // 调整大小开始时的编辑器高度
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark,
      isMobile: state => state.isMobile,
      noteFontSize: state => state.noteFontSize
    })
  },
  watch: {
    dialogVisible(val, oldVal) {
      if (!val && oldVal) {
        this.$root.$bus.$emit('endTextEdit')
      }
    },
    noteFontSize() {
      this.updateNoteFontSize()
    }
  },
  created() {
    this.$root.$bus.$on('node_active', this.handleNodeActive)
    this.$root.$bus.$on('showNodeNote', this.handleShowNodeNote)
  },
  beforeDestroy() {
    this.$root.$bus.$off('node_active', this.handleNodeActive)
    this.$root.$bus.$off('showNodeNote', this.handleShowNodeNote)
  },
  methods: {
    handleNodeActive(...args) {
      this.activeNodes = [...args[1]]
      this.updateNoteInfo()
    },

    updateNoteInfo() {
      if (this.activeNodes.length > 0) {
        let firstNode = this.activeNodes[0]
        this.note = firstNode.getData('note') || ''
      } else {
        this.note = ''
      }
    },

    handleShowNodeNote(node) {
      if (this.activeNodes.length === 0 && !node) return
      this.$root.$bus.$emit('startTextEdit')
      if (node) {
        this.appointNode = node
        this.note = node.getData('note') || ''
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.initEditor()
      })
    },

    initEditor() {
      if (!this.editor) {
        this.editor = new Editor({
          el: this.$refs.noteEditor,
          height: this.editorHeight + 'px',
          minHeight: '200px',
          initialEditType: 'markdown',
          previewStyle: 'tab',
          hideModeSwitch: false,
          theme: this.isDark ? 'dark' : 'light',
          language:
            toastUiEditorLangMap[this.$i18n.locale] || toastUiEditorLangMap.en,
          customHTMLRenderer: {
            // 拦截图片渲染逻辑
            image: (node, { entering }) => {
              if (!entering) return null
              let url = node.destination || node.src
              // 自定义转换逻辑（例如添加前缀、替换域名）
              if (!isNormalUrl(url)) {
                url = this.$root.$obsidianAPI.getResourcePath(
                  decodeURIComponent(url)
                )
              }
              return {
                type: 'html',
                content: `<img data-url="${url}" />`
              }
            }
          },
          events: {
            change: () => {
              this.$nextTick(() => {
                const imgs = document.querySelectorAll(
                  '.toastui-editor-md-preview img'
                )
                const img2 = document.querySelectorAll(
                  '.toastui-editor-ww-container img'
                )
                this.fixNoteImg([...Array.from(imgs), ...Array.from(img2)])
              })
            }
          },
          hooks: {
            addImageBlobHook: async (file, callback) => {
              try {
                const {
                  compressImage: isCompress,
                  compressImageOptionsMaxWidth,
                  compressImageOptionsMaxHeight,
                  compressImageOptionsQuality
                } = this.$root.$obsidianAPI.getSettings()
                if (isCompress) {
                  file = await compressImage(file, {
                    exportType: 'file',
                    maxWidth: compressImageOptionsMaxWidth,
                    maxHeight: compressImageOptionsMaxHeight,
                    quality: compressImageOptionsQuality
                  })
                }
                const result = await this.$root.$obsidianAPI.saveFileToVault(
                  file
                )
                if (!result) {
                  throw new Error(this.$t('imageUpload.failTip'))
                }
                callback(result)
              } catch (error) {
                console.error('上传失败', error)
              }
            }
          }
        })
      }
      this.editor.setMarkdown(this.note)
      // 初始化后应用字体大小
      this.$nextTick(() => {
        this.updateNoteFontSize()
      })
    },

    cancel() {
      this.dialogVisible = false
      if (this.appointNode) {
        this.appointNode = null
        this.updateNoteInfo()
      }
    },

    confirm() {
      this.note = this.editor.getMarkdown()
      if (this.appointNode) {
        this.appointNode.setNote(this.note)
      } else {
        this.activeNodes.forEach(node => {
          node.setNote(this.note)
        })
      }

      this.cancel()
    },

    // 开始调整大小
    startResize(e) {
      this.isResizing = true
      this.startY = e.clientY || e.touches[0].clientY
      this.startHeight = this.editorHeight

      // 添加resizing类
      const handle = e.target
      handle.classList.add('resizing')

      // 添加全局事件监听
      document.addEventListener('mousemove', this.handleResize)
      document.addEventListener('touchmove', this.handleResize, { passive: false })
      document.addEventListener('mouseup', this.stopResize)
      document.addEventListener('touchend', this.stopResize)

      e.preventDefault()
    },

    // 处理调整大小
    handleResize(e) {
      if (!this.isResizing) return

      const clientY = e.clientY || (e.touches && e.touches[0].clientY)
      if (!clientY) return

      const deltaY = clientY - this.startY
      let newHeight = this.startHeight + deltaY

      // 限制最小和最大高度
      newHeight = Math.max(200, Math.min(800, newHeight))
      this.editorHeight = newHeight

      // 更新编辑器高度
      if (this.editor) {
        this.editor.height(newHeight + 'px')
      }

      e.preventDefault()
    },

    // 更新备注字体大小
    updateNoteFontSize() {
      if (this.editor && this.$refs.noteEditor) {
        const baseSize = this.noteFontSize
        // 获取编辑器内容容器
        const editorContents = this.$refs.noteEditor.querySelector('.toastui-editor-contents')
        if (editorContents) {
          editorContents.style.fontSize = `${baseSize}px`

          // 更新各级标题的字体大小
          const elements = editorContents.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, code, table')
          elements.forEach(el => {
            el.style.fontSize = `${baseSize}px`
          })

          // 标题相对大小
          const headings = editorContents.querySelectorAll('h1, h2, h3, h4, h5, h6')
          headings.forEach(el => {
            const tagName = el.tagName.toLowerCase()
            let size = baseSize
            switch(tagName) {
              case 'h1': size = baseSize * 1.5; break
              case 'h2': size = baseSize * 1.375; break
              case 'h3': size = baseSize * 1.25; break
              case 'h4': size = baseSize * 1.125; break
              case 'h5': size = baseSize * 1.0625; break
              case 'h6': size = baseSize; break
            }
            el.style.fontSize = `${size}px`
          })
        }
      }
    },

    // 停止调整大小
    stopResize() {
      this.isResizing = false

      // 移除resizing类
      const resizeHandles = document.querySelectorAll('.resize-handle')
      resizeHandles.forEach(handle => {
        handle.classList.remove('resizing')
      })

      // 移除全局事件监听
      document.removeEventListener('mousemove', this.handleResize)
      document.removeEventListener('touchmove', this.handleResize)
      document.removeEventListener('mouseup', this.stopResize)
      document.removeEventListener('touchend', this.stopResize)
    }
  }
}
</script>

<style lang="less" scoped>
.nodeNoteDialog {
  /deep/ .el-dialog {
    max-width: 90%;
    min-width: 300px;
    min-height: 200px;

    // 调整大小手柄样式
    &.is-dragging {
      user-select: none;
    }

    .el-dialog__header {
      cursor: move;
    }
  }

  .tip {
    margin-top: 5px;
    color: #dcdfe6;
  }

  // 编辑器容器样式
  .noteEditorContainer {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .noteEditor {
    width: 100%;
    height: 100%;
    min-height: 200px;
  }

  // 调整大小手柄
  .resize-handle {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -4px;
    height: 8px;
    cursor: ns-resize;
    z-index: 10;

    &:hover,
    &.resizing {
      background-color: rgba(66, 133, 244, 0.2);
    }

    &:active {
      background-color: rgba(66, 133, 244, 0.4);
    }
  }
}
</style>
