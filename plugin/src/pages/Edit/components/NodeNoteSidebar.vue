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
      activeSidebar: state => state.activeSidebar
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
      })
    },

    // 备注内容双击事件
    onNoteContentDblclick() {
      if (this.node) {
        this.$root.$bus.$emit('showNodeNote', this.node)
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

  // 调整Markdown内容的字体大小
  :deep(.toastui-editor-contents) {
    font-size: 16px;

    p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, code, table {
      font-size: 16px;
    }

    h1 { font-size: 24px; }
    h2 { font-size: 22px; }
    h3 { font-size: 20px; }
    h4 { font-size: 18px; }
    h5 { font-size: 17px; }
    h6 { font-size: 16px; }
  }
}
</style>
