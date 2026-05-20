/**
 * 布局盒子实现
 *
 * 对应 Chrome/Blink 中的 LayoutBox / LayoutObject
 *
 * 布局盒子是渲染树的节点。它从 DOM 元素和计算样式构建而来。
 * 每个可视的 DOM 元素对应一个布局盒子（display:none 的元素不产生布局盒子）。
 *
 * 布局盒子的类型由 display 属性决定：
 *   - block → 块级盒子，参与块级格式化上下文（BFC）
 *   - inline → 行内盒子，参与行内格式化上下文（IFC）
 *   - inline-block → 行内块级盒子
 *   - flex → Flex 容器
 *   - none → 不创建盒子
 *   - table/table-row/table-cell → 表格相关盒子（简化为块级）
 */

import { LayoutMode } from '@browser/shared';
import type { IElement, IComputedStyle, EdgeSizes, Rect, LayoutBox } from '@browser/shared';
import { NodeType } from '@browser/shared';

let nextId = 0;

/**
 * 从 DOM 元素创建布局盒子
 */
export function createLayoutBox(element: IElement, parent: LayoutBox | null = null): LayoutBox | null {
  const style = element.computedStyle;
  if (!style) return null;

  // display:none 不创建盒子
  if (style.display === 'none') return null;

  const layoutMode = displayToLayoutMode(style.display);

  const box: LayoutBox = {
    id: `box_${nextId++}`,
    element,

    // 位置和尺寸默认为 0，由布局引擎填充
    rect: { x: 0, y: 0, width: 0, height: 0 },

    // 盒模型边缘（从计算样式复制）
    margin: {
      top: typeof style.marginTop === 'number' ? style.marginTop : 0,
      right: typeof style.marginRight === 'number' ? style.marginRight : 0,
      bottom: typeof style.marginBottom === 'number' ? style.marginBottom : 0,
      left: typeof style.marginLeft === 'number' ? style.marginLeft : 0,
    },
    border: {
      top: style.borderTopWidth,
      right: style.borderRightWidth,
      bottom: style.borderBottomWidth,
      left: style.borderLeftWidth,
    },
    padding: {
      top: style.paddingTop,
      right: style.paddingRight,
      bottom: style.paddingBottom,
      left: style.paddingLeft,
    },

    layoutMode,
    parent,
    children: [],
    textContent: null,
    style,
  };

  return box;
}

/**
 * 为文本节点创建行内文本盒子
 * 文本节点没有自己的 display，但会产生行内盒子
 */
export function createTextLayoutBox(text: string, parent: LayoutBox): LayoutBox {
  const parentStyle = parent.style;

  return {
    id: `text_${nextId++}`,
    element: null,  // 文本盒子没有对应的元素

    rect: { x: 0, y: 0, width: 0, height: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },

    layoutMode: LayoutMode.INLINE,
    parent,
    children: [],
    textContent: text,
    style: parentStyle, // 使用父元素的样式
  };
}

/**
 * Build the LayoutBox tree from a styled DOM
 *
 * 构建渲染树的核心规则：
 * 1. 遍历 DOM 树
 * 2. 跳过 display:none 的元素和不可见元素（head, script, style 等）
 * 3. 为每个可视元素创建 LayoutBox
 * 4. 将文本节点转换为文本盒子（内嵌在行内元素流中）
 */
export function buildLayoutTree(element: IElement, parent: LayoutBox | null = null): LayoutBox | null {
  const box = createLayoutBox(element, parent);
  if (!box) return null;

  // 递归处理子节点
  let child = element.firstChild;
  while (child) {
    if (child.nodeType === NodeType.ELEMENT_NODE) {
      const childBox = buildLayoutTree(child as IElement, box);
      if (childBox) {
        box.children.push(childBox);
      }
    } else if (child.nodeType === NodeType.TEXT_NODE) {
      // 文本节点：如果父元素是块级，创建匿名块包裹；否则创建行内文本盒子
      const textContent = child.textContent;
      if (textContent.trim()) {
        const textBox = createTextLayoutBox(textContent, box);
        box.children.push(textBox);
      }
    }
    child = child.nextSibling;
  }

  return box;
}

/**
 * display 值 → 布局模式映射
 */
function displayToLayoutMode(display: string): LayoutMode {
  switch (display) {
    case 'block':
    case 'list-item':
    case 'table':
    case 'table-row':
    case 'table-cell':
    case 'table-row-group':
    case 'table-header-group':
    case 'table-footer-group':
      return LayoutMode.BLOCK;
    case 'inline':
      return LayoutMode.INLINE;
    case 'inline-block':
      return LayoutMode.BLOCK;  // 行内块表现为块级，但由 IFC 管理位置
    case 'flex':
      return LayoutMode.FLEX;
    case 'none':
    default:
      return LayoutMode.BLOCK;
  }
}
