/**
 * 渲染流水线（Render Pipeline）
 *
 * 对应 Chrome/Blink 中的 DocumentLoader / Frame / RenderingPipeline
 *
 * 这是渲染流水线的编排器，负责协调所有渲染阶段：
 *   1. HTML 解析 → DOM 树
 *   2. CSS 解析 → 样式表
 *   3. 样式计算 → ComputedStyle
 *   4. 布局计算 → LayoutBox 树
 *
 * 数据流（与 Chrome 一致）：
 *   HTML bytes → [HTML Parser] → DOM tree
 *   CSS bytes  → [CSS Parser]  → Stylesheet
 *                               ↓
 *                      [Style Resolver] → Computed styles
 *                               ↓
 *                      [Layout Engine]  → Layout boxes
 */

import { HTMLParser } from '@browser/html-parser';
import { CSSParser } from '@browser/css-parser';
import { StyleResolver, USER_AGENT_CSS } from '@browser/style';
import { LayoutEngine } from '@browser/layout';
import { StyleOrigin } from '@browser/shared';
import type { IDocument, LayoutBox } from '@browser/shared';

export interface PipelineResult {
  document: IDocument;
  layoutRoot: LayoutBox;
}

export class RenderPipeline {
  private htmlParser: HTMLParser;
  private cssParser: CSSParser;
  private styleResolver: StyleResolver;
  private layoutEngine: LayoutEngine;

  constructor(viewportWidth: number = 800, viewportHeight: number = 600) {
    this.htmlParser = new HTMLParser();
    this.cssParser = new CSSParser();

    // 加载用户代理样式表
    const uaStylesheet = this.cssParser.parse(USER_AGENT_CSS, StyleOrigin.USER_AGENT);
    this.styleResolver = new StyleResolver(uaStylesheet);
    this.layoutEngine = new LayoutEngine(viewportWidth, viewportHeight);
  }

  /**
   * 执行完整的渲染流水线
   *
   * @param html HTML 源代码
   * @param cssList 额外的 CSS 样式表（来自 <style> 标签）
   * @returns 文档和布局结果
   */
  render(html: string, cssList: string[] = []): PipelineResult {
    // 1. HTML 解析 → DOM 树
    const document = this.htmlParser.parse(html);

    // 2. CSS 解析 → 样式表列表
    const authorStylesheets = cssList.map(css =>
      this.cssParser.parse(css, StyleOrigin.AUTHOR)
    );

    // 3. 样式计算 → 每个元素挂载 ComputedStyle
    this.styleResolver.resolve(document, authorStylesheets);

    // 4. 布局计算 → LayoutBox 树（位置和尺寸）
    const layoutRoot = this.layoutEngine.layout(document.documentElement!);

    return { document, layoutRoot };
  }
}
