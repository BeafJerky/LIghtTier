<template>
  <div class="tc-root">
    <svg
      v-if="points.length >= 2"
      class="tc-svg"
      viewBox="0 0 600 200"
      preserveAspectRatio="none"
      role="img"
    >
      <!-- 网格线（4 条横线） -->
      <line
        v-for="i in 4"
        :key="i"
        x1="0"
        :y1="(200 / 5) * i"
        x2="600"
        :y2="(200 / 5) * i"
        class="tc-grid"
      />
      <!-- 延迟曲线（accent 色，独立归一化，虚线区分量纲） -->
      <path v-if="hasLatency" :d="latPath" class="tc-line tc-line-lat" />
      <!-- 上传（success）/ 下载（info），共享字节轴 -->
      <path :d="txPath" class="tc-line tc-line-tx" />
      <path :d="rxPath" class="tc-line tc-line-rx" />
    </svg>
    <div v-else class="tc-empty">{{ t('newMonitor.trendEmpty') }}</div>
    <div class="tc-legend">
      <span class="tc-legend-item"
        ><i class="tc-dot tc-dot-tx"></i>{{ t('newMonitor.trendTx') }}
        {{ fmtRate(last?.txRate) }}</span
      >
      <span class="tc-legend-item"
        ><i class="tc-dot tc-dot-rx"></i>{{ t('newMonitor.trendRx') }}
        {{ fmtRate(last?.rxRate) }}</span
      >
      <span class="tc-legend-item"
        ><i class="tc-dot tc-dot-lat"></i>{{ t('newMonitor.trendLatency') }}
        {{ last && last.latency > 0 ? last.latency.toFixed(1) + 'ms' : '—' }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TrendChart — 运行趋势图（5.16，纯 SVG 手绘，遵循 KISS：不引图表库）
 *
 * 三条曲线：上传/下载速率共享字节轴（同一量纲便于对比），延迟独立归一化
 * （下限 100ms 防止低延迟贴顶），虚线样式区分量纲。
 * 平滑策略：Catmull-Rom → 三次贝塞尔（曲线穿过全部数据点，张力 1/6）。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TrendPoint } from '@/hooks/useTrendBuffer'

const props = defineProps<{ points: TrendPoint[] }>()

const { t } = useI18n()

const W = 600
const H = 200
const PAD = 10

const last = computed(() => props.points[props.points.length - 1])

// 上传/下载共享字节轴；延迟独立归一化（量纲不同，虚线叠加展示形态）
const maxBytes = computed(() => {
  let m = 1
  for (const p of props.points) {
    m = Math.max(m, p.txRate, p.rxRate)
  }
  return m
})
const maxLatency = computed(() => {
  let m = 100 // 下限 100ms，低延迟时曲线不至于贴顶
  for (const p of props.points) {
    m = Math.max(m, p.latency)
  }
  return m
})
const hasLatency = computed(() => props.points.some((p) => p.latency > 0))

// Catmull-Rom 转三次贝塞尔平滑曲线（曲线穿过全部数据点，张力 1/6）
const toPath = (pick: (p: TrendPoint) => number, scale: number): string => {
  const n = props.points.length
  if (n < 2) return ''
  const step = (W - PAD * 2) / (n - 1)
  const pts = props.points.map((p, i) => {
    const x = PAD + i * step
    const y = H - PAD - (pick(p) / scale) * (H - PAD * 2)
    return { x, y }
  })
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(n - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}
const txPath = computed(() => toPath((p) => p.txRate, maxBytes.value))
const rxPath = computed(() => toPath((p) => p.rxRate, maxBytes.value))
const latPath = computed(() => toPath((p) => p.latency, maxLatency.value))

// 字节速率格式化：B/s → KB/s → MB/s（无样本返回占位符）
const fmtRate = (v?: number): string => {
  if (v === undefined || v === null || v < 0) return '—'
  if (v >= 1024 * 1024) return (v / 1024 / 1024).toFixed(2) + ' MB/s'
  if (v >= 1024) return (v / 1024).toFixed(1) + ' KB/s'
  return Math.round(v) + ' B/s'
}
</script>

<style scoped>
.tc-root {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tc-svg {
  display: block;
  width: 100%;
  height: 150px;
}

.tc-grid {
  stroke: var(--theme-border-light, #f5ede6);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.tc-line {
  fill: none;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.tc-line-tx {
  stroke: var(--theme-color-success, #7fba8a);
}

.tc-line-rx {
  stroke: var(--theme-color-info, #8fb8d8);
}

.tc-line-lat {
  stroke: var(--theme-accent-primary, #d9a56e);
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}

.tc-empty {
  display: flex;
  height: 150px;
  font-size: 12px;
  color: var(--theme-text-muted, #c8bdb2);
  align-items: center;
  justify-content: center;
}

.tc-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--theme-text-muted, #c8bdb2);
}

.tc-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.tc-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: var(--theme-radius-round, 50%);
}

.tc-dot-tx {
  background: var(--theme-color-success, #7fba8a);
}

.tc-dot-rx {
  background: var(--theme-color-info, #8fb8d8);
}

.tc-dot-lat {
  background: var(--theme-accent-primary, #d9a56e);
}
</style>
