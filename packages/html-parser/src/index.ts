/**
 * @browser/html-parser — HTML 解析器
 *
 * 对应 Chrome/Blink 的 third_party/blink/renderer/core/html/parser/
 *
 * 将 HTML 字符串解析为 DOM 树。
 * 实现了 HTML5 规范的词法分析和树构造两个阶段。
 *
 * 主要导出：
 *   - HTMLParser：解析器入口
 *   - HTMLTokenizer：词法分析器（状态机）
 *   - HTMLTreeBuilder：树构造器（插入模式）
 *   - Token 类型：词法分析产生的 token 类型
 */

export { HTMLParser } from './Parser';
export { HTMLTokenizer } from './Tokenizer';
export { HTMLTreeBuilder } from './TreeBuilder';
export {
  TokenType,
  type HTMLToken,
  type StartTagToken,
  type EndTagToken,
  type CharacterToken,
  type CommentToken,
  type DOCTYPEToken,
  type AttributeToken,
} from './Token';
