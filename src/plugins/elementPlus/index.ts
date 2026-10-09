import type { App } from 'vue'
import ElementPlus, { ClickOutside } from 'element-plus'

export const setupElementPlus = (app: App<Element>) => {
  // 注册所有 Element Plus 的全局组件，包括 ElMessage、ElLoading、ElNotification 等
  app.use(ElementPlus)
  // 注册指令，检测点击元素外部的事件
  app.directive('click-outside', ClickOutside)
  // 为了开发环境启动更快，一次性引入所有样式
  if (import.meta.env.VITE_USE_ALL_ELEMENT_PLUS_STYLE === 'true') {
    import('element-plus/dist/index.css')
    return
  }
}
