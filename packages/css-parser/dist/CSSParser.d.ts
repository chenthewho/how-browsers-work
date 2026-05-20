/**
 * CSS 解析器（Parser）
 *
 * 对应 Chrome/Blink 中的 CSSParserImpl
 *
 * CSS 解析器消费词法分析器产生的 token 流，生成样式表 AST。
 * 解析过程包括：
 *   1. 样式规则解析（选择器列表 + 声明列表）
 *   2. @ 规则解析（@media、@import 等）
 *   3. 选择器解析（类型、ID、类、属性、伪类、组合器）
 *   4. 属性值解析（数值、颜色、关键字、函数等）
 *
 * 数据流：CSS 字符串 → [CSSTokenizer] → Token 流 → [CSSParser] → StyleSheet
 */
import { StyleOrigin } from '@browser/shared';
import type { StyleSheet } from '@browser/shared';
export declare class CSSParser {
    private tokenizer;
    private selectorParser;
    private tokens;
    private pos;
    constructor();
    /**
     * 解析 CSS 文本为样式表
     *
     * @param cssText CSS 源代码
     * @param origin 样式来源（作者/用户代理/用户）
     */
    parse(cssText: string, origin?: StyleOrigin): StyleSheet;
    /**
     * 解析一条 CSS 规则
     * 例如：h1, h2.title { color: red; margin: 10px 20px; }
     */
    private parseRule;
    /**
     * 解析 { } 内部的声明列表
     * 例如：color: red; margin: 10px 20px;
     */
    private parseDeclarationList;
    /**
     * 解析单个声明
     * 例如：color: red !important
     */
    private parseDeclaration;
    /**
     * 解析 CSS 值
     *
     * CSS 值可以是：
     *   - 单个关键字：auto, none, block
     *   - 数值 + 单位：16px, 2em, 50%
     *   - 颜色：red, #ff0000, rgb(255, 0, 0)
     *   - 函数：calc(), rgba(), var()
     *   - 复合值：1px solid red（表现为多个值的序列）
     *
     * 简化处理：将值序列拼接到一起，解析第一个值为主要类型
     */
    private parseValue;
    /**
     * 解析函数值：rgb(255, 0, 0), calc(100% - 10px) 等
     */
    private parseFunctionValue;
    /**
     * 解析十六进制颜色：#ff0000 → { r: 255, g: 0, b: 0, a: 1 }
     */
    private parseHexColor;
    /**
     * 将关键字值解析为具体类型
     * 例如：auto → keyword, red → color
     */
    private resolveKeywordValue;
    private current;
    private isEOF;
    /**
     * 跳过空格
     */
    private skipWhitespace;
    /**
     * 收集从当前位置到 { 之前的所有 token 文本（选择器部分）
     */
    private consumeUntilBrace;
    /**
     * 跳过 @ 规则（如 @media { ... }）
     */
    private skipAtRule;
    /**
     * 跳到下一条规则
     */
    private skipToNextRule;
    /**
     * 跳到下一个声明（跳过非法内容）
     */
    private skipToNextDeclaration;
}
//# sourceMappingURL=CSSParser.d.ts.map