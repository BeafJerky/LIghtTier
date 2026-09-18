/**
 * EasyTier 输出解析与格式化工具集
 *
 * 三类职责：
 * 1. CLI 文本解析：node / peer 表格文本 → 对象（parseNodeInfo / parsePeerInfo）；
 * 2. 日志提取与读取：从日志文本提取公网 IP（extractAllPublicIPs）、倒序尾读
 *    （readTextReverse，供日志查看器只读末尾 N 行）；
 * 3. 展示格式化：延迟配色、字节/指标格式化、路由开销与 NAT 类型转可读文本、
 *    peer 数据后处理（processPeerData）与 TOML 配置清洗（normalizeToml，5.7）。
 */
import defaultData from '@/constants/defaultData'

/** 解析 `easytier-cli node` 表格文本为键值对象（形如 │ key │ value │ 的行） */
export const parseNodeInfo = (content) => {
  const regex = /^\s*│\s*([^│]+)\s*│\s*([^│]+)\s*│\s*$/gm
  const result = {}
  let match
  while ((match = regex.exec(content)) !== null) {
    const key = match[1].trim()
    result[key] = match[2].trim()
  }
  return result
}
/**
 * 解析 `easytier-cli peer` 表格文本为对象数组
 * 表头取自第 2 行；数据自第 4 行起隔行取值（中间为分隔线）；'-' 与空串归一为 null
 */
export const parsePeerInfo = (content) => {
  // 将表格字符串分割成行
  const lines = content.split('\n')

  // 提取表头（keys）
  const headers = lines[1]
    .split('│')
    .slice(1, -1)
    .map((h) => h.trim())

  // 初始化结果数组
  const result: any[] = []

  // 遍历数据行
  for (let i = 3; i < lines.length - 1; i += 2) {
    if (lines[i].trim() === '') continue // 跳过空行

    // 分割每一行的数据
    const values = lines[i]
      .split('│')
      .slice(1, -1)
      .map((v) => v.trim())

    // 创建对象并添加到结果数组
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] === '-' || values[index] === '' ? null : values[index]
    })

    // 每行数据都作为一个新对象添加到结果数组中
    result.push(obj)
  }

  return result
}

/**
 * 从内核日志文本中提取候选公网 IP（用于展示本机公网地址）
 * 三种来源合并：public_ipv4 字段 > dest_addr（排除 mapped_addr）> "got ip list"；
 * 过滤私网/回环/链路本地地址，按来源优先级 → 出现次数 → 出现位置排序
 */
export async function extractAllPublicIPs(logText) {
  // 私网IP判断函数
  function isPrivateIP(ip) {
    const parts = ip.split('.')
    if (parts.length !== 4) return false
    return (
      parts[0] === '10' ||
      (parts[0] === '172' && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === '192' && parts[1] === '168') ||
      parts[0] === '127' || // 本地回环
      (parts[0] === '0' && parts[1] === '0' && parts[2] === '0') || // 全0地址
      ip === '0.0.0.0' ||
      ip.startsWith('169.254.')
    ) // 链路本地地址
  }

  // 按行分割日志
  const lines = logText.split('\n').filter((line) => line.trim())

  // 获取 mapped_addr 中的IP（排除用）
  const mappedAddrMatch = logText.match(
    /mapped_addr=Some\(SocketAddr\s*\{[^}]*ip:\s*Some\(Ipv4\(([\d.]+)\)\)/
  )
  const mappedIP = mappedAddrMatch ? mappedAddrMatch[1] : null

  // 收集所有候选IP，记录来源和出现次数
  const ipCandidates = new Map()

  lines.forEach((line, lineIndex) => {
    // 策略1: 提取 public_ipv4
    const publicMatch = line.match(/public_ipv4:\s*Some\(([\d.]+)\)/)
    if (publicMatch) {
      const ip = publicMatch[1]
      if (!isPrivateIP(ip)) {
        if (!ipCandidates.has(ip)) {
          ipCandidates.set(ip, {
            ip: ip,
            count: 0,
            sources: new Set(),
            lineNumbers: new Set(),
            lines: []
          })
        }
        const candidate = ipCandidates.get(ip)
        candidate.count++
        candidate.sources.add('public_ipv4')
        candidate.lineNumbers.add(lineIndex)
        candidate.lines.push(line.trim())
      }
    }

    // 策略2: 提取 dest_addr 中的IP（排除 mapped_addr）
    const destMatch = line.match(
      /dest_addr=Some\(SocketAddr\s*\{[^}]*ip:\s*Some\(Ipv4\(([\d.]+)\)\)/
    )
    if (destMatch) {
      const ip = destMatch[1]
      if (!isPrivateIP(ip) && ip !== mappedIP) {
        if (!ipCandidates.has(ip)) {
          ipCandidates.set(ip, {
            ip: ip,
            count: 0,
            sources: new Set(),
            lineNumbers: new Set(),
            lines: []
          })
        }
        const candidate = ipCandidates.get(ip)
        candidate.count++
        candidate.sources.add('dest_addr')
        candidate.lineNumbers.add(lineIndex)
        candidate.lines.push(line.trim())
      }
    }
  })

  // 策略3: 从 "got ip list" 中提取非私网IP
  const gotIpListLines = lines.filter((line) => line.includes('got ip list'))
  if (gotIpListLines.length > 0) {
    gotIpListLines.forEach((line, lineIndex) => {
      const allIPs =
        line.match(
          /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g
        ) || []
      allIPs.forEach((ip) => {
        if (!isPrivateIP(ip)) {
          if (!ipCandidates.has(ip)) {
            ipCandidates.set(ip, {
              ip: ip,
              count: 0,
              sources: new Set(),
              lineNumbers: new Set(),
              lines: []
            })
          }
          const candidate = ipCandidates.get(ip)
          candidate.count++
          candidate.sources.add('got_ip_list')
          candidate.lineNumbers.add(lineIndex)
          candidate.lines.push(line.trim())
        }
      })
    })
  }

  // 转换为数组并排序
  const result = Array.from(ipCandidates.values()).map((candidate) => ({
    ...candidate,
    sources: Array.from(candidate.sources),
    lineNumbers: Array.from(candidate.lineNumbers)
  }))

  // 排序规则：
  // 1. 优先级高的来源在前（public_ipv4 > dest_addr > got_ip_list）
  // 2. 出现次数多的在前
  // 3. 出现的行数少的在前（更早出现）
  const sourcePriority = { public_ipv4: 3, dest_addr: 2, got_ip_list: 1 }

  result.sort((a, b) => {
    // 计算优先级分数
    const getPriorityScore = (sources) => {
      return Math.max(...sources.map((s) => sourcePriority[s] || 0))
    }

    const priorityCompare = getPriorityScore(b.sources) - getPriorityScore(a.sources)
    if (priorityCompare !== 0) return priorityCompare

    // 出现次数比较
    const countCompare = b.count - a.count
    if (countCompare !== 0) return countCompare

    // 出现行数比较（更早出现的在前）
    return Math.min(...a.lineNumbers) - Math.min(...b.lineNumbers)
  })

  return result.map((r) => r.ip)
}

/**
 * 倒着读取文本的指定行数
 * @param {string} text - 要读取的文本
 * @param {number} linesToRead - 要读取的行数
 * @returns {string} 倒着读取的结果，按换行符分隔
 */
export function readTextReverse(text, linesToRead) {
  // 参数校验
  if (typeof text !== 'string') {
    throw new Error('第一个参数必须是字符串')
  }
  if (typeof linesToRead !== 'number' || linesToRead < 0) {
    throw new Error('第二个参数必须是正整数')
  }

  // 按换行符分割文本（支持多种换行符格式）
  const lines = text.split(/\r?\n/)

  // 如果文本为空或行数不足，返回空字符串或全部行
  if (lines.length === 0) {
    return ''
  }

  // 计算实际需要读取的行数
  const actualLinesToRead = Math.min(linesToRead, lines.length)

  // 从后往前提取指定行数
  const reversedLines: string[] = []
  for (let i = 0; i < actualLinesToRead; i++) {
    reversedLines.push(lines[lines.length - 1 - i])
  }

  // 返回倒序后的结果
  return reversedLines.join('\n')
}

/**
 * 延迟颜色映射表
 */
export const delayColorMap = [
  { min: 0, max: 10, color: 'green' },
  { min: 10, max: 80, color: '#45b458' },
  { min: 80, max: 150, color: '#71d481' },
  { min: 150, max: 250, color: '#fdc44d' },
  { min: 250, max: 350, color: '#fd884d' },
  { min: 350, max: Infinity, color: 'red' }
]

/**
 * 根据延迟值获取对应的颜色
 */
export const getDelayColor = (delay: string | number): string => {
  const value = parseFloat(String(delay))
  if (isNaN(value)) return 'gray'
  const matched = delayColorMap.find((r) => value >= r.min && value < r.max)
  return matched ? matched.color : 'gray'
}

/**
 * 格式化字节数为可读字符串
 */
export const formatBytes = (bytes: string | number | null | undefined): string => {
  if (bytes === null || bytes === undefined || bytes === '-' || bytes === 'null') return '—'
  let b = Number(bytes)
  if (isNaN(b) && typeof bytes === 'string') {
    // 解析 CLI 返回的人类可读格式，如 "1.26 kB"
    const match = bytes.trim().match(/^([\d.]+)\s*(B|kB|KB|MB|GB|TB)?$/i)
    if (match) {
      const num = parseFloat(match[1])
      const unit = (match[2] || 'B').toUpperCase()
      const multipliers: Record<string, number> = {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        TB: 1024 * 1024 * 1024 * 1024
      }
      b = num * (multipliers[unit] || 1)
    }
  }
  if (isNaN(b) || b < 0) return '—'
  if (b === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(b) / Math.log(1024))
  return (b / Math.pow(1024, i)).toFixed(1) + ' ' + units[Math.min(i, units.length - 1)]
}

/**
 * 带单位后缀的监控指标格式化（延迟 ms、丢包 % 等）
 * 兼容真实数据（本地节点无数据为 "-"，部分字段 CLI 输出已自带单位如 "0.0%"）与 mock（纯数字）
 * @param val 原始值
 * @param unit 单位后缀，如 'ms'、'%'
 */
export const formatMetric = (val: string | number | null | undefined, unit: string): string => {
  if (val === null || val === undefined || val === '' || val === '-' || val === 'null') return '—'
  const s = String(val)
  return s.endsWith(unit) ? s : `${s}${unit}`
}

/**
 * 路由开销类型转可读文本
 */
export const routeCost = (cost: string): string => {
  switch (cost) {
    case 'p2p':
      return 'P2P直连'
    case 'Local':
      return '本地'
    default:
      return '中继'
  }
}

/**
 * NAT 类型转可读文本
 */
export const getNatType = (natType: any): string => {
  switch (natType) {
    case 3:
    case 'FullCone':
      return '全锥形'
    case 4:
    case 'Restricted':
      return '限制锥形'
    case 5:
    case 'PortRestricted':
      return '端口限制锥形'
    case 6:
    case 'Symmetric':
      return '对称型'
    case 0:
    case 'Unknown':
      return '未知'
    case 1:
    case 'OpenInternet':
      return '公网'
    case 2:
    case 'NoPAT':
      return '无PAT'
    case 7:
    case 'SymUdpFirewall':
      return '对称UDP防火墙'
    default:
      return String(natType)
  }
}

/**
 * 统一后处理 peer 数据
 * - IPv4 去掉 CIDR 后缀
 * - 公共服务器清理 hostname
 * - 转换 cost/nat_type/delayColor
 */
export const processPeerData = (peers: PeerInfo[]): PeerInfo[] => {
  return peers.map((p) => {
    let ipv4 = p.ipv4 || ''
    let hostname = p.hostname || ''
    if (ipv4.includes('/')) ipv4 = ipv4.split('/')[0]
    if (hostname.includes('PublicServer_')) {
      hostname = hostname.replace('PublicServer_', '')
      ipv4 = '服务器'
    }
    return {
      ...p,
      ipv4,
      hostname,
      cost: routeCost(p.cost),
      nat_type: getNatType(p.nat_type),
      delayColor: getDelayColor(p.lat_ms)
    }
  })
}

// === 5.7 默认数据合并 + 空值清理 ===
const isEmptyValue = (v: any): boolean => {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  return false
}

// 仅补标量默认值（字符串非空/布尔/数字），数组与对象默认不注入，避免产生空结构
const isScalarDefault = (v: any): boolean =>
  v !== undefined && v !== null && v !== '' && typeof v !== 'object'

/**
 * 统一 TOML 配置清洗：
 * 1. 空值剔除：空串、空数组、undefined、null 一律不落盘（避免内核启动参数异常）；
 * 2. 默认值合并（mergeDefaults 默认开启）：缺失字段补 defaultFormData 的标量默认（保证展示完整）；
 *    保存场景传 { mergeDefaults: false }，只剔空值不注入默认，避免配置膨胀；
 * 3. flags 深度清理：空值字段删除，全空则删除整个 flags。
 */
export const normalizeToml = (
  cfg: Record<string, any>,
  options: { mergeDefaults?: boolean } = {}
): Record<string, any> => {
  const merge = options.mergeDefaults ?? true
  const def = (defaultData as any).defaultFormData || {}
  const out: Record<string, any> = {}
  Object.keys(def).forEach((k) => {
    const v = cfg[k]
    if (isEmptyValue(v)) {
      if (merge && isScalarDefault(def[k])) out[k] = def[k]
    } else {
      out[k] = v
    }
  })
  // 非默认表中的键（用户自定义/未来字段）透传，同样剔除空值
  Object.keys(cfg).forEach((k) => {
    if (!(k in def) && !isEmptyValue(cfg[k])) out[k] = cfg[k]
  })
  if (merge) {
    // flags 内缺失的标量默认值同样补全（如 enable_encryption、default_protocol）；
    // 无 flags 键时新建（解析/展示语义要求完整）
    const defFlags = def.flags || {}
    const hasDefaults = Object.keys(defFlags).some((k) => isScalarDefault(defFlags[k]))
    if (hasDefaults) {
      if (!out.flags || typeof out.flags !== 'object') out.flags = {}
      Object.keys(defFlags).forEach((k) => {
        if (isEmptyValue(out.flags[k]) && isScalarDefault(defFlags[k])) out.flags[k] = defFlags[k]
      })
    }
  }
  if (out.flags && typeof out.flags === 'object') {
    Object.keys(out.flags).forEach((k) => {
      if (isEmptyValue(out.flags[k])) delete out.flags[k]
    })
    if (Object.keys(out.flags).length === 0) delete out.flags
  }
  return out
}
