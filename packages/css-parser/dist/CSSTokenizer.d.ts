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
export declare enum CSSTokenType {
    IDENT = "ident",
    FUNCTION = "function",// 如 rgb(
    AT_KEYWORD = "at-keyword",// 如 @media
    HASH = "hash",// #id 或 #fff
    STRING = "string",// "..." 或 '...'
    NUMBER = "number",// 整数或小数
    PERCENTAGE = "percentage",// 百分比值
    DIMENSION = "dimension",// 带单位的数值
    WHITESPACE = "whitespace",
    COLON = "colon",// :
    SEMICOLON = "semicolon",// ;
    COMMA = "comma",// ,
    OPEN_BRACE = "open-brace",// {
    CLOSE_BRACE = "close-brace",// }
    OPEN_PAREN = "open-paren",// (
    CLOSE_PAREN = "close-paren",// )
    OPEN_BRACKET = "open-bracket",// [
    CLOSE_BRACKET = "close-bracket",// ]
    DELIM = "delim",// 其他单个字符
    EOF = "eof"
}
/**
 * CSS Token 结构
 */
export interface CSSToken {
    type: CSSTokenType;
    value: string;
    numericValue?: number;
    unit?: string;
    hashType?: 'id' | 'unrestricted';
}
export declare class CSSTokenizer {
    private input;
    private pos;
    private tokens;
    /**
     * 对输入的 CSS 文本进行词法分析
     */
    tokenize(input: string): CSSToken[];
    /**
     * 消费空格 —— 合并连续空格
     */
    private consumeWhitespace;
    /**
     * 消费字符串 —— "..." 或 '...'
     */
    private consumeString;
    /**
     * 消费 # —— Hash token
     */
    private consumeHash;
    /**
     * 消费数值 —— 数字/百分比/维度，如 16、50%、2em、1.5px
     */
    private consumeNumeric;
    /**
     * 消费 @ 关键字 —— @media、@import 等
     */
    private consumeAtKeyword;
    /**
     * 消费标识符 —— 属性名、关键字、选择器等
     * 例如：color, display, div, rgb
     *
     * 重要：函数调用如 rgb( 会被识别为 function token
     */
    private consumeIdent;
    /**
     * 消费分隔符 —— 单个字符（: ; , { } ( ) [ ] 等）
     */
    private consumeDelim;
    private current;
    private peek;
}
//# sourceMappingURL=CSSTokenizer.d.ts.map