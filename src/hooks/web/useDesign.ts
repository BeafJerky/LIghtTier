/**
 * 设计变量工具 — 暴露 less 设计变量并生成带命名空间前缀的类名
 * （variables.module.less 经 vite additionalData 全局注入）
 */
import variables from '@/styles/variables.module.less'

export const useDesign = () => {
  const lessVariables = variables

  /**
   * @param scope 类名
   * @returns 返回空间名-类名
   */
  const getPrefixCls = (scope: string) => {
    return `${lessVariables.namespace}-${scope}`
  }

  return {
    variables: lessVariables,
    getPrefixCls
  }
}
