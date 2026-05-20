"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSParser = void 0;
const CSSTokenizer_1 = require("./CSSTokenizer");
const SelectorParser_1 = require("./SelectorParser");
const shared_1 = require("@browser/shared");
class CSSParser {
    tokenizer;
    selectorParser;
    tokens = [];
    pos = 0;
    constructor() {
        this.tokenizer = new CSSTokenizer_1.CSSTokenizer();
        this.selectorParser = new SelectorParser_1.SelectorParser();
    }
    /**
     * 解析 CSS 文本为样式表
     *
     * @param cssText CSS 源代码
     * @param origin 样式来源（作者/用户代理/用户）
     */
    parse(cssText, origin = shared_1.StyleOrigin.AUTHOR) {
        this.tokens = this.tokenizer.tokenize(cssText);
        this.pos = 0;
        const rules = [];
        while (!this.isEOF()) {
            this.skipWhitespace();
            if (this.isEOF())
                break;
            // 尝试解析一条规则
            const rule = this.parseRule();
            if (rule) {
                rules.push(rule);
            }
        }
        return { rules, origin };
    }
    /**
     * 解析一条 CSS 规则
     * 例如：h1, h2.title { color: red; margin: 10px 20px; }
     */
    parseRule() {
        this.skipWhitespace();
        // @ 规则（暂跳过）
        if (this.current().type === CSSTokenizer_1.CSSTokenType.AT_KEYWORD) {
            this.skipAtRule();
            return null;
        }
        // 解析选择器列表（在 { 之前的部分）
        const selectorText = this.consumeUntilBrace();
        if (!selectorText) {
            // 没有有效内容，跳过
            this.skipToNextRule();
            return null;
        }
        // 解析选择器
        let selectors;
        try {
            selectors = this.selectorParser.parse(selectorText);
        }
        catch {
            // 选择器解析失败，跳过这条规则
            this.skipToNextRule();
            return null;
        }
        // 解析声明列表（在 { } 内部的部分）
        const declarations = this.parseDeclarationList();
        if (declarations.length === 0) {
            return null;
        }
        return { selectors, declarations };
    }
    /**
     * 解析 { } 内部的声明列表
     * 例如：color: red; margin: 10px 20px;
     */
    parseDeclarationList() {
        const declarations = [];
        // 期待 {
        this.skipWhitespace();
        if (this.current().type !== CSSTokenizer_1.CSSTokenType.OPEN_BRACE) {
            return declarations;
        }
        this.pos++; // 跳过 {
        while (!this.isEOF()) {
            this.skipWhitespace();
            // 遇到 } 结束
            if (this.current().type === CSSTokenizer_1.CSSTokenType.CLOSE_BRACE) {
                this.pos++;
                break;
            }
            const declaration = this.parseDeclaration();
            if (declaration) {
                declarations.push(declaration);
            }
            // 跳过到下一个声明
            this.skipToNextDeclaration();
        }
        return declarations;
    }
    /**
     * 解析单个声明
     * 例如：color: red !important
     */
    parseDeclaration() {
        this.skipWhitespace();
        // 必须是标识符开头（属性名）
        if (this.current().type !== CSSTokenizer_1.CSSTokenType.IDENT) {
            return null;
        }
        const property = this.current().value;
        this.pos++;
        // 期待 :
        this.skipWhitespace();
        if (this.current().type !== CSSTokenizer_1.CSSTokenType.COLON) {
            return null;
        }
        this.pos++; // 跳过 :
        this.skipWhitespace();
        // 解析属性值
        const value = this.parseValue();
        if (!value) {
            return null;
        }
        // 检查 !important
        let important = false;
        this.skipWhitespace();
        if (this.current().type === CSSTokenizer_1.CSSTokenType.DELIM && this.current().value === '!') {
            this.pos++;
            this.skipWhitespace();
            if (this.current().type === CSSTokenizer_1.CSSTokenType.IDENT &&
                this.current().value.toLowerCase() === 'important') {
                this.pos++;
                important = true;
            }
        }
        // 期待 ; 或 }（由调用者处理）
        this.skipWhitespace();
        if (this.current().type === CSSTokenizer_1.CSSTokenType.SEMICOLON) {
            this.pos++; // 跳过 ;
        }
        return { property, value, important };
    }
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
    parseValue() {
        const token = this.current();
        // 关键字
        if (token.type === CSSTokenizer_1.CSSTokenType.IDENT) {
            this.pos++;
            return this.resolveKeywordValue(token.value);
        }
        // 带单位的数值
        if (token.type === CSSTokenizer_1.CSSTokenType.DIMENSION) {
            this.pos++;
            return {
                type: 'length',
                value: token.numericValue,
                unit: token.unit,
            };
        }
        // 百分比
        if (token.type === CSSTokenizer_1.CSSTokenType.PERCENTAGE) {
            this.pos++;
            return { type: 'percentage', value: token.numericValue * 100 };
        }
        // 纯数字
        if (token.type === CSSTokenizer_1.CSSTokenType.NUMBER) {
            this.pos++;
            return { type: 'number', value: token.numericValue };
        }
        // Hash 颜色：#ff0000
        if (token.type === CSSTokenizer_1.CSSTokenType.HASH) {
            this.pos++;
            return this.parseHexColor(token.value);
        }
        // 函数：rgb(), rgba(), calc() 等
        if (token.type === CSSTokenizer_1.CSSTokenType.FUNCTION) {
            return this.parseFunctionValue();
        }
        // 字符串
        if (token.type === CSSTokenizer_1.CSSTokenType.STRING) {
            this.pos++;
            return { type: 'string', value: token.value };
        }
        return null;
    }
    /**
     * 解析函数值：rgb(255, 0, 0), calc(100% - 10px) 等
     */
    parseFunctionValue() {
        const funcName = this.current().value.replace('(', '');
        this.pos++; // 跳过 function token
        // 收集函数参数
        const args = [];
        let argText = '';
        while (!this.isEOF() && this.current().type !== CSSTokenizer_1.CSSTokenType.CLOSE_PAREN) {
            if (this.current().type === CSSTokenizer_1.CSSTokenType.COMMA) {
                // 结束当前参数
                if (argText.trim()) {
                    args.push({ type: 'number', value: parseFloat(argText.trim()) || 0 });
                    argText = '';
                }
                this.pos++;
            }
            else {
                argText += this.current().value;
                this.pos++;
            }
        }
        // 最后一个参数
        if (argText.trim()) {
            args.push({ type: 'number', value: parseFloat(argText.trim()) || 0 });
        }
        if (this.current().type === CSSTokenizer_1.CSSTokenType.CLOSE_PAREN) {
            this.pos++; // 跳过 )
        }
        // 特殊处理 rgb/rgba 函数
        if ((funcName === 'rgb' || funcName === 'rgba') && args.length >= 3) {
            const r = Math.min(255, Math.max(0, extractNumber(args[0])));
            const g = Math.min(255, Math.max(0, extractNumber(args[1])));
            const b = Math.min(255, Math.max(0, extractNumber(args[2])));
            const a = args.length >= 4 ? Math.min(1, Math.max(0, extractNumber(args[3]))) : 1;
            return { type: 'color', r, g, b, a };
        }
        return { type: 'function', name: funcName, args };
    }
    /**
     * 解析十六进制颜色：#ff0000 → { r: 255, g: 0, b: 0, a: 1 }
     */
    parseHexColor(hex) {
        let h = hex.replace('#', '');
        // 缩写 #abc → #aabbcc
        if (h.length === 3) {
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        }
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return { type: 'color', r, g, b, a: 1 };
    }
    /**
     * 将关键字值解析为具体类型
     * 例如：auto → keyword, red → color
     */
    resolveKeywordValue(keyword) {
        // 已知颜色名映射
        const COLOR_MAP = {
            red: [255, 0, 0],
            blue: [0, 0, 255],
            green: [0, 128, 0],
            black: [0, 0, 0],
            white: [255, 255, 255],
            yellow: [255, 255, 0],
            purple: [128, 0, 128],
            orange: [255, 165, 0],
            gray: [128, 128, 128],
            grey: [128, 128, 128],
            transparent: [0, 0, 0],
            pink: [255, 192, 203],
            cyan: [0, 255, 255],
            magenta: [255, 0, 255],
            lime: [0, 255, 0],
            navy: [0, 0, 128],
            teal: [0, 128, 128],
            aqua: [0, 255, 255],
            maroon: [128, 0, 0],
            silver: [192, 192, 192],
            olive: [128, 128, 0],
        };
        if (keyword === 'transparent') {
            return { type: 'color', r: 0, g: 0, b: 0, a: 0 };
        }
        const color = COLOR_MAP[keyword.toLowerCase()];
        if (color) {
            return { type: 'color', r: color[0], g: color[1], b: color[2], a: 1 };
        }
        return { type: 'keyword', value: keyword };
    }
    // ============================================================
    // Token 流辅助方法
    // ============================================================
    current() {
        return this.pos < this.tokens.length
            ? this.tokens[this.pos]
            : { type: CSSTokenizer_1.CSSTokenType.EOF, value: '' };
    }
    isEOF() {
        return this.current().type === CSSTokenizer_1.CSSTokenType.EOF;
    }
    /**
     * 跳过空格
     */
    skipWhitespace() {
        while (this.current().type === CSSTokenizer_1.CSSTokenType.WHITESPACE) {
            this.pos++;
        }
    }
    /**
     * 收集从当前位置到 { 之前的所有 token 文本（选择器部分）
     */
    consumeUntilBrace() {
        let text = '';
        let depth = 0;
        while (!this.isEOF()) {
            const token = this.current();
            if (token.type === CSSTokenizer_1.CSSTokenType.OPEN_BRACE && depth === 0) {
                break;
            }
            if (token.type === CSSTokenizer_1.CSSTokenType.OPEN_PAREN) {
                depth++;
            }
            if (token.type === CSSTokenizer_1.CSSTokenType.CLOSE_PAREN) {
                depth--;
            }
            text += token.value;
            this.pos++;
        }
        return text.trim();
    }
    /**
     * 跳过 @ 规则（如 @media { ... }）
     */
    skipAtRule() {
        let braceDepth = 0;
        while (!this.isEOF()) {
            const token = this.current();
            if (token.type === CSSTokenizer_1.CSSTokenType.OPEN_BRACE)
                braceDepth++;
            if (token.type === CSSTokenizer_1.CSSTokenType.CLOSE_BRACE) {
                braceDepth--;
                if (braceDepth <= 0) {
                    this.pos++;
                    break;
                }
            }
            // 简单的 @ 规则（如 @import url(...);）以 ; 结束
            if (braceDepth === 0 && token.type === CSSTokenizer_1.CSSTokenType.SEMICOLON) {
                this.pos++;
                break;
            }
            this.pos++;
        }
    }
    /**
     * 跳到下一条规则
     */
    skipToNextRule() {
        while (!this.isEOF()) {
            const token = this.current();
            if (token.type === CSSTokenizer_1.CSSTokenType.CLOSE_BRACE) {
                this.pos++;
                return;
            }
            this.pos++;
        }
    }
    /**
     * 跳到下一个声明（跳过非法内容）
     */
    skipToNextDeclaration() {
        while (!this.isEOF()) {
            const token = this.current();
            if (token.type === CSSTokenizer_1.CSSTokenType.SEMICOLON) {
                this.pos++;
                return;
            }
            if (token.type === CSSTokenizer_1.CSSTokenType.CLOSE_BRACE) {
                return;
            }
            this.pos++;
        }
    }
}
exports.CSSParser = CSSParser;
/**
 * 从 CSSValue 中提取数值（用于 rgb 函数参数）
 */
function extractNumber(v) {
    if ('value' in v && typeof v.value === 'number') {
        return v.value;
    }
    return 0;
}
//# sourceMappingURL=CSSParser.js.map