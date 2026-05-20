"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectorParser = void 0;
class SelectorParser {
    input = '';
    pos = 0;
    /**
     * 解析选择器列表字符串
     * 例如："h1, h2.title, div > p" → [ComplexSelector, ComplexSelector, ComplexSelector]
     *
     * 逗号分隔的是多个独立的选择器（选择器列表）
     */
    parse(selectorText) {
        this.input = selectorText.trim();
        this.pos = 0;
        const selectors = [];
        while (this.pos < this.input.length) {
            this.skipWhitespace();
            if (this.pos >= this.input.length)
                break;
            // 解析一个复杂选择器
            const complex = this.parseComplexSelector();
            if (complex) {
                selectors.push(complex);
            }
            // 跳过逗号和空格（选择器列表分隔符）
            this.skipWhitespace();
            if (this.current() === ',') {
                this.pos++;
            }
        }
        return selectors;
    }
    /**
     * 解析一个复杂选择器
     * 例如：div.container > p + span
     */
    parseComplexSelector() {
        const compounds = [];
        const combinators = [];
        let specificity = [0, 0, 0];
        while (this.pos < this.input.length) {
            this.skipWhitespace();
            // 检查是否是组合器
            const combinator = this.readCombinator();
            if (combinator) {
                combinators.push(combinator);
                this.skipWhitespace();
            }
            else if (compounds.length > 0) {
                // 两个复合选择器之间没有显式组合器，默认是后代选择器
                combinators.push('descendant');
            }
            // 检查是否是选择器列表的结束（逗号、{、EOF）
            if (this.isEndOfSelector())
                break;
            // 检查是否是另一个组合器（两个选择器之间的空格已被处理为后代选择器）
            if (compounds.length > 0 && !combinator) {
                // 已经处理了隐式的后代组合器
            }
            // 解析一个复合选择器
            const compound = this.parseCompoundSelector();
            if (!compound)
                break;
            compounds.push(compound);
            // 累加特异性
            const [a, b, c] = compoundToSpecificity(compound);
            specificity = [
                specificity[0] + a,
                specificity[1] + b,
                specificity[2] + c,
            ];
        }
        if (compounds.length === 0)
            return null;
        return { compounds, combinators, specificity };
    }
    /**
     * 解析一个复合选择器
     * 例如：div.container#main[data-x="y"]:hover
     *
     * 复合选择器由多个简单选择器组成，它们之间没有组合器分隔。
     * 所有条件必须同时满足（AND 关系）。
     */
    parseCompoundSelector() {
        const compound = {
            tagName: null,
            id: null,
            classes: [],
            attributes: [],
            pseudoClasses: [],
        };
        while (this.pos < this.input.length) {
            this.skipWhitespace();
            const ch = this.current();
            if (!ch || this.isEndOfSelector() || this.isCombinator(ch))
                break;
            // # —— ID 选择器
            if (ch === '#') {
                const id = this.readID();
                if (id) {
                    compound.id = id;
                }
                continue;
            }
            // . —— 类选择器
            if (ch === '.') {
                const cls = this.readClass();
                if (cls) {
                    compound.classes.push(cls);
                }
                continue;
            }
            // [ —— 属性选择器
            if (ch === '[') {
                const attr = this.readAttribute();
                if (attr) {
                    compound.attributes.push(attr);
                }
                continue;
            }
            // : —— 伪类选择器
            if (ch === ':') {
                const pc = this.readPseudoClass();
                if (pc) {
                    compound.pseudoClasses.push(pc);
                }
                continue;
            }
            // 字母或 * —— 类型选择器或通用选择器
            if (isIdentStart(ch) || ch === '-') {
                const ident = this.readIdent();
                if (ident && ident === '*') {
                    // 通用选择器，不做特殊处理（compound.tagName 保持 null）
                }
                else if (ident) {
                    compound.tagName = ident.toLowerCase();
                }
                continue;
            }
            // 无法识别的字符，跳过
            this.pos++;
        }
        return compound;
    }
    // ============================================================
    // 简单选择器读取
    // ============================================================
    /**
     * 读取 ID 选择器：#main
     */
    readID() {
        this.pos++; // 跳过 #
        return this.readIdent();
    }
    /**
     * 读取类选择器：.container
     */
    readClass() {
        this.pos++; // 跳过 .
        return this.readIdent();
    }
    /**
     * 读取属性选择器：[attr], [attr=value], [attr~=value] 等
     */
    readAttribute() {
        this.pos++; // 跳过 [
        this.skipWhitespace();
        // 读取属性名
        const name = this.readIdent();
        if (!name)
            return null;
        this.skipWhitespace();
        // 检查是否有操作符
        const ch = this.current();
        if (ch === ']') {
            this.pos++;
            return { name, operator: null, value: null };
        }
        // 读取操作符
        let operator = '=';
        if (ch === '=' || ch === '~' || ch === '|' || ch === '^' || ch === '$' || ch === '*') {
            const next = this.peek(1);
            if (next === '=') {
                this.pos += 2;
                operator = ch === '=' ? '=' : ch === '~' ? '~=' : ch === '|' ? '|=' :
                    ch === '^' ? '^=' : ch === '$' ? '$=' : '*=';
            }
            else {
                this.pos++;
            }
        }
        this.skipWhitespace();
        // 读取值
        let value = null;
        const quote = this.current();
        if (quote === '"' || quote === "'") {
            this.pos++;
            let val = '';
            while (this.pos < this.input.length && this.current() !== quote) {
                val += this.current();
                this.pos++;
            }
            value = val;
            if (this.current() === quote)
                this.pos++;
        }
        else {
            value = this.readIdent() || '';
        }
        this.skipWhitespace();
        if (this.current() === ']')
            this.pos++;
        return { name, operator, value };
    }
    /**
     * 读取伪类选择器：:hover, :first-child, :nth-child(2n+1)
     */
    readPseudoClass() {
        this.pos++; // 跳过 :
        const name = this.readIdent();
        if (!name)
            return null;
        let argument = null;
        // 检查是否有参数 ( )
        if (this.current() === '(') {
            this.pos++;
            let arg = '';
            let depth = 1;
            while (this.pos < this.input.length && depth > 0) {
                const ch = this.current();
                if (ch === '(')
                    depth++;
                if (ch === ')')
                    depth--;
                if (depth > 0)
                    arg += ch;
                this.pos++;
            }
            argument = arg;
        }
        return { name, argument };
    }
    // ============================================================
    // 组合器识别
    // ============================================================
    /**
     * 读取组合器：>, +, ~
     * 返回 null 表示没有显式组合器（隐式后代选择器）
     */
    readCombinator() {
        const ch = this.current();
        if (ch === '>') {
            this.pos++;
            return 'child';
        }
        if (ch === '+') {
            this.pos++;
            return 'adjacent-sibling';
        }
        if (ch === '~') {
            this.pos++;
            return 'general-sibling';
        }
        return null;
    }
    /**
     * 检查当前字符是否是组合器
     */
    isCombinator(ch) {
        return ch === '>' || ch === '+' || ch === '~';
    }
    /**
     * 检查是否到达选择器结束
     */
    isEndOfSelector() {
        const ch = this.current();
        if (!ch)
            return true;
        if (ch === ',')
            return true; // 选择器列表分隔符
        if (ch === '{')
            return true; // 声明块开始
        return false;
    }
    // ============================================================
    // 辅助函数
    // ============================================================
    /**
     * 读取标识符（字母、数字、连字符组成的名字）
     */
    readIdent() {
        let ident = '';
        while (this.pos < this.input.length && isIdentChar(this.current())) {
            ident += this.current();
            this.pos++;
        }
        return ident || null;
    }
    current() {
        return this.pos < this.input.length ? this.input[this.pos] : '';
    }
    peek(n) {
        return this.pos + n < this.input.length ? this.input[this.pos + n] : '';
    }
    skipWhitespace() {
        while (this.pos < this.input.length && isWhitespace(this.current())) {
            this.pos++;
        }
    }
}
exports.SelectorParser = SelectorParser;
// ============================================================
// 辅助函数
// ============================================================
function isWhitespace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}
function isIdentStart(ch) {
    if (!ch)
        return false;
    if (ch === '-' || ch === '_')
        return true;
    if (ch >= 'a' && ch <= 'z')
        return true;
    if (ch >= 'A' && ch <= 'Z')
        return true;
    if (ch.charCodeAt(0) > 127)
        return true;
    return false;
}
function isIdentChar(ch) {
    if (isIdentStart(ch))
        return true;
    if (ch >= '0' && ch <= '9')
        return true;
    return false;
}
/**
 * 计算复合选择器的特异性 [a, b, c]
 * a: ID 数量
 * b: 类/属性/伪类数量
 * c: 类型/伪元素数量
 */
function compoundToSpecificity(compound) {
    let a = 0, b = 0, c = 0;
    if (compound.id)
        a++;
    b += compound.classes.length;
    b += compound.attributes.length;
    b += compound.pseudoClasses.length;
    if (compound.tagName)
        c++;
    return [a, b, c];
}
//# sourceMappingURL=SelectorParser.js.map