<script setup lang="ts">
/**
 * Icon — 统一图标组件（基于 Iconify + Element Plus 容器）
 *
 * 用法：<Icon icon="clarity:dashboard-line" :size="18" hover-color="..." />。
 * 特点：尺寸/颜色透传到 SVG，hoverColor 通过 CSS v-bind 注入实现悬停变色。
 */
import { computed } from 'vue'
import { ElIcon } from 'element-plus'
import { Icon } from '@iconify/vue'

const props = withDefaults(
  defineProps<{
    // icon name（iconify 图标名，如 clarity:dashboard-line）
    icon: string
    // icon color
    color?: string
    // icon size
    size?: number
    // 悬停颜色
    hoverColor?: string
  }>(),
  { size: 16 }
)

const getIconifyStyle = computed(() => {
  return {
    fontSize: `${props.size}px`,
    color: props.color
  }
})
</script>

<template>
  <ElIcon :size="size" :color="color">
    <Icon :icon="icon" :style="getIconifyStyle" class="lt-icon" />
  </ElIcon>
</template>

<style lang="less" scoped>
.lt-icon {
  &:hover {
    // stylelint-disable-next-line
    color: v-bind(hoverColor) !important;
  }
}
</style>
