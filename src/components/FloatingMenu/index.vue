<template>
  <div class="fab-root" ref="fabRoot">
    <!-- 展开菜单 -->
    <Transition name="fab-menu">
      <div v-if="menuOpen" class="fab-menu">
        <!-- 刷新配置 -->
        <button class="fab-menu-item" @click="handleRefresh">
          <svg
            class="fab-menu-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>{{ t('newCommon.refreshConfig') }}</span>
        </button>
      </div>
    </Transition>

    <!-- 主按钮 -->
    <button
      class="fab-trigger"
      :class="{ active: menuOpen }"
      @click.stop="menuOpen = !menuOpen"
      :title="t('newCommon.quickActions')"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * FloatingMenu — 全局悬浮快捷菜单（FAB）
 *
 * 右下角悬浮主按钮，展开后提供“刷新配置”快捷操作：并发重载普通配置与 Web 配置
 * 文件列表，再触发当前页运行时状态刷新；菜单展开时点击组件外部自动收起，
 * 组件卸载时移除全局点击监听。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEasyTierStore } from '@/store/modules/easytier'

defineOptions({ name: 'FloatingMenu' })

const { t } = useI18n()
const easyTierStore = useEasyTierStore()

const menuOpen = ref(false)
const fabRoot = ref<HTMLElement | null>(null)

// 刷新配置（重新加载所有配置文件 + 刷新当前页运行时状态）
const handleRefresh = async () => {
  menuOpen.value = false
  await Promise.all([easyTierStore.loadConfigFiles(), easyTierStore.loadWebConfigFiles()])
  easyTierStore.triggerPageRefresh()
}

// 点击外部关闭菜单
const handleOutsideClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (fabRoot.value && !fabRoot.value.contains(target)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  // 全局监听点击，配合 contains 判断实现“点击外部收起”
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  // 卸载时移除监听，避免组件销毁后残留引用
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.fab-root {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* 主按钮 */
.fab-trigger {
  display: flex;
  width: 40px;
  height: 40px;
  color: var(--theme-text-secondary);
  cursor: pointer;
  background: var(--theme-bg-card);
  border: 1.5px solid var(--theme-border-light);
  border-radius: var(--theme-radius-round, 50%);
  opacity: 0.3;
  box-shadow: var(--theme-shadow-sm);
  transition: all 0.3s var(--theme-ease-spring, ease);
  align-items: center;
  justify-content: center;
}

.fab-root:hover .fab-trigger,
.fab-trigger.active {
  opacity: 1;
}

.fab-trigger:hover {
  color: var(--theme-accent-primary);
  border-color: var(--theme-accent-primary);
  transform: scale(1.08);
  box-shadow: var(--theme-shadow-md);
}

.fab-trigger.active {
  color: var(--theme-accent-primary);
  background: var(--theme-bg-hover);
  border-color: var(--theme-accent-primary);
}

/* 菜单面板 */
.fab-menu {
  display: flex;
  min-width: 160px;
  padding: 4px;
  background: var(--theme-bg-card);
  border: 1.5px solid var(--theme-border);
  border-radius: var(--theme-radius-lg);
  box-shadow: var(--theme-shadow-md);
  flex-direction: column;
  gap: 2px;
}

/* 菜单项 */
.fab-menu-item {
  display: flex;
  width: 100%;
  padding: 8px 14px;
  font-family: var(--theme-font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--theme-text-secondary);
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--theme-radius-sm);
  transition: all 0.15s;
  align-items: center;
  gap: 8px;
}

.fab-menu-item:hover {
  color: var(--theme-text-primary);
  background: var(--theme-bg-hover);
}

.fab-menu-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.fab-menu-item:hover .fab-menu-icon {
  color: var(--theme-accent-primary);
  opacity: 1;
}

/* 菜单动画 */
.fab-menu-enter-active {
  animation: fabMenuIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-menu-leave-active {
  animation: fabMenuIn 0.15s ease reverse;
}

@keyframes fabMenuIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
