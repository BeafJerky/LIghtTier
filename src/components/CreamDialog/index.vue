<template>
  <Teleport to="body" :disabled="inline">
    <Transition name="cd" :css="!inline">
      <div
        v-if="visible"
        ref="overlayRef"
        class="cd-overlay"
        :class="{ 'cd-overlay-inline': inline, 'cd-overlay-sheet': sheetMode }"
        @click.self="handleOverlayClick"
        @keydown.escape="handleClose"
        tabindex="-1"
      >
        <div
          class="cd-dialog"
          :class="{ 'cd-dialog-inline': inline, 'cd-dialog-sheet': sheetMode }"
          :style="
            inline || sheetMode
              ? undefined
              : { width: typeof width === 'number' ? width + 'px' : width }
          "
          :role="inline ? undefined : 'dialog'"
          :aria-modal="inline ? undefined : 'true'"
          :aria-label="inline ? undefined : title"
        >
          <!-- 标题栏（内联模式由所在页面承载标题与返回，不渲染） -->
          <div v-if="!inline" class="cd-header">
            <span class="cd-title">{{ title }}</span>
            <button class="cd-close" @click="handleClose" title="关闭">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="cd-body"><slot></slot></div>

          <!-- 底部 -->
          <div v-if="$slots.footer" class="cd-footer"><slot name="footer"></slot></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
/**
 * CreamDialog — 通用弹窗组件（桌面居中弹窗 / Android 底部动作面板 / 内联卡片三形态）
 *
 * 形态切换：
 * - 桌面：Teleport 到 body + 半透明遮罩 + 居中卡片，带 role="dialog" / aria-modal 语义；
 * - Android（非内联）：呈现为底部动作面板，打开时向 history 注入同 URL 条目，
 *   物理返回键优先关闭面板而非离开页面（由下方模块级共享栈协调多面板嵌套）；
 * - 内联模式（inline）：不渲染 Teleport / 遮罩 / 标题栏，作为页面级卡片嵌入文档流
 *   （移动端二级页面用，标题与返回由所在页面承载）。
 *
 * 交互：遮罩点击（closeOnOverlay）与 Esc 键均可关闭（内联模式除外）；
 * 顶部/底部留白叠加 --lt-safe-area-* 安全区变量（桌面端为 0）。
 */
// Android 底部动作面板：模块级共享的 history 注入栈（物理返回键仅关闭最顶层面板）
interface SheetHistoryEntry {
  isPushed: () => boolean
  close: () => void
}
const sheetStack: SheetHistoryEntry[] = []
// 面板经由界面按钮关闭时自行弹出历史条目，标记跳过随之而来的 popstate
let sheetPopping = false

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (sheetPopping) {
      sheetPopping = false
      return
    }
    const top = sheetStack[sheetStack.length - 1]
    if (top?.isPushed()) top.close()
  })
}
</script>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch, nextTick } from 'vue'
import { isAndroid } from '@/utils/platformUtil'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    width?: string | number
    closeOnOverlay?: boolean
    // 内联模式：不渲染 Teleport 遮罩与标题栏，作为页面级卡片嵌入文档流（移动端二级页面用）
    inline?: boolean
  }>(),
  {
    title: '',
    width: 600,
    closeOnOverlay: true,
    inline: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
}>()

// 内部可见态：与 v-model 双向同步（本地先变更，再经 watch 回传父组件）
const visible = ref(props.modelValue)
const overlayRef = ref<HTMLElement>()
watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
  }
)
watch(visible, (v) => {
  emit('update:modelValue', v)
  // 桌面弹窗打开后聚焦遮罩层，保证 Esc 键关闭可用
  if (v && !props.inline) nextTick(() => overlayRef.value?.focus())
})

const handleOverlayClick = () => {
  // 内联模式无遮罩层，点击空白不触发关闭（避免页面留白区域误关）
  if (props.closeOnOverlay && !props.inline) handleClose()
}

// 关闭弹窗：仅变更内部态，v-model 回传与 Android history 条目回收均由 watch 统一处理
const handleClose = () => {
  visible.value = false
}

// Android：非内联弹窗呈现为底部动作面板（贴合移动端设计语言）
const isAndroidPlatform = isAndroid()
const sheetMode = computed(() => isAndroidPlatform && !props.inline)

let sheetPushed = false
const dropSheetEntry = () => {
  const i = sheetStack.indexOf(sheetEntry)
  if (i >= 0) sheetStack.splice(i, 1)
}
const sheetEntry: SheetHistoryEntry = {
  isPushed: () => sheetPushed,
  close: () => {
    // 物理返回键消费：历史条目已被系统弹出，无需再 back()
    sheetPushed = false
    dropSheetEntry()
    visible.value = false
  }
}

// 面板打开时向 history 注入同 URL 条目：返回键优先关闭面板而不是离开页面
watch(visible, (v) => {
  if (!sheetMode.value) return
  if (v && !sheetPushed) {
    sheetPushed = true
    sheetStack.push(sheetEntry)
    window.history.pushState({ ...(window.history.state || {}), ltSheet: true }, '')
  } else if (!v && sheetPushed) {
    // 界面内关闭（按钮/遮罩）：回收注入的历史条目
    sheetPushed = false
    dropSheetEntry()
    sheetPopping = true
    window.history.back()
  }
})

// 卸载兜底：面板未关闭即随页面卸载时回收历史条目
onUnmounted(() => {
  if (!sheetPushed) return
  sheetPushed = false
  dropSheetEntry()
  sheetPopping = true
  window.history.back()
})
</script>

<style scoped>
.cd-overlay {
  position: fixed;
  z-index: 2000;
  display: flex;

  /* 顶部留白叠加 Android 状态栏安全区（桌面端变量为 0） */
  padding-top: calc(8vh + var(--lt-safe-area-top, 0px));
  overflow-y: auto;
  background: var(--el-overlay-color, rgb(0 0 0 / 50%));
  inset: 0;
  align-items: flex-start;
  justify-content: center;
}

.cd-dialog {
  display: flex;
  max-height: 80vh;
  min-height: 0;

  /* 底部留白叠加手势导航条安全区（桌面端变量为 0） */
  margin-bottom: calc(40px + var(--lt-safe-area-bottom, 0px));
  background: var(--theme-bg-card, #fff);
  border-radius: var(--theme-radius-xl, 18px);
  box-shadow: var(--theme-shadow-md, 0 20px 60px rgb(0 0 0 / 12%));
  flex-direction: column;
}

.cd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  flex-shrink: 0;
}

.cd-title {
  font-family: var(--theme-font-display, 'Quicksand', sans-serif);
  font-size: 17px;
  font-weight: 600;
  color: var(--theme-text-primary, #4a3728);
}

.cd-close {
  display: flex;
  width: 28px;
  height: 28px;
  color: var(--theme-text-muted, #c8bdb2);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--theme-radius-round, 50%);
  transition: all 0.2s;
  align-items: center;
  justify-content: center;
}

.cd-close:hover {
  color: var(--theme-accent-primary, #e8a0a0);
  background: var(--theme-bg-hover, rgb(232 160 160 / 6%));
}

.cd-body {
  display: flex;
  height: 0;
  min-height: 0;
  padding: 20px 28px 20px 24px;
  overflow-y: auto;
  flex: 1;
  flex-direction: column;
}

.cd-body::-webkit-scrollbar {
  width: 4px;
}

.cd-body::-webkit-scrollbar-track {
  background: transparent;
}

.cd-body::-webkit-scrollbar-thumb {
  background: var(--theme-border, #ede4db);
  border-radius: 10px;
}

.cd-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--theme-border-light, #f5ede6);
  flex-shrink: 0;
}

/* 动画 */
.cd-enter-active {
  transition: all 0.3s var(--theme-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
}

.cd-leave-active {
  transition: all 0.2s ease;
}

.cd-enter-from {
  opacity: 0;
}

.cd-enter-from .cd-dialog {
  transform: translateY(20px) scale(0.97);
}

.cd-leave-to {
  opacity: 0;
}

.cd-leave-to .cd-dialog {
  transform: translateY(-10px) scale(0.97);
}

/* 移动端（含 Android）：弹窗收窄为近全屏并适配系统栏安全区 */
@media (width <= 640px) {
  .cd-overlay {
    padding-top: calc(16px + var(--lt-safe-area-top, 0px));
    padding-bottom: calc(16px + var(--lt-safe-area-bottom, 0px));
  }

  .cd-dialog {
    /* 约束内联 width（如 800px）不超过视口 */
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - var(--lt-safe-area-top, 0px) - var(--lt-safe-area-bottom, 0px) - 48px);
    margin-bottom: 0;
  }
}

/* 内联模式（移动端二级页面）：去遮罩/去 Teleport，作为页面级卡片占满父容器 */
.cd-overlay-inline {
  position: static;
  display: block;
  height: 100%;
  padding: 0;
  overflow: visible;
  background: transparent;
}

.cd-dialog-inline {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: none;
  margin-bottom: 0;
  border: 1px solid var(--theme-border-light, #f5ede6);
  box-shadow: none;
}

/* Android 端（cd-*-sheet）：非内联弹窗呈现为底部动作面板 */
.cd-overlay-sheet {
  align-items: flex-end;
  padding: 0;
}

.cd-dialog-sheet {
  /* 覆盖 .cd-dialog 基础宽度与 640px 媒体查询的视口约束 */
  width: 100%;
  max-width: 100%;
  max-height: calc(100vh - var(--lt-safe-area-top, 0px) - 24px);

  /* 底部内边距承载手势导航条安全区 */
  padding-bottom: var(--lt-safe-area-bottom, 0);
  margin-bottom: 0;
  border-radius: var(--theme-radius-xl, 18px) var(--theme-radius-xl, 18px) 0 0;
}

.cd-enter-from .cd-dialog-sheet {
  transform: translateY(100%);
}

.cd-leave-to .cd-dialog-sheet {
  transform: translateY(100%);
}
</style>
