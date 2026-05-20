/**
 * @browser/layout — 布局引擎
 *
 * 对应 Chrome/Blink 的 third_party/blink/renderer/core/layout/
 *
 * 实现块级和行内布局，计算每个元素的位置和尺寸。
 *
 * 主要导出：
 *   - LayoutEngine：布局引擎入口
 *   - buildLayoutTree：从 DOM 构建布局树
 */

export { LayoutEngine } from './LayoutEngine';
export { buildLayoutTree, createLayoutBox, createTextLayoutBox } from './LayoutBoxImpl';
