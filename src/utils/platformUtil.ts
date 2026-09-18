import { type } from '@tauri-apps/plugin-os'

let cachedAndroid: boolean | undefined

/**
 * 是否运行在 Android 平台（结果缓存）
 * 浏览器 mock 模式等非 Tauri 环境返回 false
 */
export const isAndroid = (): boolean => {
  if (cachedAndroid === undefined) {
    try {
      cachedAndroid = type() === 'android'
    } catch {
      cachedAndroid = false
    }
  }
  return cachedAndroid
}

/**
 * 是否运行在桌面平台（Windows / macOS / Linux）
 * 注：首版移动端仅支持 Android，其余非 Android 环境一律按桌面处理（含浏览器 mock 模式）
 */
export const isDesktop = (): boolean => !isAndroid()
