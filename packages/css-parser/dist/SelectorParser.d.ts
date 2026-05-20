/**
 * CSS 选择器解析器（Selector Parser）
 *
 * 对应 Chrome/Blink 中的 CSSSelectorParser
 *
 * 将选择器字符串解析为结构化的选择器对象，
 * 用于后续的样式匹配和特异性计算。
 *
 * 支持的选择器类型：
 *   - 类型选择器：div, span, p
 *   - 通用选择器：*
 *   - ID 选择器：#main
 *   - 类选择器：.container
 *   - 属性选择器：[attr], [attr=value], [attr~=value]
 *   - 伪类选择器：:hover, :first-child, :nth-child(2)
 *   - 组合器：空格(后代), >(子), +(邻接兄弟), ~(后续兄弟)
 *
 * 选择器结构（对应 CSS 规范）：
 *   复杂选择器（ComplexSelector）由若干个复合选择器通过组合器连接。
 *   复合选择器（CompoundSelector）由若干简单选择器组成（不含组合器）。
 *
 * 例如：div.container > p + span
 *   这是一个复杂选择器，包含三个复合选择器：
 *     1. div.container  （类型 + 类）
 *     2. p              （类型）
 *     3. span           （类型）
 *   组合器：> (子代), + (邻接兄弟)
 */
import type { ComplexSelector } from '@browser/shared';
export interface SelectorParseResult {
    selectors: ComplexSelector[];
}
export declare class SelectorParser {
    private input;
    private pos;
    /**
     * 解析选择器列表字符串
     * 例如："h1, h2.title, div > p" → [ComplexSelector, ComplexSelector, ComplexSelector]
     *
     * 逗号分隔的是多个独立的选择器（选择器列表）
     */
    parse(selectorText: string): ComplexSelector[];
    /**
     * 解析一个复杂选择器
     * 例如：div.container > p + span
     */
    private parseComplexSelector;
    /**
     * 解析一个复合选择器
     * 例如：div.container#main[data-x="y"]:hover
     *
     * 复合选择器由多个简单选择器组成，它们之间没有组合器分隔。
     * 所有条件必须同时满足（AND 关系）。
     */
    private parseCompoundSelector;
    /**
     * 读取 ID 选择器：#main
     */
    private readID;
    /**
     * 读取类选择器：.container
     */
    private readClass;
    /**
     * 读取属性选择器：[attr], [attr=value], [attr~=value] 等
     */
    private readAttribute;
    /**
     * 读取伪类选择器：:hover, :first-child, :nth-child(2n+1)
     */
    private readPseudoClass;
    /**
     * 读取组合器：>, +, ~
     * 返回 null 表示没有显式组合器（隐式后代选择器）
     */
    private readCombinator;
    /**
     * 检查当前字符是否是组合器
     */
    private isCombinator;
    /**
     * 检查是否到达选择器结束
     */
    private isEndOfSelector;
    /**
     * 读取标识符（字母、数字、连字符组成的名字）
     */
    private readIdent;
    private current;
    private peek;
    private skipWhitespace;
}
//# sourceMappingURL=SelectorParser.d.ts.map