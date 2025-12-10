<template>
  <div
    class="sidebarContainer"
    :class="{ show: show, isDark: isDark }"
    :style="{
      zIndex: zIndex,
      width: sidebarWidth + 'px',
      right: show ? '0' : '-' + sidebarWidth + 'px'
    }"
  >
    <div class="rightAction">
      <slot name="rightAction"></slot>
    </div>
    <span class="closeBtn el-icon-close" @click="close"></span>
    <div class="sidebarHeader" v-if="title">
      {{ title }}
    </div>
    <div class="sidebarContent smmCustomScrollbar" ref="sidebarContent">
      <slot v-if="show"></slot>
    </div>
    <!-- 调整大小的手柄 -->
    <div
      class="resize-handle"
      @mousedown="startResize"
      @touchstart="startResize"
    ></div>
  </div>
</template>

<script>
import { store } from '@/config'
import { mapState, mapMutations } from 'vuex'

// 侧边栏容器
export default {
  props: {
    title: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      show: false,
      zIndex: 0,
      sidebarWidth: 300, // 默认宽度
      isResizing: false,
      startX: 0,
      startWidth: 0
    }
  },
  computed: {
    ...mapState({
      isDark: state => state.localConfig.isDark
    })
  },
  watch: {
    show(val, oldVal) {
      if (val && !oldVal) {
        this.zIndex = store.sidebarZIndex++
      }
    }
  },
  created() {
    this.$root.$bus.$on('closeSideBar', this.handleCloseSidebar)
  },
  beforeDestroy() {
    this.$root.$bus.$off('closeSideBar', this.handleCloseSidebar)
  },
  methods: {
    ...mapMutations(['setActiveSidebar']),

    handleCloseSidebar() {
      this.close()
    },

    close() {
      this.show = false
      this.setActiveSidebar(null)
    },

    getEl() {
      return this.$refs.sidebarContent
    },

    // 开始调整大小
    startResize(e) {
      this.isResizing = true
      this.startX = e.clientX || e.touches[0].clientX
      this.startWidth = this.sidebarWidth

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

      const clientX = e.clientX || (e.touches && e.touches[0].clientX)
      if (!clientX) return

      const deltaX = this.startX - clientX
      let newWidth = this.startWidth + deltaX

      // 限制最小和最大宽度
      newWidth = Math.max(200, Math.min(800, newWidth))
      this.sidebarWidth = newWidth

      e.preventDefault()
    },

    // 停止调整大小
    stopResize() {
      this.isResizing = false

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
.sidebarContainer {
  position: absolute;
  top: 110px;
  bottom: 27px;
  background-color: #fff;
  border-left: 1px solid #e8e8e8;
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  display: flex;
  flex-direction: column;
  transition: right 0.3s;
  overflow: hidden;
  user-select: auto;

  &.isDark {
    background-color: #262a2e;
    border-left-color: hsla(0, 0%, 100%, 0.1);

    .sidebarHeader {
      border-bottom-color: hsla(0, 0%, 100%, 0.1);
      color: #fff;
    }

    .closeBtn {
      color: #fff;
    }
  }
  
  .rightAction {
    height: 44px;
    position: absolute;
    top: 0;
    right: 50px;
    display: flex;
    align-items: center;
  }

  .closeBtn {
    position: absolute;
    right: 20px;
    top: 12px;
    font-size: 20px;
    cursor: pointer;
  }

  .sidebarHeader {
    width: 100%;
    height: 44px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 0;
    flex-shrink: 0;
  }

  .sidebarContent {
    width: 100%;
    height: 100%;
    overflow: auto;
    user-select: text;
  }

  .resize-handle {
    position: absolute;
    left: -4px;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: col-resize;
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
