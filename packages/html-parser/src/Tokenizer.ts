/**
 * HTML 词法分析器（Tokenizer）
 *
 * 对应 Chrome/Blink 中的 HTMLTokenizer
 *
 * HTML5 规范定义了完整的词法分析状态机，约 80 个状态。
 * 这个实现包含了所有核心状态（约 25 个），足以正确解析绝大多数 HTML。
 *
 * 核心概念：
 *   - 状态机逐个字符处理输入流
 *   - 每个状态对当前字符做出响应，可能：
 *     1. 消费字符（追加到当前 token 的数据中）
 *     2. 切换状态
 *     3. 发射（emit）一个完整的 token
 *     4. 重新处理当前字符（在新状态下）
 *
 * 数据流：HTML 字符串 → [Tokenizer] → Token 流
 */

import {
  TokenType,
  createStartTagToken,
  createEndTagToken,
  createCharacterToken,
  createCommentToken,
  createDOCTYPEToken,
  createEndOfFileToken,
  type HTMLToken,
  type StartTagToken,
  type AttributeToken,
} from './Token';

/**
 * Tokenizer 状态枚举 —— 每个状态对应 HTML 规范中的一个解析状态
 */
enum State {
  DATA = 'DATA',                          // 默认状态
  TAG_OPEN = 'TAG_OPEN',                  // 刚读到了 <
  END_TAG_OPEN = 'END_TAG_OPEN',          // 刚读到了 </
  TAG_NAME = 'TAG_NAME',                  // 正在读标签名
  BEFORE_ATTR_NAME = 'BEFORE_ATTR_NAME',  // 属性名之前（跳过空格）
  ATTR_NAME = 'ATTR_NAME',                // 正在读属性名
  AFTER_ATTR_NAME = 'AFTER_ATTR_NAME',    // 属性名之后（可能有空格或 = 或直接下一个属性）
  BEFORE_ATTR_VALUE = 'BEFORE_ATTR_VALUE',// 属性值之前（跳过空格和 =）
  ATTR_VALUE_DOUBLE_QUOTED = 'ATTR_VALUE_DQ',  // 双引号属性值 "..."
  ATTR_VALUE_SINGLE_QUOTED = 'ATTR_VALUE_SQ',  // 单引号属性值 '...'
  ATTR_VALUE_UNQUOTED = 'ATTR_VALUE_UQ',       // 无引号属性值
  SELF_CLOSING_START_TAG = 'SELF_CLOSING',     // 标签末尾的 /
  MARKUP_DECL_OPEN = 'MARKUP_DECL_OPEN',       // <!
  COMMENT_START = 'COMMENT_START',              // <!-- 的第二个 -
  COMMENT_START_DASH = 'COMMENT_START_DASH',    // <!-- 的第三个 -
  COMMENT = 'COMMENT',                          // 注释内容
  COMMENT_END_DASH = 'COMMENT_END_DASH',        // 注释中的 --
  COMMENT_END = 'COMMENT_END',                  // 注释结束的 >
  DOCTYPE = 'DOCTYPE',                          // <!DOCTYPE 之后
  BEFORE_DOCTYPE_NAME = 'BEFORE_DOCTYPE_NAME',  // DOCTYPE 名之前
  DOCTYPE_NAME = 'DOCTYPE_NAME',                // 正在读 DOCTYPE 名
  AFTER_DOCTYPE_NAME = 'AFTER_DOCTYPE_NAME',   // DOCTYPE 名之后
  RAWTEXT = 'RAWTEXT',                          // <style>, <script> 内容
  RAWTEXT_LESS_THAN = 'RAWTEXT_LESS_THAN',     // rawtext 中的 <
  RAWTEXT_END_TAG_OPEN = 'RAWTEXT_END_TAG',    // rawtext 中的 </
  RAWTEXT_END_TAG_NAME = 'RAWTEXT_END_TAG_NAME',// rawtext 结束标签名
  RCDATA = 'RCDATA',                           // <textarea>, <title> 内容
  RCDATA_LESS_THAN = 'RCDATA_LESS_THAN',       // rcdata 中的 <
  RCDATA_END_TAG_OPEN = 'RCDATA_END_TAG',      // rcdata 中的 </
  RCDATA_END_TAG_NAME = 'RCDATA_END_TAG_NAME', // rcdata 结束标签名
}

export class HTMLTokenizer {
  // 输入和位置
  private input: string = '';
  private pos: number = 0;

  // 状态机当前状态
  private state: State = State.DATA;

  // 当前正在构建的 token
  private currentToken: HTMLToken | null = null;
  private currentAttr: AttributeToken | null = null;

  // 构建中的字符串缓冲区
  private buffer: string = '';

  // 回溯标记（用于重新处理字符）
  private reconsume: boolean = false;

  // 嵌套 RAWTEXT/RCDATA 的处理
  // 当遇到 <style> 时，切换到 RAWTEXT 模式，直到遇到 </style>
  private rawtextEndTagName: string = '';
  private rcdataEndTagName: string = '';

  // Token 输出队列
  private tokens: HTMLToken[] = [];

  // 特殊标签列表（rawtext 和 rcdata 元素）
  private static readonly RAWTEXT_TAGS = new Set(['style', 'script', 'xmp', 'iframe', 'noembed', 'noframes']);
  private static readonly RCDATA_TAGS = new Set(['title', 'textarea']);

  /**
   * 执行词法分析，返回所有 token
   */
  tokenize(input: string): HTMLToken[] {
    this.input = input;
    this.pos = 0;
    this.state = State.DATA;
    this.tokens = [];
    this.buffer = '';
    this.reconsume = false;

    // 逐个字符处理
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      this.processChar(ch);
      // 如果重新消费标记为 true，不前进位置
      if (!this.reconsume) {
        this.pos++;
      }
      this.reconsume = false;
    }

    // 输入结束，触发 EOF 处理
    this.processEOF();

    return this.tokens;
  }

  /**
   * 处理单个字符（状态机入口）
   * 根据当前状态分发到对应的处理函数
   */
  private processChar(ch: string): void {
    switch (this.state) {
      case State.DATA:                    return this.handleData(ch);
      case State.TAG_OPEN:                return this.handleTagOpen(ch);
      case State.END_TAG_OPEN:            return this.handleEndTagOpen(ch);
      case State.TAG_NAME:                return this.handleTagName(ch);
      case State.BEFORE_ATTR_NAME:        return this.handleBeforeAttrName(ch);
      case State.ATTR_NAME:               return this.handleAttrName(ch);
      case State.AFTER_ATTR_NAME:         return this.handleAfterAttrName(ch);
      case State.BEFORE_ATTR_VALUE:       return this.handleBeforeAttrValue(ch);
      case State.ATTR_VALUE_DOUBLE_QUOTED:return this.handleAttrValueDQ(ch);
      case State.ATTR_VALUE_SINGLE_QUOTED:return this.handleAttrValueSQ(ch);
      case State.ATTR_VALUE_UNQUOTED:     return this.handleAttrValueUQ(ch);
      case State.SELF_CLOSING_START_TAG:  return this.handleSelfClosing(ch);
      case State.MARKUP_DECL_OPEN:        return this.handleMarkupDecl(ch);
      case State.COMMENT_START:           return this.handleCommentStart(ch);
      case State.COMMENT_START_DASH:      return this.handleCommentStartDash(ch);
      case State.COMMENT:                 return this.handleComment(ch);
      case State.COMMENT_END_DASH:        return this.handleCommentEndDash(ch);
      case State.COMMENT_END:             return this.handleCommentEnd(ch);
      case State.DOCTYPE:                 return this.handleDOCTYPE(ch);
      case State.BEFORE_DOCTYPE_NAME:     return this.handleBeforeDOCTYPEName(ch);
      case State.DOCTYPE_NAME:            return this.handleDOCTYPEName(ch);
      case State.AFTER_DOCTYPE_NAME:      return this.handleAfterDOCTYPEName(ch);
      case State.RAWTEXT:                 return this.handleRawtext(ch);
      case State.RAWTEXT_LESS_THAN:       return this.handleRawtextLT(ch);
      case State.RAWTEXT_END_TAG_OPEN:    return this.handleRawtextEndTagOpen(ch);
      case State.RAWTEXT_END_TAG_NAME:    return this.handleRawtextEndTagName(ch);
      case State.RCDATA:                  return this.handleRcdata(ch);
      case State.RCDATA_LESS_THAN:        return this.handleRcdataLT(ch);
      case State.RCDATA_END_TAG_OPEN:     return this.handleRcdataEndTagOpen(ch);
      case State.RCDATA_END_TAG_NAME:     return this.handleRcdataEndTagName(ch);
    }
  }

  // ============================================================
  // 状态处理函数
  // ============================================================

  /**
   * DATA 状态 —— 默认状态，大多数内容在此处理
   *
   * 触发条件：进入词法分析器时的初始状态；或从其他状态返回
   *
   * 行为：
   *   - & → 字符引用处理（简化：直接输出）
   *   - < → 切换到 TAG_OPEN
   *   - 其他 → 输出字符 token（会合并连续字符）
   *
   * 注意：为了性能，连续的字符会被合并成一个 token，
   * 而不是每个字符一个 token。这与 Chrome 的做法一致。
   */
  private handleData(ch: string): void {
    if (ch === '<') {
      this.flushCharacterBuffer();
      this.state = State.TAG_OPEN;
    } else if (ch === '&') {
      // 简化实体处理：直接追加 & 符号
      // 完整实现需要解析 &amp; &lt; &#xxx; 等
      this.buffer += ch;
    } else {
      this.buffer += ch;
    }
  }

  /**
   * TAG_OPEN —— 刚读到 <
   *
   * 行为：
   *   - ! → 标记声明（<!-- 或 <!DOCTYPE）
   *   - / → 结束标签开始
   *   - a-z/A-Z → 开始标签，切换到 TAG_NAME
   *   - ? → 伪注释（兼容历史），跳过
   *   - 其他 → 当作普通字符，回到 DATA
   */
  private handleTagOpen(ch: string): void {
    if (ch === '!') {
      this.state = State.MARKUP_DECL_OPEN;
    } else if (ch === '/') {
      this.state = State.END_TAG_OPEN;
    } else if (isLetter(ch)) {
      // 创建开始标签 token
      this.currentToken = createStartTagToken(ch);
      this.state = State.TAG_NAME;
    } else if (ch === '?') {
      // 伪注释，直接跳过不处理
      this.createCommentToken('?');
      this.state = State.COMMENT;
    } else {
      // < 后面不是有效的标签字符，回退到 DATA
      this.buffer += '<';
      this.reconsume = true;
      this.state = State.DATA;
    }
  }

  /**
   * END_TAG_OPEN —— 刚读到 </
   *
   * 行为：
   *   - a-z/A-Z → 结束标签，切换到 TAG_NAME
   *   - > → 错误情况，直接回到 DATA
   *   - EOF → 解析错误
   */
  private handleEndTagOpen(ch: string): void {
    if (isLetter(ch)) {
      this.currentToken = createEndTagToken(ch);
      this.state = State.TAG_NAME;
    } else {
      // 解析错误：</ 后面不是字母
      this.state = State.DATA;
    }
  }

  /**
   * TAG_NAME —— 正在读取标签名
   *
   * 无论是开始标签还是结束标签，都在这个状态读取标签名。
   * 标签名由字母、数字、连字符组成。
   *
   * 行为：
   *   - 空格/换行 → 标签名结束，切换到 BEFORE_ATTR_NAME
   *   - / → 自闭合标签，切换到 SELF_CLOSING
   *   - > → 标签结束，发射 token
   *   - a-z/A-Z/0-9 → 追加到标签名
   */
  private handleTagName(ch: string): void {
    if (isWhitespace(ch)) {
      this.state = State.BEFORE_ATTR_NAME;
    } else if (ch === '/') {
      this.state = State.SELF_CLOSING_START_TAG;
    } else if (ch === '>') {
      this.emitCurrentToken();
      this.state = State.DATA;
    } else if (isLetter(ch) || isDigit(ch)) {
      // 标签名大小写不敏感，统一转小写
      (this.currentToken as any).tagName += ch.toLowerCase();
    }
  }

  /**
   * BEFORE_ATTR_NAME —— 属性名之前
   *
   * 跳过空格，准备读取属性名。
   * 如果遇到 / 或 >，说明没有更多属性了。
   */
  private handleBeforeAttrName(ch: string): void {
    if (isWhitespace(ch)) {
      // 跳过空格
      return;
    } else if (ch === '/' || ch === '>') {
      this.reconsume = true;
      this.state = State.AFTER_ATTR_NAME;
    } else {
      // 开始一个新属性
      this.currentAttr = { name: '', value: '' };
      this.reconsume = true;
      this.state = State.ATTR_NAME;
    }
  }

  /**
   * ATTR_NAME —— 正在读取属性名
   *
   * 属性名由字母、数字、连字符、下划线组成。
   * 遇到 = 表示接下来是属性值。
   */
  private handleAttrName(ch: string): void {
    if (isWhitespace(ch) || ch === '/' || ch === '>') {
      this.reconsume = true;
      this.state = State.AFTER_ATTR_NAME;
    } else if (ch === '=') {
      this.state = State.BEFORE_ATTR_VALUE;
    } else if (isLetter(ch)) {
      if (this.currentAttr) {
        this.currentAttr.name += ch.toLowerCase();
      }
    } else {
      // 其他字符也接受（如引号、等号在属性名中）
      if (this.currentAttr) {
        this.currentAttr.name += ch;
      }
    }
  }

  /**
   * AFTER_ATTR_NAME —— 属性名之后
   *
   * 完成当前属性的处理（可能有值，可能没有）。
   * 准备读取下一个属性或结束标签。
   */
  private handleAfterAttrName(ch: string): void {
    if (isWhitespace(ch)) {
      return; // 跳过空格
    }

    // 先提交当前属性
    if (this.currentAttr && this.currentToken && isStartTag(this.currentToken)) {
      (this.currentToken as StartTagToken).attributes.push({ ...this.currentAttr });
      this.currentAttr = null;
    }

    if (ch === '/') {
      this.state = State.SELF_CLOSING_START_TAG;
    } else if (ch === '>') {
      this.emitCurrentToken();
      this.state = State.DATA;
    } else if (ch === '=') {
      this.state = State.BEFORE_ATTR_VALUE;
    } else {
      // 又开始新属性
      this.currentAttr = { name: '', value: '' };
      this.reconsume = true;
      this.state = State.ATTR_NAME;
    }
  }

  /**
   * BEFORE_ATTR_VALUE —— 属性值之前
   *
   * 跳过 = 和空格，准备读取属性值。
   * 属性值可以是被引号包裹的，也可以是无引号的。
   */
  private handleBeforeAttrValue(ch: string): void {
    if (isWhitespace(ch)) {
      return;
    } else if (ch === '"') {
      this.state = State.ATTR_VALUE_DOUBLE_QUOTED;
    } else if (ch === "'") {
      this.state = State.ATTR_VALUE_SINGLE_QUOTED;
    } else if (ch === '>') {
      this.emitCurrentToken();
      this.state = State.DATA;
    } else {
      // 无引号属性值
      this.reconsume = true;
      this.state = State.ATTR_VALUE_UNQUOTED;
    }
  }

  /**
   * ATTR_VALUE_DOUBLE_QUOTED —— 双引号属性值 "..."
   */
  private handleAttrValueDQ(ch: string): void {
    if (ch === '"') {
      this.state = State.AFTER_ATTR_NAME;
    } else if (ch === '&') {
      // 简化：忽略字符引用
      if (this.currentAttr) this.currentAttr.value += ch;
    } else {
      if (this.currentAttr) this.currentAttr.value += ch;
    }
  }

  /**
   * ATTR_VALUE_SINGLE_QUOTED —— 单引号属性值 '...'
   */
  private handleAttrValueSQ(ch: string): void {
    if (ch === "'") {
      this.state = State.AFTER_ATTR_NAME;
    } else if (ch === '&') {
      if (this.currentAttr) this.currentAttr.value += ch;
    } else {
      if (this.currentAttr) this.currentAttr.value += ch;
    }
  }

  /**
   * ATTR_VALUE_UNQUOTED —— 无引号属性值
   *
   * 值到空格、> 或 / 为止
   */
  private handleAttrValueUQ(ch: string): void {
    if (isWhitespace(ch)) {
      this.state = State.BEFORE_ATTR_NAME;
    } else if (ch === '>') {
      this.emitCurrentToken();
      this.state = State.DATA;
    } else {
      if (this.currentAttr) this.currentAttr.value += ch;
    }
  }

  /**
   * SELF_CLOSING_START_TAG —— 标签末尾的 /
   *
   * 对应 <br/> <img/> 等自闭合标签。
   * HTML 规范中，只有 foreign elements（SVG/MathML）和少数 void elements
   * 的自闭合会被正确识别。对于普通 HTML 元素，/ 会被忽略。
   */
  private handleSelfClosing(ch: string): void {
    if (ch === '>') {
      if (this.currentToken && isStartTag(this.currentToken)) {
        (this.currentToken as StartTagToken).selfClosing = true;
      }
      this.emitCurrentToken();
      this.state = State.DATA;
    } else {
      // 不是自闭合，回到属性名处理
      this.reconsume = true;
      this.state = State.BEFORE_ATTR_NAME;
    }
  }

  /**
   * MARKUP_DECL_OPEN —— 读到了 <!
   *
   * 处理两种标记声明：
   *   - <!-- → 注释
   *   - <!DOCTYPE → 文档类型声明
   */
  private handleMarkupDecl(ch: string): void {
    if (ch === '-' && this.peek(1) === '-') {
      // <!-- 注释
      this.pos += 2;  // 跳过 --
      this.createCommentToken('');
      this.state = State.COMMENT;
    } else if (matchIgnoreCase(this.input, this.pos, 'doctype')) {
      // <!DOCTYPE
      this.pos += 7;  // 跳过 DOCTYPE
      this.currentToken = createDOCTYPEToken();
      this.state = State.DOCTYPE;
    } else {
      // 其他未识别的标记声明，忽略
      // 会尝试找到下一个 > 来恢复
      while (this.pos < this.input.length && this.input[this.pos] !== '>') {
        this.pos++;
      }
      this.state = State.DATA;
    }
  }

  // ============================================================
  // Comment 状态（COMMENT_START / COMMENT_START_DASH / COMMENT / COMMENT_END_DASH / COMMENT_END）
  // 对应 HTML spec 的 12.2.5.5 Comment state
  // ============================================================
  private handleCommentStart(ch: string): void {
    // 这个状态在 handleMarkupDecl 中处理了 <!-- 的前两个 -
    // 这里处理第三个字符（可能是 - 变成 <!--> 或 普通字符）
    this.state = State.COMMENT;
    this.reconsume = true;
  }

  private handleCommentStartDash(ch: string): void {
    if (ch === '-') {
      // 连续 -- 是注释结束的前兆
      this.state = State.COMMENT_END_DASH;
    } else if (ch === '>') {
      // <!--> 空注释
      this.emitCurrentToken();
      this.state = State.DATA;
    } else {
      if (this.currentToken) {
        (this.currentToken as any).data += '-' + ch;
      }
      this.state = State.COMMENT;
    }
  }

  private handleComment(ch: string): void {
    if (ch === '-') {
      this.state = State.COMMENT_END_DASH;
    } else if (ch === '<') {
      if (this.currentToken) {
        (this.currentToken as any).data += ch;
      }
    } else {
      if (this.currentToken) {
        (this.currentToken as any).data += ch;
      }
    }
  }

  private handleCommentEndDash(ch: string): void {
    if (ch === '-') {
      this.state = State.COMMENT_END;
    } else {
      if (this.currentToken) {
        (this.currentToken as any).data += '--' + ch;
      }
      this.state = State.COMMENT;
    }
  }

  private handleCommentEnd(ch: string): void {
    if (ch === '>') {
      this.emitCurrentToken();
      this.state = State.DATA;
    } else {
      if (this.currentToken) {
        (this.currentToken as any).data += '--' + ch;
      }
      this.state = State.COMMENT;
    }
  }

  // ============================================================
  // DOCTYPE 状态
  // ============================================================
  private handleDOCTYPE(ch: string): void {
    if (isWhitespace(ch)) {
      this.state = State.BEFORE_DOCTYPE_NAME;
    } else if (ch === '>') {
      this.emitCurrentToken();
      this.state = State.DATA;
    } else {
      // 解析错误
      this.reconsume = true;
      this.state = State.BEFORE_DOCTYPE_NAME;
    }
  }

  private handleBeforeDOCTYPEName(ch: string): void {
    if (isWhitespace(ch)) {
      return;
    } else if (ch === '>') {
      (this.currentToken as any).forceQuirks = true;
      this.emitCurrentToken();
      this.state = State.DATA;
    } else {
      if (this.currentToken) {
        (this.currentToken as any).name = ch.toLowerCase();
      }
      this.state = State.DOCTYPE_NAME;
    }
  }

  private handleDOCTYPEName(ch: string): void {
    if (isWhitespace(ch)) {
      this.state = State.AFTER_DOCTYPE_NAME;
    } else if (ch === '>') {
      this.emitCurrentToken();
      this.state = State.DATA;
    } else {
      if (this.currentToken) {
        (this.currentToken as any).name += ch.toLowerCase();
      }
    }
  }

  private handleAfterDOCTYPEName(ch: string): void {
    if (isWhitespace(ch)) {
      return;
    } else if (ch === '>') {
      this.emitCurrentToken();
      this.state = State.DATA;
    } else {
      // 跳过 PUBLIC/SYSTEM 标识符，直到 >
      while (this.pos < this.input.length && this.input[this.pos] !== '>') {
        this.pos++;
      }
      this.emitCurrentToken();
      this.state = State.DATA;
    }
  }

  // ============================================================
  // RAWTEXT 状态 —— <style> 和 <script> 的内容
  //
  // 关键区别：在 RAWTEXT 中，所有字符都按字面处理（包括 < > &）
  // 唯一的例外是遇到对应的结束标签（如 </style>）
  // ============================================================
  private handleRawtext(ch: string): void {
    if (ch === '<') {
      this.flushCharacterBuffer();
      this.state = State.RAWTEXT_LESS_THAN;
    } else {
      this.buffer += ch;
    }
  }

  private handleRawtextLT(ch: string): void {
    if (ch === '/') {
      this.buffer = '';
      this.state = State.RAWTEXT_END_TAG_OPEN;
    } else {
      // 不是结束标签，< 是文本的一部分
      this.buffer += '<' + ch;
      this.state = State.RAWTEXT;
    }
  }

  private handleRawtextEndTagOpen(ch: string): void {
    if (isLetter(ch)) {
      this.buffer += ch.toLowerCase();
      this.state = State.RAWTEXT_END_TAG_NAME;
    } else {
      this.buffer += '</' + ch;
      this.state = State.RAWTEXT;
    }
  }

  /**
   * RAWTEXT_END_TAG_NAME —— 检查是否匹配期望的结束标签名
   *
   * 例如：在 <style> 内部遇到 </style> 时，需要从 RAWTEXT 模式退出
   */
  private handleRawtextEndTagName(ch: string): void {
    if (isLetter(ch)) {
      this.buffer += ch.toLowerCase();
    } else if (ch === '>') {
      // 匹配上结束标签
      const endTagName = this.buffer;
      const startTag = this.rawtextEndTagName;

      if (endTagName === startTag) {
        // 成功！发射内容文本和结束标签
        this.flushCharacterBuffer();
        this.currentToken = createEndTagToken(endTagName);
        this.emitCurrentToken();
        this.state = State.DATA;
      } else {
        // 不匹配，回退到文本模式
        this.buffer = '</' + this.buffer + '>';
        this.state = State.RAWTEXT;
      }
      this.buffer = '';
    } else if (isWhitespace(ch)) {
      // 空格后可能还有属性，但我们需要先确认标签名是否匹配
      if (this.buffer === this.rawtextEndTagName) {
        this.flushCharacterBuffer();
        this.currentToken = createEndTagToken(this.buffer);
        this.state = State.BEFORE_ATTR_NAME;
      } else {
        this.buffer = '</' + this.buffer + ch;
        this.state = State.RAWTEXT;
      }
    } else {
      this.buffer += '</' + ch;
      this.state = State.RAWTEXT;
    }
  }

  // ============================================================
  // RCDATA 状态 —— <title> 和 <textarea> 的内容
  //
  // 与 RAWTEXT 类似，但 & 字符可以触发字符引用解析（简化实现）
  // ============================================================
  private handleRcdata(ch: string): void {
    if (ch === '<') {
      this.flushCharacterBuffer();
      this.state = State.RCDATA_LESS_THAN;
    } else {
      this.buffer += ch;
    }
  }

  private handleRcdataLT(ch: string): void {
    if (ch === '/') {
      this.buffer = '';
      this.state = State.RCDATA_END_TAG_OPEN;
    } else {
      this.buffer += '<' + ch;
      this.state = State.RCDATA;
    }
  }

  private handleRcdataEndTagOpen(ch: string): void {
    if (isLetter(ch)) {
      this.buffer += ch.toLowerCase();
      this.state = State.RCDATA_END_TAG_NAME;
    } else {
      this.buffer += '</' + ch;
      this.state = State.RCDATA;
    }
  }

  private handleRcdataEndTagName(ch: string): void {
    // 与 RAWTEXT 结束标签处理逻辑相同
    if (isLetter(ch)) {
      this.buffer += ch.toLowerCase();
    } else if (ch === '>') {
      if (this.buffer === this.rcdataEndTagName) {
        this.flushCharacterBuffer();
        this.currentToken = createEndTagToken(this.buffer);
        this.emitCurrentToken();
        this.state = State.DATA;
      } else {
        this.buffer = '</' + this.buffer + '>';
        this.state = State.RCDATA;
      }
      this.buffer = '';
    } else if (isWhitespace(ch)) {
      if (this.buffer === this.rcdataEndTagName) {
        this.flushCharacterBuffer();
        this.currentToken = createEndTagToken(this.buffer);
        this.state = State.BEFORE_ATTR_NAME;
      } else {
        this.buffer = '</' + this.buffer + ch;
        this.state = State.RCDATA;
      }
    } else {
      this.buffer = '</' + ch;
      this.state = State.RCDATA;
    }
  }

  // ============================================================
  // EOF 处理
  // ============================================================
  private processEOF(): void {
    this.flushCharacterBuffer();

    switch (this.state) {
      case State.TAG_NAME:
      case State.BEFORE_ATTR_NAME:
      case State.AFTER_ATTR_NAME:
        // 未闭合的标签，发射它
        this.emitCurrentToken();
        break;
      case State.COMMENT:
      case State.COMMENT_END_DASH:
        // 发射未完成的注释
        this.emitCurrentToken();
        break;
    }

    // 发射 EOF token
    this.tokens.push(createEndOfFileToken());
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /**
   * 发射当前 token
   */
  private emitCurrentToken(): void {
    if (this.currentToken) {
      this.tokens.push(this.currentToken);
      this.currentToken = null;
    }
  }

  /**
   * 将缓冲区中的字符文本发射为 Character token
   * 合并连续的字符可以提高解析性能
   */
  private flushCharacterBuffer(): void {
    if (this.buffer.length > 0) {
      this.tokens.push(createCharacterToken(this.buffer));
      this.buffer = '';
    }
  }

  /**
   * 创建注释 token 并设为当前 token
   */
  private createCommentToken(data: string): void {
    this.currentToken = createCommentToken(data);
  }

  /**
   * 查看前面第 N 个字符（N 从 1 开始）
   */
  private peek(n: number): string {
    return this.pos + n < this.input.length ? this.input[this.pos + n] : '';
  }
}

// ============================================================
// 辅助函数（模块内共享）
// ============================================================

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
}

function isLetter(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isStartTag(token: HTMLToken): boolean {
  return token.type === TokenType.START_TAG;
}

/**
 * 检查从 pos 位置开始的字符串是否匹配 target（大小写不敏感）
 */
function matchIgnoreCase(input: string, pos: number, target: string): boolean {
  if (pos + target.length > input.length) return false;
  const slice = input.substring(pos, pos + target.length);
  return slice.toLowerCase() === target.toLowerCase();
}
