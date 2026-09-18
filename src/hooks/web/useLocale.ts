/**
 * 语言切换
 *
 * 动态导入目标语言包 → 注册到 i18n → 同步 locale store 与 <html lang>。
 */
import { i18n } from '@/plugins/vueI18n'
import { useLocaleStoreWithOut } from '@/store/modules/locale'
import { setHtmlPageLang } from '@/plugins/vueI18n/helper'

// 同步 i18n 实例与 locale store 的语言设置
const setI18nLanguage = (locale: LocaleType) => {
  const localeStore = useLocaleStoreWithOut()

  // legacy/composition 两种模式下 locale 的读写方式不同
  if (i18n.mode === 'legacy') {
    i18n.global.locale = locale
  } else {
    ;(i18n.global.locale as any).value = locale
  }
  localeStore.setCurrentLocale({
    lang: locale
  })
  setHtmlPageLang(locale)
}

export const useLocale = () => {
  // 切换语言会同步改变 useI18n 的 locale，并提交到持久化存储
  const changeLocale = async (locale: LocaleType) => {
    const globalI18n = i18n.global

    // 按需加载语言包并注册（幂等，重复切换不会重复注册）
    const langModule = await import(`../../locales/${locale}.ts`)

    globalI18n.setLocaleMessage(locale, langModule.default)

    setI18nLanguage(locale)
  }

  return {
    changeLocale
  }
}
