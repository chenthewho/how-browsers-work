"use strict";
/**
 * CSS 词法分析器（Tokenizer）
 *
 * 对应 Chrome/Blink 中的 CSSParserTokenRange / CSSTokenizer
 *
 * CSS 词法分析器将 CSS 文本转换为 token 流。
 * 与 HTML 词法分析器不同，CSS 词法分析器没有复杂的状态机，
 * 而是使用更简单的规则识别各种 token。
 *
 * 支持的 token 类型（对应 CSS Syntax Module Level 3）：
 *   - Ident（标识符，如属性名、关键字）
 *   - Hash（#id 选择器或颜色值 #fff）
 *   - String（字符串 "..." 或 '...'）
 *   - Number（数字，含正负和小数）
 *   - Percentage（百分比值）
 *   - Dimension（带单位的数值，如 16px，2em）
 *   - Whitespace（空格，用于分隔 token）
 *   - 各种标点符号（: ; , { } ( ) [ ]）
 *   - AtKeyword（@规则关键字，如 @media）
 *   - Function（函数调用，如 rgb(）
 *   - Delim（单个分隔符字符，如 * ^ ~）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSTokenizer = exports.CSSTokenType = void 0;
// ============================================================
// CSS Token 类型定义
// ============================================================
var CSSTokenType;
(function (CSSTokenType) {
    CSSTokenType["IDENT"] = "ident";
    CSSTokenType["FUNCTION"] = "function";
    CSSTokenType["AT_KEYWORD"] = "at-keyword";
    CSSTokenType["HASH"] = "hash";
    CSSTokenType["STRING"] = "string";
    CSSTokenType["NUMBER"] = "number";
    CSSTokenType["PERCENTAGE"] = "percentage";
    CSSTokenType["DIMENSION"] = "dimension";
    CSSTokenType["WHITESPACE"] = "whitespace";
    CSSTokenType["COLON"] = "colon";
    CSSTokenType["SEMICOLON"] = "semicolon";
    CSSTokenType["COMMA"] = "comma";
    CSSTokenType["OPEN_BRACE"] = "open-brace";
    CSSTokenType["CLOSE_BRACE"] = "close-brace";
    CSSTokenType["OPEN_PAREN"] = "open-paren";
    CSSTokenType["CLOSE_PAREN"] = "close-paren";
    CSSTokenType["OPEN_BRACKET"] = "open-bracket";
    CSSTokenType["CLOSE_BRACKET"] = "close-bracket";
    CSSTokenType["DELIM"] = "delim";
    CSSTokenType["EOF"] = "eof";
})(CSSTokenType || (exports.CSSTokenType = CSSTokenType = {}));
class CSSTokenizer {
    input = '';
    pos = 0;
    tokens = [];
    /**
     * 对输入的 CSS 文本进行词法分析
     */
    tokenize(input) {
        this.input = input;
        this.pos = 0;
        this.tokens = [];
        while (this.pos < this.input.length) {
            const ch = this.current();
            // 空格 —— 合并连续空格为一个 token
            if (isWhitespace(ch)) {
                this.consumeWhitespace();
                continue;
            }
            // 字符串 —— "..." 或 '...'
            if (ch === '"' || ch === "'") {
                this.tokens.push(this.consumeString());
                continue;
            }
            // # —— Hash token（#id 或 #fff）
            if (ch === '#') {
                this.tokens.push(this.consumeHash());
                continue;
            }
            // 数字开头 —— 数字/百分比/维度
            if (ch === '+' || ch === '-' || ch === '.') {
                if (ch === '+' || ch === '-') {
                    // 可能是数字符号，也可能是分隔符
                    const next = this.peek(1);
                    if (isDigit(next) || (next === '.' && isDigit(this.peek(2) || ''))) {
                        this.tokens.push(this.consumeNumeric());
                        continue;
                    }
                }
                else if (ch === '.' && isDigit(this.peek(1) || '')) {
                    this.tokens.push(this.consumeNumeric());
                    continue;
                }
            }
            if (isDigit(ch)) {
                this.tokens.push(this.consumeNumeric());
                continue;
            }
            // @ —— At 规则关键字
            if (ch === '@') {
                this.tokens.push(this.consumeAtKeyword());
                continue;
            }
            // 标识符 —— 字母、-、_ 开头
            if (isIdentStart(ch)) {
                this.tokens.push(this.consumeIdent());
                continue;
            }
            // \ —— 转义序列
            if (ch === '\\') {
                this.tokens.push(this.consumeIdent());
                continue;
            }
            // 单字符 token
            this.tokens.push(this.consumeDelim());
        }
        // EOF token
        this.tokens.push({ type: CSSTokenType.EOF, value: '' });
        return this.tokens;
    }
    // ============================================================
    // Token 消费者
    // ============================================================
    /**
     * 消费空格 —— 合并连续空格
     */
    consumeWhitespace() {
        let value = '';
        while (this.pos < this.input.length && isWhitespace(this.current())) {
            value += this.current();
            this.pos++;
        }
        this.tokens.push({ type: CSSTokenType.WHITESPACE, value });
    }
    /**
     * 消费字符串 —— "..." 或 '...'
     */
    consumeString() {
        const quote = this.current();
        let value = '';
        this.pos++; // 跳过开始的引号
        while (this.pos < this.input.length) {
            const ch = this.current();
            if (ch === quote) {
                this.pos++; // 跳过结束的引号
                return { type: CSSTokenType.STRING, value };
            }
            else if (ch === '\\') {
                // 转义字符
                this.pos++;
                if (this.pos < this.input.length) {
                    value += this.current();
                    this.pos++;
                }
            }
            else if (ch === '\n' || ch === '\r') {
                // 字符串中不应有换行（规范行为），截断
                return { type: CSSTokenType.STRING, value };
            }
            else {
                value += ch;
                this.pos++;
            }
        }
        return { type: CSSTokenType.STRING, value };
    }
    /**
     * 消费 # —— Hash token
     */
    consumeHash() {
        this.pos++; // 跳过 #
        let value = '';
        const hashType = isIdentStart(this.current()) ? 'id' : 'unrestricted';
        while (this.pos < this.input.length && isIdentChar(this.current())) {
            value += this.current();
            this.pos++;
        }
        return {
            type: CSSTokenType.HASH,
            value: `#${value}`,
            hashType,
        };
    }
    /**
     * 消费数值 —— 数字/百分比/维度，如 16、50%、2em、1.5px
     */
    consumeNumeric() {
        let value = '';
        let numericValue;
        // 符号部分
        if (this.current() === '+' || this.current() === '-') {
            value += this.current();
            this.pos++;
        }
        // 整数部分
        while (this.pos < this.input.length && isDigit(this.current())) {
            value += this.current();
            this.pos++;
        }
        // 小数部分
        if (this.current() === '.' && isDigit(this.peek(1) || '')) {
            value += this.current();
            this.pos++;
            while (this.pos < this.input.length && isDigit(this.current())) {
                value += this.current();
                this.pos++;
            }
        }
        numericValue = parseFloat(value);
        // 检查百分比
        if (this.current() === '%') {
            this.pos++;
            return {
                type: CSSTokenType.PERCENTAGE,
                value: `${value}%`,
                numericValue: numericValue / 100,
            };
        }
        // 检查维度（单位）
        if (isIdentStart(this.current())) {
            let unit = '';
            while (this.pos < this.input.length && isIdentChar(this.current())) {
                unit += this.current();
                this.pos++;
            }
            return {
                type: CSSTokenType.DIMENSION,
                value: `${value}${unit}`,
                numericValue,
                unit,
            };
        }
        return {
            type: CSSTokenType.NUMBER,
            value,
            numericValue,
        };
    }
    /**
     * 消费 @ 关键字 —— @media、@import 等
     */
    consumeAtKeyword() {
        this.pos++; // 跳过 @
        let value = '';
        while (this.pos < this.input.length && isIdentChar(this.current())) {
            value += this.current();
            this.pos++;
        }
        return {
            type: CSSTokenType.AT_KEYWORD,
            value: `@${value}`,
        };
    }
    /**
     * 消费标识符 —— 属性名、关键字、选择器等
     * 例如：color, display, div, rgb
     *
     * 重要：函数调用如 rgb( 会被识别为 function token
     */
    consumeIdent() {
        let value = '';
        while (this.pos < this.input.length && isIdentChar(this.current())) {
            value += this.current();
            this.pos++;
        }
        // 如果标识符后紧跟 ( 则是函数调用
        if (this.current() === '(') {
            this.pos++;
            return {
                type: CSSTokenType.FUNCTION,
                value: `${value}(`,
            };
        }
        return {
            type: CSSTokenType.IDENT,
            value,
        };
    }
    /**
     * 消费分隔符 —— 单个字符（: ; , { } ( ) [ ] 等）
     */
    consumeDelim() {
        const ch = this.current();
        this.pos++;
        const DELIM_MAP = {
            ':': CSSTokenType.COLON,
            ';': CSSTokenType.SEMICOLON,
            ',': CSSTokenType.COMMA,
            '{': CSSTokenType.OPEN_BRACE,
            '}': CSSTokenType.CLOSE_BRACE,
            '(': CSSTokenType.OPEN_PAREN,
            ')': CSSTokenType.CLOSE_PAREN,
            '[': CSSTokenType.OPEN_BRACKET,
            ']': CSSTokenType.CLOSE_BRACKET,
        };
        const type = DELIM_MAP[ch] || CSSTokenType.DELIM;
        return { type, value: ch };
    }
    // ============================================================
    // 输入辅助
    // ============================================================
    current() {
        return this.pos < this.input.length ? this.input[this.pos] : '';
    }
    peek(n) {
        return this.pos + n < this.input.length ? this.input[this.pos + n] : '';
    }
}
exports.CSSTokenizer = CSSTokenizer;
// ============================================================
// 字符分类辅助函数
// ============================================================
function isWhitespace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
}
function isDigit(ch) {
    return ch >= '0' && ch <= '9';
}
/**
 * 标识符起始字符：字母、下划线、连字符、非 ASCII
 */
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
        return true; // 非 ASCII
    return false;
}
/**
 * 标识符字符：起始字符 + 数字
 */
function isIdentChar(ch) {
    if (isIdentStart(ch))
        return true;
    if (isDigit(ch))
        return true;
    return false;
}
//# sourceMappingURL=CSSTokenizer.js.map