/**
 * 本地存储封装
 *
 * 直接读写原生值（内部统一 JSON 序列化）；读取时兼容旧版 {type, value} 包装格式。
 */
export const useStorage = (type: 'sessionStorage' | 'localStorage' = 'sessionStorage') => {
  const storage = window[type]

  const setStorage = (key: string, value: any) => {
    storage.setItem(key, JSON.stringify(value))
  }

  const getStorage = (key: string) => {
    const raw = storage.getItem(key)
    if (raw == null) return raw
    try {
      const parsed = JSON.parse(raw)
      // 兼容旧格式 {"type":"String","value":"xxx"}
      if (parsed && typeof parsed === 'object' && 'value' in parsed && 'type' in parsed) {
        return parsed.value
      }
      return parsed
    } catch {
      // 非 JSON 文本（历史数据）：原样返回
      return raw
    }
  }

  const removeStorage = (key: string) => {
    storage.removeItem(key)
  }

  const clear = (excludes?: string[]) => {
    // 获取排除项
    const keys = Object.keys(storage)
    const defaultExcludes = ['dynamicRouter', 'serverDynamicRouter']
    const excludesArr = excludes ? [...excludes, ...defaultExcludes] : defaultExcludes
    const excludesKeys = keys.filter((key) => !excludesArr.includes(key))
    // 排除项不清除
    excludesKeys.forEach((key) => {
      storage.removeItem(key)
    })
  }

  return {
    setStorage,
    getStorage,
    removeStorage,
    clear
  }
}
