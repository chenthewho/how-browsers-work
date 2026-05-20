/**
 * 计算样式默认值
 *
 * 对应 Chrome/Blink 中的 ComputedStyle 初始值
 *
 * 每个 CSS 属性都有一个"初始值"（initial value），
 * 当没有样式规则指定某个属性时，使用初始值。
 * 有些属性还会从父元素继承（如 font-size、color）。
 */

import type { IComputedStyle } from '@browser/shared';

/**
 * 创建默认的计算样式（所有 CSS 属性的初始值）
 *
 * CSS 规范的初始值定义：
 * https://www.w3.org/TR/CSS22/propidx.html
 */
export function createDefaultComputedStyle(): IComputedStyle {
  return {
    // 盒模型
    display: 'inline',        // 初始值：inline
    width: 'auto',
    height: 'auto',
    minWidth: 0,
    maxWidth: Infinity,
    minHeight: 0,
    maxHeight: Infinity,

    // 内边距（初始值：0）
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,

    // 边框（初始值：0，但 table 等元素的 UA 样式会覆盖）
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,

    // 外边距（初始值：0）
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,

    // 定位（初始值：static）
    position: 'static',
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto',

    // 排版
    fontSize: 16,            // 用户代理默认值：16px（约 12pt）
    fontFamily: 'serif',
    fontWeight: 400,         // normal
    fontStyle: 'normal',
    lineHeight: 20,          // 约 1.2 * fontSize
    textAlign: 'left',
    whiteSpace: 'normal',

    // 颜色
    color: { r: 0, g: 0, b: 0, a: 1 },               // 初始值：黑色
    backgroundColor: null,                              // 初始值：透明

    // 其他
    overflow: 'visible',
    opacity: 1,
    zIndex: 0,
    boxSizing: 'content-box',

    // Flex（初始值）
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 'auto',
  };
}

/**
 * 可继承的 CSS 属性列表
 *
 * 对应 CSS 规范中标记为 "Inherited: yes" 的属性
 * 这些属性如果没有被显式设置，会从父元素继承。
 */
export const INHERITED_PROPERTIES = new Set([
  'color',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'textAlign',
  'whiteSpace',
  'visibility',
  'cursor',
]);

/**
 * 简写属性展开映射
 *
 * 例如：margin: 10px 20px → marginTop: 10, marginRight: 20, marginBottom: 10, marginLeft: 20
 *        border: 1px solid red → borderTopWidth: 1, borderRightWidth: 1, ...
 */
export function expandShorthand(property: string, value: any, style: Partial<IComputedStyle>): void {
  switch (property) {
    case 'margin':
      expandFourSides(value, style, 'margin');
      break;
    case 'padding':
      expandFourSides(value, style, 'padding');
      break;
    case 'border-width':
      expandFourSides(value, style, 'border');
      break;
    case 'border':
      // 简化：只提取 border-width
      if (typeof value === 'number') {
        style.borderTopWidth = value;
        style.borderRightWidth = value;
        style.borderBottomWidth = value;
        style.borderLeftWidth = value;
      }
      break;
  }
}

/**
 * 展开四边的简写属性
 * 例如：margin: 10px → 四边都是 10px
 *       margin: 10px 20px → 上下 10px，左右 20px
 *       margin: 10px 20px 30px → 上 10px，左右 20px，下 30px
 *       margin: 10px 20px 30px 40px → 上右下左
 */
function expandFourSides(value: any, style: Partial<IComputedStyle>, prefix: string): void {
  const values: number[] = Array.isArray(value) ? value : [value];

  if (values.length === 1) {
    (style as any)[`${prefix}Top`] = values[0];
    (style as any)[`${prefix}Right`] = values[0];
    (style as any)[`${prefix}Bottom`] = values[0];
    (style as any)[`${prefix}Left`] = values[0];
  } else if (values.length === 2) {
    (style as any)[`${prefix}Top`] = values[0];
    (style as any)[`${prefix}Right`] = values[1];
    (style as any)[`${prefix}Bottom`] = values[0];
    (style as any)[`${prefix}Left`] = values[1];
  } else if (values.length === 3) {
    (style as any)[`${prefix}Top`] = values[0];
    (style as any)[`${prefix}Right`] = values[1];
    (style as any)[`${prefix}Bottom`] = values[2];
    (style as any)[`${prefix}Left`] = values[1];
  } else if (values.length === 4) {
    (style as any)[`${prefix}Top`] = values[0];
    (style as any)[`${prefix}Right`] = values[1];
    (style as any)[`${prefix}Bottom`] = values[2];
    (style as any)[`${prefix}Left`] = values[3];
  }
}
