// === 5.16 历史趋势缓冲（每配置环形缓冲区，模块级存活，跨页面不丢） ===

/** 趋势采样点：速率（B/s）与平均延迟（ms） */
export interface TrendPoint {
  ts: number
  txRate: number
  rxRate: number
  latency: number
}

/** 趋势缓冲时间窗口：仅保留最近 15 分钟内的采样点 */
export const TREND_WINDOW_MS = 15 * 60 * 1000

const buffers = new Map<string, TrendPoint[]>()

export const useTrendBuffer = () => {
  /** 取某配置的趋势点（副本） */
  const getTrend = (configName: string): TrendPoint[] => [...(buffers.get(configName) || [])]

  /** 追加采样点（按时间窗口裁剪：丢弃早于最新点 15 分钟的采样） */
  const pushTrend = (configName: string, point: TrendPoint): void => {
    let buf = buffers.get(configName)
    if (!buf) {
      buf = []
      buffers.set(configName, buf)
    }
    buf.push(point)
    // 采样点按 ts 升序追加，从队首丢弃超出时间窗口的旧点
    const cutoff = point.ts - TREND_WINDOW_MS
    let drop = 0
    while (drop < buf.length && buf[drop].ts < cutoff) drop++
    if (drop > 0) buf.splice(0, drop)
  }

  /** 清空某配置缓冲（配置停止/删除时调用） */
  const clearTrend = (configName: string): void => {
    buffers.delete(configName)
  }

  return { getTrend, pushTrend, clearTrend }
}
