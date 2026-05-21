/**
 * 布局引擎（Layout Engine）
 *
 * 对应 Chrome/Blink 中的 LayoutEngine / LayoutBlockFlow / LayoutInline
 *
 * 布局引擎接收渲染树（LayoutBox tree），计算每个盒子的位置和尺寸。
 * 这是渲染流水线中最关键的一步 —— 将 CSS 属性转换为屏幕坐标。
 *
 * Chrome 的布局流程（简化）：
 *   LayoutView::UpdateLayout()
 *     → LayoutBlock::UpdateLayout()
 *       → LayoutBlock::LayoutChildren()
 *         → 对每个子元素调用 Layout()
 *           → 子元素递归布局
 *
 * 布局的核心算法：
 *   1. 计算宽度（从上往下，由包含块决定）
 *   2. 计算高度（从下往上，由子元素内容决定）
 *   3. 确定位置（x, y 坐标）
 *
 * 两种基本的格式化上下文：
 *   - BFC（Block Formatting Context）：块级元素垂直堆叠
 *   - IFC（Inline Formatting Context）：行内元素水平排列，自动换行
 */

import { LayoutMode, NodeType } from '@browser/shared';
import type { LayoutBox, IElement } from '@browser/shared';
import { buildLayoutTree } from './LayoutBoxImpl';

export class LayoutEngine {
  // 视口尺寸（初始包含块）
  private viewportWidth: number;
  private viewportHeight: number;

  constructor(viewportWidth: number = 800, viewportHeight: number = 600) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  /**
   * 对文档执行布局计算
   *
   * @returns 布局树的根节点（所有盒子的位置和尺寸已计算完成）
   */
  layout(documentElement: IElement): LayoutBox {
    // 1. 构建布局树
    const rootBox = buildLayoutTree(documentElement);
    if (!rootBox) {
      throw new Error('Cannot layout: no root layout box');
    }

    // 2. 设置根盒子的初始尺寸为视口大小
    rootBox.rect = {
      x: 0,
      y: 0,
      width: this.viewportWidth,
      height: this.viewportHeight,
    };

    // 3. 递归布局
    this.layoutBox(rootBox, this.viewportWidth);

    return rootBox;
  }

  /**
   * 对单个盒子执行布局
   *
   * @param box 要布局的盒子
   * @param containingBlockWidth 包含块的内容区宽度
   *
   * Chrome 中对应 LayoutBox::Layout() 方法。
   * 根据盒子的 display 类型分派到不同的布局算法：
   *   - block → layoutBlock
   *   - inline → layoutInline
   */
  private layoutBox(box: LayoutBox, containingBlockWidth: number): void {
    switch (box.layoutMode) {
      case LayoutMode.BLOCK:
        this.layoutBlock(box, containingBlockWidth);
        break;
      case LayoutMode.INLINE:
        this.layoutInline(box, containingBlockWidth);
        break;
      case LayoutMode.FLEX:
        // 简化：flex 降级为 block 布局
        this.layoutBlock(box, containingBlockWidth);
        break;
    }
  }

  // ============================================================
  // 块级布局（BFC — Block Formatting Context）
  //
  // 对应 Chrome 的 LayoutBlockFlow::LayoutBlockChildren()
  //
  // 块级布局的核心规则：
  //   1. 宽度由包含块决定（width: auto 时填满整个包含块）
  //   2. 子元素垂直排列，每个子元素的 y = 前一个子元素的底部
  //   3. 高度由子元素的内容确定（自动撑高）
  //   4. 相邻块级子元素之间发生外边距合并
  // ============================================================
  private layoutBlock(box: LayoutBox, containingBlockWidth: number): void {
    const style = box.style;
    const contentWidth = this.getContentWidth(containingBlockWidth, box);

    // 保存当前 Y 偏移（子元素从上往下排列）
    let currentY = box.padding.top;
    let previousChildBottomMargin = 0;

    // 分类子元素：块级子元素 vs 行内子元素
    // 行内子元素会被包裹在一个匿名块中（如果需要的话）
    // 这里简化处理：先处理块级子元素，再处理行内子元素
    const blockChildren: LayoutBox[] = [];
    const inlineChildren: LayoutBox[] = [];

    for (const child of box.children) {
      if (child.layoutMode === LayoutMode.BLOCK) {
        blockChildren.push(child);
      } else {
        inlineChildren.push(child);
      }
    }

    // 布局块级子元素
    for (const child of blockChildren) {
      // --- 外边距合并 ---
      // 当两个相邻的块级元素的垂直外边距相遇时，它们会合并
      // 合并后的外边距 = max(margin1, margin2)，而不是 margin1 + margin2
      // Chrome 中对应 LayoutBlock::CollapseMargins()
      const mt = typeof child.margin.top === 'number' ? child.margin.top : 0;
      const collapsedMargin = this.collapseMargins(
        previousChildBottomMargin,
        mt
      );

      // 上一个子元素的底部到当前子元素的顶部：
      // 上一个的底部 = 上一个的 y + 高度 + 外底边距
      // 当前顶部 = 上一个底部 + 合并后的 margin
      // 但第一个子元素的 margin-top 直接加到 currentY 上（没有前一个的 margin 合并）
      if (blockChildren.indexOf(child) === 0) {
        currentY += mt;
      } else {
        // 前一个和当前的 margin 已经合并，所以加 collapsed
        // 但前一个的 margin-bottom 已经在 previousChildBottomMargin 中了
        // 当 collapsedMargin > previousChildBottomMargin 时，多出的部分需要补
        if (collapsedMargin > previousChildBottomMargin) {
          currentY += collapsedMargin - previousChildBottomMargin;
        }
      }

      // 设置子元素的位置（相对于包含块的内容区）
      // 处理 auto margin（水平居中）
      const marginLeft = typeof child.margin.left === 'number' ? child.margin.left : 0;
      const marginRight = typeof child.margin.right === 'number' ? child.margin.right : 0;
      const isAutoLeft = child.margin.left === 'auto';
      const isAutoRight = child.margin.right === 'auto';

      // 计算子元素可用宽度
      let availableWidth = contentWidth - marginLeft - marginRight
        - child.border.left - child.border.right
        - child.padding.left - child.padding.right;
      if (!isAutoLeft) availableWidth -= marginLeft;
      if (!isAutoRight) availableWidth -= marginRight;

      // 计算子元素的实际内容宽度
      this.layoutBox(child, contentWidth);

      // 处理 auto margin 居中
      if (isAutoLeft || isAutoRight) {
        const totalMargin = contentWidth - child.rect.width
          - (isAutoLeft ? 0 : (marginLeft + child.border.left + child.padding.left))
          - (isAutoRight ? 0 : (marginRight + child.border.right + child.padding.right))
          - child.border.left - child.border.right
          - child.padding.left - child.padding.right;

        if (isAutoLeft && isAutoRight) {
          // 双 auto：水平居中
          const autoM = Math.max(0, totalMargin / 2);
          child.rect.x = box.padding.left + autoM;
        } else if (isAutoLeft) {
          child.rect.x = box.padding.left + Math.max(0, totalMargin);
        } else {
          child.rect.x = box.padding.left + marginLeft;
        }
      } else {
        child.rect.x = box.padding.left + marginLeft;
      }
      child.rect.y = currentY;

      // 子元素高度（包含内容的完整高度）
      // 处理 auto margin：垂直方向 auto = 0（mt 已在上面声明）
      const mb = typeof child.margin.bottom === 'number' ? child.margin.bottom : 0;
      const childTotalHeight = child.rect.height +
        mt + mb +
        child.border.top + child.border.bottom +
        child.padding.top + child.padding.bottom;

      // 更新 currentY（移到子元素的底部）
      currentY = child.rect.y + child.rect.height +
        child.padding.top + child.padding.bottom +
        child.border.top + child.border.bottom +
        mb;

      // 记录当前子元素的底部外边距，用于下一个子元素的外边距合并
      previousChildBottomMargin = mb;
    }

    // 布局行内子元素（如果有）
    if (inlineChildren.length > 0) {
      this.layoutInlineChildren(box, inlineChildren, contentWidth, currentY);
      // 行内子元素会增加 currentY
      currentY += box.padding.bottom;  // 简化处理
    }

    // 设置盒子的高度
    // 如果没有指定高度，高度 = 内容高度 + padding + border
    if (style.height === 'auto') {
      box.rect.height = currentY + box.padding.bottom;
      // 确保高度至少包含所有子元素
    } else {
      box.rect.height = style.height;
    }

    // 设置盒子的宽度
    box.rect.width = contentWidth;

    // 处理 min/max 约束
    box.rect.height = Math.max(style.minHeight, Math.min(style.maxHeight, box.rect.height));
  }

  // ============================================================
  // 行内布局（IFC — Inline Formatting Context）
  //
  // 对应 Chrome 的 LayoutInline / InlineFlowBox
  //
  // 行内布局的核心规则：
  //   1. 行内元素（span, a, em 等）和文本从左向右水平排列
  //   2. 当行宽超过包含块宽度时换行
  //   3. 每行的高度由行内元素的最大高度决定（line-height 影响）
  //   4. 文本在行内基线对齐
  // ============================================================
  private layoutInline(box: LayoutBox, containingBlockWidth: number): void {
    // 行内盒子的宽度由其内容决定
    const contentWidth = containingBlockWidth;

    let currentX = 0;
    let currentY = 0;
    let lineHeight = box.style.lineHeight || box.style.fontSize * 1.2;

    // 对每个行内子元素进行布局
    for (const child of box.children) {
      if (child.textContent !== null) {
        // 文本节点：计算文本宽度
        const textWidth = this.measureText(child.textContent, child.style.fontSize);

        // 检查是否需要换行
        if (currentX + textWidth > contentWidth && currentX > 0) {
          // 换行
          currentX = 0;
          currentY += lineHeight;
        }

        child.rect.x = currentX;
        child.rect.y = currentY;
        child.rect.width = textWidth;
        child.rect.height = lineHeight;

        currentX += textWidth;
      } else if (child.layoutMode === LayoutMode.INLINE) {
        // 嵌套的行内元素
        this.layoutInline(child, contentWidth - currentX);
        child.rect.x = currentX;
        child.rect.y = currentY;
        currentX += child.rect.width;
      }
    }

    // 行内盒子高度 = 所有行的高度之和
    if (box.children.length > 0) {
      box.rect.height = currentY + lineHeight;
    } else {
      box.rect.height = lineHeight;
    }

    box.rect.width = contentWidth;
  }

  /**
   * 在块级容器内布局行内子元素
   * 这是 BFC 中的 IFC 部分
   */
  private layoutInlineChildren(
    container: LayoutBox,
    children: LayoutBox[],
    contentWidth: number,
    startY: number
  ): void {
    let currentX = container.padding.left;
    let currentY = startY;
    let lineHeight = container.style.lineHeight || container.style.fontSize * 1.2;
    let maxLineHeight = lineHeight;

    for (const child of children) {
      if (child.textContent !== null) {
        const textWidth = this.measureText(child.textContent, child.style.fontSize);

        // 换行检查
        if (currentX + textWidth > contentWidth + container.padding.left && currentX > container.padding.left) {
          currentX = container.padding.left;
          currentY += maxLineHeight;
          maxLineHeight = lineHeight;
        }

        child.rect.x = currentX;
        child.rect.y = currentY;
        child.rect.width = textWidth;
        child.rect.height = lineHeight;

        currentX += textWidth;
        maxLineHeight = Math.max(maxLineHeight, lineHeight);
      } else if (child.layoutMode === LayoutMode.INLINE) {
        // 行内元素
        this.layoutInline(child, contentWidth);
        child.rect.x = currentX;
        child.rect.y = currentY;
        currentX += child.rect.width;
        maxLineHeight = Math.max(maxLineHeight, child.rect.height);
      }
    }
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /**
   * 计算元素的内容区宽度
   *
   * Chrome 中块级元素的宽度计算（简化）：
   *   contentWidth = containingBlockWidth - marginLeft - marginRight
   *                   - borderLeft - borderRight - paddingLeft - paddingRight
   *
   * box-sizing: border-box 时，width 包含了 padding 和 border
   */
  private getContentWidth(containingBlockWidth: number, box: LayoutBox): number {
    const style = box.style;

    if (style.width !== 'auto') {
      if (style.boxSizing === 'border-box') {
        return style.width;
      }
      return style.width;
    }

    // auto 宽度：填满包含块
    const horizontalMargin =
      (typeof style.marginLeft === 'number' ? style.marginLeft : 0) +
      (typeof style.marginRight === 'number' ? style.marginRight : 0);

    const horizontalPadding = style.paddingLeft + style.paddingRight;
    const horizontalBorder = style.borderLeftWidth + style.borderRightWidth;

    return containingBlockWidth - horizontalMargin - horizontalPadding - horizontalBorder;
  }

  /**
   * 外边距合并算法
   *
   * 对应 Chrome 的 LayoutBlock::CollapseMargins()
   *
   * 规则：
   *   - 只有垂直外边距会合并（margin-top 和 margin-bottom）
   *   - 只有相邻的块级元素之间会合并
   *   - 合并后的值 = max(margin1, margin2)（正值）
   *   - 负值会与正值抵消
   *
   * 例如：
   *   div1 { margin-bottom: 20px; }
   *   div2 { margin-top: 30px; }
   *   → 它们之间的间距 = max(20, 30) = 30px（不是 50px）
   */
  private collapseMargins(margin1: number, margin2: number): number {
    // 简化实现：两个正值取最大值
    if (margin1 >= 0 && margin2 >= 0) {
      return Math.max(margin1, margin2);
    }

    // 一正一负：相加（抵消）
    if (margin1 >= 0 && margin2 < 0) {
      return margin1 + margin2;
    }
    if (margin1 < 0 && margin2 >= 0) {
      return margin1 + margin2;
    }

    // 两个负值：取最小值（最负）
    return Math.min(margin1, margin2);
  }

  /**
   * 测量文本宽度
   *
   * Chrome 使用复杂的文本测量引擎（HarfBuzz + 字体系统）。
   * 这里简化为：每个字符宽度 ≈ fontSize * 0.6（等宽近似）
   *
   * 中文字符宽度 ≈ fontSize，英文 ≈ fontSize * 0.6
   */
  private measureText(text: string, fontSize: number): number {
    let width = 0;
    for (const ch of text) {
      if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch)) {
        // 中日韩字符：宽度 ≈ fontSize
        width += fontSize;
      } else if (ch === ' ') {
        width += fontSize * 0.3;
      } else {
        // 拉丁字符：宽度 ≈ fontSize * 0.6
        width += fontSize * 0.6;
      }
    }
    return width;
  }
}
