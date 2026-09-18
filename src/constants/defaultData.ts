import type { EasyTierFormData, FormWebData } from '@/types/formTypes'

const defaultFormData: EasyTierFormData | any = {
  hostname: '',
  instance_name: '',
  machine_id: undefined, // 机器 ID，默认从系统获取
  network_identity: {
    network_name: '',
    network_secret: ''
  },
  dhcp: true,
  ipv4: undefined,
  ipv6: undefined,
  peer: [{ uri: undefined }],
  external_node: undefined, // 外部节点
  listeners: [],
  mapped_listeners: [],
  routes: undefined,
  proxy_network: [{ cidr: undefined }],
  exit_nodes: [],
  rpc_portal: '0.0.0.0:15888',
  rpc_portal_whitelist: undefined, // RPC 白名单
  socks5_proxy: undefined, // SOCKS5 代理（顶层）
  local_private_key: undefined, // 安全模式本地私钥
  local_public_key: undefined, // 安全模式本地公钥
  credential: undefined, // 临时入网凭据
  credential_file: undefined, // 凭据存储文件路径
  tcp_whitelist: [],
  udp_whitelist: [],
  stun_servers: undefined, // STUN 服务器列表
  stun_servers_v6: undefined, // IPv6 STUN 服务器列表
  console_logger: { level: undefined },
  file_logger: {
    level: 'error',
    file: 'easytier',
    dir: '',
    size: undefined, // 单个日志文件大小 MB，默认 100
    count: undefined // 最大日志文件数量，默认 10
  },
  vpn_portal_config: {
    client_cidr: '',
    wireguard_listen: ''
  },
  port_forward: [], // 端口转发
  flags: {
    default_protocol: 'tcp',
    dev_name: '',
    data_compress_algo: undefined,
    enable_encryption: true,
    encryption_algorithm: undefined, // 加密算法，默认 aes-gcm
    enable_ipv6: true,
    disable_ipv6: undefined, // 禁用 IPv6
    mtu: undefined, // MTU，默认 1380/1360
    latency_first: true,
    enable_exit_node: false,
    no_tun: false,
    use_smoltcp: false,
    disable_p2p: false,
    disable_udp_hole_punching: false,
    disable_tcp_hole_punching: undefined, // 禁用 TCP 打洞
    disable_sym_hole_punching: undefined, // 禁用对称 NAT 打洞
    multi_thread: true,
    multi_thread_count: undefined, // 线程数，默认 2
    relay_all_peer_rpc: false,
    ipv6_listener: undefined,
    socks5: undefined,
    relay_network_whitelist: '*',
    compression_algorithm: undefined,
    bind_device: true,
    disable_kcp_input: false,
    enable_kcp_proxy: false,
    enable_quic_proxy: undefined, // 启用 QUIC 代理
    disable_quic_input: undefined, // 禁用 QUIC 输入
    accept_dns: false,
    private_mode: false,
    proxy_forward_by_system: false,
    foreign_relay_bps_limit: undefined, // 外部中继带宽限制
    instance_recv_bps_limit: undefined, // 实例入站带宽限制
    p2p_only: undefined, // 仅 P2P 模式
    lazy_p2p: undefined, // 按需建立 P2P
    need_p2p: undefined, // 声明需要主动 P2P
    disable_upnp: undefined, // 禁用 UPnP/NAT-PMP 映射
    no_listener: undefined, // 不监听任何端口
    ipv6_public_addr_provider: undefined, // 共享公网 IPv6 子网
    ipv6_public_addr_auto: undefined, // 自动获取公网 IPv6 地址
    ipv6_public_addr_prefix: undefined, // 手动指定公网 IPv6 子网
    enable_udp_broadcast_relay: undefined, // 启用 UDP 广播中继
    secure_mode: undefined, // 启用安全模式
    disable_relay_kcp: undefined, // 禁止转发 KCP 数据包
    disable_relay_quic: undefined, // 禁止转发 QUIC 数据包
    enable_relay_foreign_network_kcp: undefined, // 允许转发外部网络 KCP
    enable_relay_foreign_network_quic: undefined, // 允许转发外部网络 QUIC
    tld_dns_zone: undefined // TLD DNS 区域
  }
}
/**
 * 高级字段定义（5.6 安全模式 / IPv6 / 高级选项）
 * key/label/type/tooltip 集中维护，EditDialog 用 v-for 渲染，杜绝手写重复
 */
export interface AdvancedFieldDef {
  key: string
  type: 'text' | 'switch'
  tooltipKey?: string // i18n key，title 属性挂 tooltip
  secret?: boolean // 敏感字段：回显掩码、保存写回原值
  filePick?: boolean // 文本输入行带 📁 选择按钮（Tauri 文件选择）
}

// 安全模式（顶层字段，文本输入）
export const SECURITY_FIELD_DEFS: AdvancedFieldDef[] = [
  { key: 'local_private_key', type: 'text', tooltipKey: 'newEdit.tipPrivateKey', secret: true },
  { key: 'local_public_key', type: 'text', tooltipKey: 'newEdit.tipPublicKey' },
  { key: 'credential', type: 'text', tooltipKey: 'newEdit.tipCredential', secret: true },
  { key: 'credential_file', type: 'text', tooltipKey: 'newEdit.tipCredentialFile', filePick: true }
]

// 高级选项（flags 内布尔开关，2 列网格）
export const ADVANCED_FLAG_DEFS: AdvancedFieldDef[] = [
  { key: 'disable_quic_input', type: 'switch', tooltipKey: 'newEdit.tipDisableQuicInput' },
  { key: 'lazy_p2p', type: 'switch', tooltipKey: 'newEdit.tipLazyP2p' },
  { key: 'need_p2p', type: 'switch', tooltipKey: 'newEdit.tipNeedP2p' },
  { key: 'disable_upnp', type: 'switch', tooltipKey: 'newEdit.tipDisableUpnp' },
  { key: 'no_listener', type: 'switch', tooltipKey: 'newEdit.tipNoListener' },
  { key: 'enable_udp_broadcast_relay', type: 'switch', tooltipKey: 'newEdit.tipUdpBroadcastRelay' },
  { key: 'disable_relay_kcp', type: 'switch', tooltipKey: 'newEdit.tipDisableRelayKcp' },
  { key: 'disable_relay_quic', type: 'switch', tooltipKey: 'newEdit.tipDisableRelayQuic' },
  {
    key: 'enable_relay_foreign_network_kcp',
    type: 'switch',
    tooltipKey: 'newEdit.tipRelayForeignKcp'
  },
  {
    key: 'enable_relay_foreign_network_quic',
    type: 'switch',
    tooltipKey: 'newEdit.tipRelayForeignQuic'
  },
  { key: 'secure_mode', type: 'switch', tooltipKey: 'newEdit.tipSecureMode' },
  { key: 'disable_sym_hole_punching', type: 'switch', tooltipKey: 'newEdit.tipDisableSymHole' },
  { key: 'p2p_only', type: 'switch', tooltipKey: 'newEdit.tipP2pOnly' },
  { key: 'ipv6_public_addr_auto', type: 'switch', tooltipKey: 'newEdit.tipIpv6Auto' },
  { key: 'accept_dns', type: 'switch', tooltipKey: 'newEdit.tipAcceptDns' }
]

// 高级选项（flags 内文本输入）
export const ADVANCED_TEXT_DEFS: AdvancedFieldDef[] = [
  { key: 'ipv6_public_addr_provider', type: 'text', tooltipKey: 'newEdit.tipIpv6Provider' },
  { key: 'ipv6_public_addr_prefix', type: 'text', tooltipKey: 'newEdit.tipIpv6Prefix' }
]

// 高级选项（顶层文本输入）
export const ADVANCED_TOP_TEXT_DEFS: AdvancedFieldDef[] = [
  { key: 'socks5_proxy', type: 'text', tooltipKey: 'newEdit.tipSocks5' },
  { key: 'stun_servers', type: 'text', tooltipKey: 'newEdit.tipStun' }
]

// 固定高级字段的全部 key（动态 Flags 编辑器需排除，避免同一 key 双处编辑）
export const ADVANCED_FIELD_KEYS: string[] = [
  ...ADVANCED_FLAG_DEFS.map((f) => f.key),
  ...ADVANCED_TEXT_DEFS.map((f) => f.key)
]

// 敏感字段掩码占位
export const SECRET_MASK = '••••••'

/**
 * 配置模板（5.8 服务器配置模板）
 * 纯数据，仅派生表单初始值，不参与 TOML 序列化管线
 * values 为可直接 toml.stringify 的配置对象（空对象 = 自定义）
 */
export interface ConfigTemplate {
  id: 'server' | 'client' | 'custom'
  labelKey: string
  values: Record<string, any>
}
export const CONFIG_TEMPLATES: ConfigTemplate[] = [
  {
    id: 'server',
    labelKey: 'newEdit.templateServer',
    values: {
      dhcp: false,
      listeners: ['tcp://0.0.0.0:11010', 'udp://0.0.0.0:11010'],
      flags: {
        enable_exit_node: true,
        latency_first: true,
        multi_thread: true
      }
    }
  },
  {
    id: 'client',
    labelKey: 'newEdit.templateClient',
    values: {
      dhcp: true,
      flags: {
        latency_first: true,
        multi_thread: true
      }
    }
  },
  {
    id: 'custom',
    labelKey: 'newEdit.templateCustom',
    values: {}
  }
]
const defaultFormWebData: FormWebData = {
  host: '',
  port: 22020,
  protocol: 'udp',
  userName: '',
  webStartMethod: 2,
  configFileName: '',
  webUrl: '',
  status: '停止'
}
export default { defaultFormData, defaultFormWebData }
