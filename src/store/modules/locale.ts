/**
 * 语言（locale）状态管理
 *
 * - currentLocale 持久化到 localStorage，刷新后保持上次语言
 * - elLocaleMap：Element Plus 内置组件文案的语言包映射（与 vue-i18n 语言同步）
 */
import { defineStore } from 'pinia'
import { store } from '../index'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useStorage } from '@/hooks/web/useStorage'

// 本地定义语言选项类型（原类型来自已移除的 LocaleDropdown 组件，内联避免循环依赖）
interface Language {
  el: Recordable
  name: string
}

interface LocaleDropdownType {
  lang: LocaleType
  name?: string
  elLocale?: Language
}

const { getStorage, setStorage } = useStorage('localStorage')

// 语言 → Element Plus 语言包映射
const elLocaleMap = {
  'zh-CN': zhCn,
  en: en
}
interface LocaleState {
  currentLocale: LocaleDropdownType
  localeMap: LocaleDropdownType[]
}

export const useLocaleStore = defineStore('locales', {
  state: (): LocaleState => {
    return {
      // 初始语言：读取本地存储，默认简体中文
      currentLocale: {
        lang: getStorage('lang') || 'zh-CN',
        elLocale: elLocaleMap[getStorage('lang') || 'zh-CN']
      },
      // 多语言
      localeMap: [
        {
          lang: 'zh-CN',
          name: '简体中文'
        },
        {
          lang: 'en',
          name: 'English'
        }
      ]
    }
  },
  getters: {
    getCurrentLocale(): LocaleDropdownType {
      return this.currentLocale
    },
    getLocaleMap(): LocaleDropdownType[] {
      return this.localeMap
    }
  },
  actions: {
    setCurrentLocale(localeMap: LocaleDropdownType) {
      this.currentLocale.lang = localeMap?.lang
      this.currentLocale.elLocale = elLocaleMap[localeMap?.lang]
      setStorage('lang', localeMap?.lang)
    }
  }
})

export const useLocaleStoreWithOut = () => {
  return useLocaleStore(store)
}
