import { ref } from 'vue'
import { join } from '@tauri-apps/api/path'
import { template } from 'lodash-es'
import { CORE_PATH, EASYTIER_NAME } from '@/constants/easytier'
import { extractFile } from '@/utils/fileUtil'
import { stopAllNodes } from '@/utils/shellUtil'
import { getArch, getOsType } from '@/utils/sysUtil'

/**
 * 安装内核（从 resource/core 下的压缩包解压，内置包免下载）
 * 设置弹窗与首次引导屏共用
 */
export const useCoreInstall = () => {
  const installing = ref(false)

  /**
   * 安装指定版本的核心
   * @param version 版本号（如 v2.6.4），需与 resource/core 下的压缩包文件名匹配
   * @returns 安装是否成功
   */
  const installCore = async (version: string): Promise<boolean> => {
    installing.value = true
    try {
      // 安装前停止所有运行中的节点
      await stopAllNodes()
      // 按平台/架构生成压缩包文件名（与下载文件名一致）
      const tpl = template(EASYTIER_NAME)
      const filename = tpl({
        osType: getOsType(),
        osArch: getArch(),
        version
      }).replace(/^\//, '')
      const zipPath = await join(CORE_PATH, filename)
      // 工具函数基于 BaseDirectory.Resource，必须传相对路径，不能用 resourceDir() 拼绝对路径
      return await extractFile(zipPath, CORE_PATH)
    } catch (e) {
      console.error('安装核心失败:', e)
      return false
    } finally {
      installing.value = false
    }
  }

  return { installing, installCore }
}
