/**
 * 镜像延迟测试（5.10 内核下载加速源）
 *
 * 场景：内核安装包下载受 GitHub 直连速度影响，提供官方直链 + 多个镜像源；
 * 通过 HEAD 请求并发测速（单源 3s 超时），用户未显式选择时自动选用最快源，
 * 选择结果以 MIRROR_SOURCE_KEY 持久化（设置弹窗下载内核时读取同一键）。
 */
import { computed, ref } from 'vue'
import { GITHUB_EASYTIER, GITHUB_MIRROR_URL, USER_AGENT } from '@/constants/easytier'

// === 5.10 镜像延迟测试（内核下载加速源） ===

/** 镜像源条目（latency 为测速结果，null 表示未测/失败） */
export interface MirrorSourceItem {
  value: string
  label: string
  latency: number | null
}

/** 选择结果持久化键（handleDownloadCore 读取同键） */
export const MIRROR_SOURCE_KEY = 'mirror-source'
/** 单源测速超时（ms） */
export const PROBE_TIMEOUT_MS = 3000
/** 延迟徽标阈值：<100ms 优、≥200ms 劣 */
export const LATENCY_GOOD = 100
export const LATENCY_BAD = 200

/** 测速单个源：HEAD 请求计时，超时/失败返回 null */
const probeOne = async (url: string): Promise<number | null> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  try {
    const start = performance.now()
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': USER_AGENT,
        'Cache-Control': 'no-cache',
        Accept: '*/*'
      },
      connectTimeout: PROBE_TIMEOUT_MS,
      maxRedirections: 1,
      signal: controller.signal
    } as RequestInit & { connectTimeout?: number; maxRedirections?: number })
    if (!res.ok) return null
    return Math.round(performance.now() - start)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export const useMirrorProbe = () => {
  const sources = ref<MirrorSourceItem[]>([
    { value: GITHUB_EASYTIER, label: '', latency: null },
    ...GITHUB_MIRROR_URL.map((m) => ({ ...m, latency: null }))
  ])
  const probing = ref(false)
  const selected = ref<string>(localStorage.getItem(MIRROR_SOURCE_KEY) || GITHUB_EASYTIER)
  const selectedSource = computed(
    () => sources.value.find((s) => s.value === selected.value) || sources.value[0]
  )

  /** 并发测速全部源；未手动选择时自动选用最快可用源 */
  const probeAll = async (): Promise<void> => {
    if (probing.value) return
    probing.value = true
    try {
      const results = await Promise.all(
        sources.value.map(async (s) => ({ ...s, latency: await probeOne(s.value) }))
      )
      sources.value = results
      // 自动选用：仅当用户尚未显式选择（仍是默认官方直链）时生效
      if (selected.value === GITHUB_EASYTIER) {
        const fastest = results
          .filter((s) => s.latency !== null)
          .sort((a, b) => (a.latency as number) - (b.latency as number))[0]
        if (fastest) selectSource(fastest.value)
      }
    } finally {
      probing.value = false
    }
  }

  /** 显式选择镜像源并持久化（后续下载优先使用该源） */
  const selectSource = (value: string): void => {
    selected.value = value
    localStorage.setItem(MIRROR_SOURCE_KEY, value)
  }

  return { sources, probing, selected, selectedSource, probeAll, selectSource }
}
