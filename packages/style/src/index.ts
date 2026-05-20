/**
 * @browser/style — 样式解析
 *
 * 对应 Chrome/Blink 的 third_party/blink/renderer/core/css/resolver/
 *
 * 实现 CSS 层叠、特异性、继承和计算样式的完整流程。
 *
 * 主要导出：
 *   - StyleResolver：样式解析器入口
 *   - Specificity：特异性计算
 *   - SelectorMatcher：选择器匹配
 *   - ComputedStyleDefaults：默认样式值
 *   - USER_AGENT_CSS：用户代理样式表
 */

export { StyleResolver } from './StyleResolver';
export { calculateSpecificity, compareSpecificity } from './Specificity';
export { matchesSelector } from './SelectorMatcher';
export {
  createDefaultComputedStyle,
  INHERITED_PROPERTIES,
} from './ComputedStyleDefaults';
export { USER_AGENT_CSS } from './user-agent';
