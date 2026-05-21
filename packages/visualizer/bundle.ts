/**
 * 浏览器可视化入口 — esbuild 打包起点
 *
 * 把所有 @browser/* 渲染管线模块重新导出到 window.Browser
 * 浏览器中的 JS 通过 window.Browser.RenderPipeline 等调用
 */

export { RenderPipeline } from '@browser/renderer-process';
export { HTMLParser, HTMLTokenizer, TokenType } from '@browser/html-parser';
export { CSSParser, CSSTokenType, SelectorParser } from '@browser/css-parser';
export { StyleResolver, matchesSelector, calculateSpecificity, USER_AGENT_CSS } from '@browser/style';
export { LayoutEngine, buildLayoutTree } from '@browser/layout';
export { LayoutViewer } from '@browser/output';
export { StyleOrigin, NodeType } from '@browser/shared';
export type {
  IDocument, IElement, IComputedStyle,
  LayoutBox, StyleSheet, StyleRule, ComplexSelector,
  SerializedLayoutBox,
} from '@browser/shared';
