<template>
  <div class="nsv-page">
    <SettingsDialog v-model="visible" inline />
  </div>
</template>

<script setup lang="ts">
/** settings-view — 设置二级页面（Android 专属）：将 SettingsDialog 以 inline 卡片形式承载 */
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SettingsDialog from '@/components/SettingsDialog/index.vue'

defineOptions({ name: 'NewSettingsView' })

const router = useRouter()
// 先关后开：触发面板内部 watch(visible) 的初始化逻辑（版本/偏好加载，与点击入口打开弹窗时一致）
const visible = ref(false)
onMounted(() => {
  visible.value = true
})

// 面板请求关闭时 → 回退上一页；直达页面无历史时回退首页
watch(visible, (v) => {
  if (!v) {
    if (window.history.state?.back) router.back()
    else router.push('/new')
  }
})
</script>

<style scoped>
.nsv-page {
  height: 100%;
}
</style>
