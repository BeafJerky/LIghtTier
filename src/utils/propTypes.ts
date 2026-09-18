/**
 * vue-types 属性校验器封装
 *
 * 在默认预设基础上扩展 style 属性（支持对象 / 字符串两种写法），
 * 供组件以 propTypes.xxx 声明 props 校验规则。
 */
import { VueTypeValidableDef, VueTypesInterface, createTypes, toValidableType } from 'vue-types'
import { CSSProperties } from 'vue'

type PropTypes = VueTypesInterface & {
  readonly style: VueTypeValidableDef<CSSProperties>
}
const newPropTypes = createTypes({
  func: undefined,
  bool: undefined,
  string: undefined,
  number: undefined,
  object: undefined,
  integer: undefined
}) as PropTypes

class propTypes extends newPropTypes {
  static get style() {
    return toValidableType('style', {
      type: [String, Object]
    })
  }
}

export { propTypes }
