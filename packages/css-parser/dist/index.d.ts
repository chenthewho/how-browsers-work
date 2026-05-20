/**
 * @browser/css-parser — CSS 解析器
 *
 * 对应 Chrome/Blink 的 third_party/blink/renderer/core/css/parser/
 *
 * 将 CSS 字符串解析为结构化的样式表对象。
 * 包含词法分析器、语法分析器和选择器解析器。
 *
 * 主要导出：
 *   - CSSParser：解析器入口
 *   - CSSTokenizer：词法分析器
 *   - SelectorParser：选择器解析器
 */
export { CSSParser } from './CSSParser';
export { CSSTokenizer, CSSTokenType, type CSSToken } from './CSSTokenizer';
export { SelectorParser, type SelectorParseResult } from './SelectorParser';
//# sourceMappingURL=index.d.ts.map