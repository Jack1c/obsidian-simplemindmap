<template>
  <Sidebar ref="sidebar" :title="$t('note.title')">
    <div class="noteContentWrap" ref="noteContentWrap" @dblclick="onNoteContentDblclick"></div>
  </Sidebar>
</template>

<script>
import Sidebar from './Sidebar.vue'
import { mapState, mapMutations } from 'vuex'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import { toastUiEditorLangMap } from '@/config/constant'
import noteMixin from '@/mixins/note'

export default {
  mixins: [noteMixin],
  components: {
    Sidebar
  },
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      editor: null,
      node: null,
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark,
      activeSidebar: state => state.activeSidebar,
      noteFontSize: state => state.noteFontSize
    })
  },
  watch: {
    activeSidebar(val) {
      if (val === 'noteSidebar') {
        this.$refs.sidebar.show = true
      } else {
        this.$refs.sidebar.show = false
        this.editor = null
      }
    },
    noteFontSize() {
      this.updateNoteFontSize()
    }
  },
  created() {
    this.$root.$bus.$on('node_active', this.onNodeActive)
    this.mindMap.on('node_note_click', this.onNodeNoteClick)
  },
  beforeDestroy() {
    this.$root.$bus.$off('node_active', this.onNodeActive)
    this.mindMap.off('node_note_click', this.onNodeNoteClick)
  },
  methods: {
    ...mapMutations(['setActiveSidebar']),

    onNodeActive(...args) {
      // 注释掉自动关闭逻辑，让侧边栏只在点击叉号时才关闭
      // if (this.activeSidebar !== 'noteSidebar') {
      //   return
      // }
      // const nodes = [...args[1]]
      // if (nodes.length > 0) {
      //   if (nodes[0] !== this.node) {
      //     this.setActiveSidebar(null)
      //   }
      // } else {
      //   this.setActiveSidebar(null)
      // }
    },

    // 初始化编辑器
    initEditor() {
      if (!this.editor) {
        this.editor = new Viewer({
          el: this.$refs.noteContentWrap,
          theme: this.isDark ? 'dark' : 'light',
          language:
            toastUiEditorLangMap[this.$i18n.locale] || toastUiEditorLangMap.en
        })
      }
    },

    onNodeNoteClick(node) {
      this.node = node
      this.setActiveSidebar('noteSidebar')
      this.$nextTick(() => {
        this.initEditor()
        this.editor.setMarkdown(node.getData('note'))
        this.fixNoteImg(
          Array.from(this.$refs.noteContentWrap.querySelectorAll('img'))
        )
        // 应用当前字体大小
        this.updateNoteFontSize()
      })
    },

    // 备注内容双击事件
    onNoteContentDblclick() {
      if (this.node) {
        this.$root.$bus.$emit('showNodeNote', this.node)
      }
    },

    // 更新备注字体大小
    updateNoteFontSize() {
      if (this.$refs.noteContentWrap) {
        // 动态更新样式
        const baseSize = this.noteFontSize
        const editorContents = this.$refs.noteContentWrap.querySelector('.toastui-editor-contents')
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
    }
  }
}
</script>

<style lang="less" scoped>
.noteContentWrap {
  padding: 12px;
  user-select: text;
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }

  :deep(.sidebarContainer.isDark) & {
    &:hover {
      background-color: rgba(255, 255, 255, 0.02);
    }
  }

  // 字体大小由JavaScript动态设置
  :deep(.toastui-editor-contents) {
    // 字体大小将在updateNoteFontSize方法中动态设置
  }
}
</style>
