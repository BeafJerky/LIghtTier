/** 同步 <html lang> 属性（无障碍与浏览器语言感知） */
export const setHtmlPageLang = (locale: LocaleType) => {
  document.querySelector('html')?.setAttribute('lang', locale)
}
