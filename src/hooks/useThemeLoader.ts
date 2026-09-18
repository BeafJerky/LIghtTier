/**
 * 主题加载器
 *
 * - 内置主题通过 data-theme 属性生效（cream / dark 由 CSS 变量定义）
 * - 外部主题（resource/themes/*.css）注入 <style id="custom-theme"> 后生效
 * - currentTheme 为模块级单例，多个组件共享同一主题状态
 */
import { ref } from 'vue'

const currentTheme = ref('cream')

export const useThemeLoader = () => {
  // 注入外部主题样式（先移除旧的，保证单实例）
  const injectExternalTheme = (cssText: string) => {
    removeExternalTheme()
    const style = document.createElement('style')
    style.id = 'custom-theme'
    style.textContent = cssText
    document.head.appendChild(style)
  }

  const removeExternalTheme = () => {
    document.getElementById('custom-theme')?.remove()
  }

  // 应用主题：记录名称 + 注入/移除外部 CSS + 更新 data-theme 属性
  const applyTheme = (name: string, externalCss?: string) => {
    currentTheme.value = name
    localStorage.setItem('theme', name)

    if (externalCss) {
      injectExternalTheme(externalCss)
    } else {
      removeExternalTheme()
    }
    document.documentElement.setAttribute('data-theme', name)
  }

  // 重置回默认主题（清理存储与注入的样式）
  const resetTheme = () => {
    localStorage.removeItem('theme')
    removeExternalTheme()
    document.documentElement.setAttribute('data-theme', 'cream')
    currentTheme.value = 'cream'
  }

  return { currentTheme, applyTheme, resetTheme, injectExternalTheme, removeExternalTheme }
}
