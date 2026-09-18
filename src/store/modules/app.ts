/**
 * 应用外观状态（组件尺寸 / 暗黑模式 / 灰色模式 / Element Plus 主色）
 *
 * - state 整体持久化（persist: true），刷新后保留外观设置
 * - setTheme / setCssVarTheme 把颜色写入 CSS 变量，组件样式统一用 var(--el-color-primary) 取值
 */
// @ts-ignore
// @ts-nocheck
import { defineStore } from 'pinia'
import { store } from '../index'
import { setCssVar, humpToUnderline } from '@/utils'
import { mix } from '@/utils/color'
import { ComponentSize } from 'element-plus'
import { useDark } from '@vueuse/core'

interface AppState {
  sizeMap: ComponentSize[]
  title: string
  isDark: boolean
  currentSize: ComponentSize
  greyMode: boolean
  theme: ThemeTypes
}

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    return {
      sizeMap: ['default', 'large', 'small'],
      title: import.meta.env.VITE_APP_TITLE, // 标题
      isDark: false, // 是否是暗黑模式
      currentSize: 'default', // 组件尺寸
      greyMode: false, // 是否开启灰色模式，用于特殊悼念日
      theme: {
        // 主题色
        elColorPrimary: '#409eff'
      }
    }
  },
  getters: {
    getTitle(): string {
      return this.title
    },
    getIsDark(): boolean {
      return this.isDark
    },
    getCurrentSize(): ComponentSize {
      return this.currentSize
    },
    getSizeMap(): ComponentSize[] {
      return this.sizeMap
    },
    getGreyMode(): boolean {
      return this.greyMode
    },
    getTheme(): ThemeTypes {
      return this.theme
    }
  },
  actions: {
    setGreyMode(greyMode: boolean) {
      this.greyMode = greyMode
    },
    // 切换暗黑模式：html 挂载 dark/light 类名（Element Plus 与自定义变量均依赖）
    setIsDark(isDark: boolean) {
      this.isDark = isDark
      if (this.isDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
      this.setPrimaryLight()
    },
    setCurrentSize(currentSize: ComponentSize) {
      this.currentSize = currentSize
    },
    setTheme(theme: ThemeTypes) {
      this.theme = Object.assign(this.theme, theme)
    },
    // 把主题色写入 CSS 变量（驼峰 → 横杠命名）
    setCssVarTheme() {
      for (const key in this.theme) {
        setCssVar(`--${humpToUnderline(key)}`, this.theme[key])
      }
      this.setPrimaryLight()
    },
    // 派生 Element Plus 主色的浅色/深色梯度变量（light-3 ~ light-9、dark-2）
    setPrimaryLight() {
      if (this.theme.elColorPrimary) {
        const elColorPrimary = this.theme.elColorPrimary
        const color = this.isDark ? '#000000' : '#ffffff'
        const lightList = [3, 5, 7, 8, 9]
        lightList.forEach((v) => {
          setCssVar(`--el-color-primary-light-${v}`, mix(color, elColorPrimary, v / 10))
        })
        setCssVar(`--el-color-primary-dark-2`, mix(color, elColorPrimary, 0.2))
      }
    },
    // 初始化主题：同步 vueuse useDark 与 store 状态（App.vue onBeforeMount 调用）
    initTheme() {
      const isDark = useDark({
        valueDark: 'dark',
        valueLight: 'light'
      })
      isDark.value = this.getIsDark
    }
  },
  persist: true
})

export const useAppStoreWithOut = () => {
  return useAppStore(store)
}
