/**
 * 全局翻译函数封装
 *
 * 支持命名空间前缀（namespace）：t('key') 自动拼接为 'namespace.key'；
 * i18n 未就绪时降级为返回 key 本身（保证渲染不报错）。
 */
import { i18n } from '@/plugins/vueI18n'

type I18nGlobalTranslation = {
  (key: string): string
  (key: string, locale: string): string
  (key: string, locale: string, list: unknown[]): string
  (key: string, locale: string, named: Record<string, unknown>): string
  (key: string, list: unknown[]): string
  (key: string, named: Record<string, unknown>): string
}

type I18nTranslationRestParameters = [string, any]

// 拼接命名空间：已带前缀的 key 原样返回，避免重复拼接
const getKey = (namespace: string | undefined, key: string) => {
  if (!namespace) {
    return key
  }
  if (key.startsWith(namespace)) {
    return key
  }
  return `${namespace}.${key}`
}

export const useI18n = (
  namespace?: string
): {
  t: I18nGlobalTranslation
} => {
  const normalFn = {
    t: (key: string) => {
      return getKey(namespace, key)
    }
  }

  // i18n 尚未初始化（极早期调用）：降级返回原 key
  if (!i18n) {
    return normalFn
  }

  const { t, ...methods } = i18n.global

  const tFn: I18nGlobalTranslation = (key: string, ...arg: any[]) => {
    if (!key) return ''
    if (!key.includes('.') && !namespace) return key
    return (t as any)(getKey(namespace, key), ...(arg as I18nTranslationRestParameters))
  }
  return {
    ...methods,
    t: tFn
  }
}

/** 恒等函数：用于无需翻译的占位场景（保持调用点签名统一） */
export const t = (key: string) => key
