<script setup lang="ts">
/**
 * ConfigGlobal — Element Plus 全局配置容器（应用根级包裹）
 *
 * 统一注入：组件尺寸、命名空间（elNamespace）、当前语言包与消息并发上限，
 * 并通过 provide('configGlobal') 向子组件共享配置；挂载时初始化 CSS 主题变量。
 */
import { provide, computed, onMounted } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { ComponentSize, ElConfigProvider } from 'element-plus'
import { useLocaleStore } from '@/store/modules/locale'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'

const { variables } = useDesign()

const appStore = useAppStore()

const props = defineProps({
  size: propTypes.oneOf<ComponentSize>(['default', 'small', 'large']).def('default')
})

provide('configGlobal', props)

// 初始化所有主题色
onMounted(() => {
  appStore.setCssVarTheme()
})

// 多语言相关
const localeStore = useLocaleStore()

const currentLocale = computed(() => localeStore.currentLocale)
</script>

<template>
  <ElConfigProvider
    :namespace="variables.elNamespace"
    :locale="currentLocale.elLocale"
    :message="{ max: 1 }"
    :size="size"
  >
    <slot></slot>
  </ElConfigProvider>
</template>
