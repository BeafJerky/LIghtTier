/**
 * 应用入口
 *
 * 装配顺序：i18n → store → 全局组件 → Element Plus → 路由 → mount；
 * 挂载后异步执行不阻塞启动的后台任务（日志清理、出口路由残留清理、启动设置）。
 */
import 'vue/jsx'

// 引入windi css
import '@/plugins/unocss'

// 初始化多语言
import { setupI18n } from '@/plugins/vueI18n'

// 引入状态管理
import { setupStore } from '@/store'

// 全局组件
import { setupGlobCom } from '@/components'

// 引入element-plus
import { setupElementPlus } from '@/plugins/elementPlus'

// 引入全局样式
import '@/styles/index.less'

// 引入主题系统
import '@/styles/theme.css'

// 引入动画
import '@/plugins/animate.css'

// 路由
import { setupRouter } from './router'

import { createApp } from 'vue'

import App from './App.vue'

import { clearLogs } from './utils/fileUtil'
import { cleanExitRouteResidue } from './utils/routeUtil'
import { isAndroid } from './utils/platformUtil'
import { t } from './utils/i18nUtil'
import { useStorage } from '@/hooks/web/useStorage'
import { useEasyTierStore } from '@/store/modules/easytier'
import { ElNotification } from 'element-plus'

// 引入 Tauri API
import { getCurrentWindow } from '@tauri-apps/api/window'

// 创建应用实例并完成全部装配
const setupAll = async () => {
  const app = createApp(App)

  await setupI18n(app)

  setupStore(app)

  const easyTierStore = useEasyTierStore()

  setupGlobCom(app)

  setupElementPlus(app)

  setupRouter(app)

  app.mount('#app')

  // 启动后台任务（不阻塞启动）
  Promise.all([
    // 清理日志（不阻塞主流程）
    clearLogs().catch((err) => console.warn('清理日志失败:', err)),

    // 启动补清：上次异常退出残留的出口节点路由（崩溃/强杀不留残）
    (async () => {
      const res = await cleanExitRouteResidue()
      if (!res.skipped && res.cleared > 0) {
        ElNotification({
          title: t('newCommon.exitRouteResidueAutoCleared'),
          message: t('newConfig.exitRouteResidueCleared', { n: res.cleared }),
          type: 'warning',
          duration: 5000
        })
      }
    })(),

    // 检查启动设置
    (async () => {
      const { getStorage } = useStorage('localStorage')

      // 1. 启动后最小化（桌面专属）
      if (getStorage('settings.minimizeOnStart') === 'true' && !isAndroid()) {
        setTimeout(() => {
          getCurrentWindow()
            .hide()
            .catch((err) => console.warn('隐藏窗口失败:', err))
        }, 100)
      }

      // 2. 启动后自动运行网络
      if (getStorage('settings.autoRunNetwork') === 'true') {
        setTimeout(() => {
          easyTierStore.autorun().catch((err) => console.warn('自动运行失败:', err))
        }, 500)
      }
    })()
  ]).catch((err) => console.error('后台任务执行失败:', err))
}

setupAll().catch((err) => {
  console.error('应用启动失败:', err)
  alert('应用启动失败，请查看日志文件或联系开发者')
})
