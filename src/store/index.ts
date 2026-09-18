/**
 * Pinia 实例装配
 *
 * 注册 persistedstate 插件（各 store 通过 persist 选项声明持久化字段），
 * setupStore 在 main.ts 中挂载；store 导出供「组件外」场景获取实例。
 */
import type { App } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const store = createPinia()

store.use(piniaPluginPersistedstate)

export const setupStore = (app: App<Element>) => {
  app.use(store)
}

export { store }
