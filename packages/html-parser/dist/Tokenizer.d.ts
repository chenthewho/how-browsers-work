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
import { type HTMLToken } from './Token';
export declare class HTMLTokenizer {
    private input;
    private pos;
    private state;
    private currentToken;
    private currentAttr;
    private buffer;
    private reconsume;
    private rawtextEndTagName;
    private rcdataEndTagName;
    private tokens;
    private static readonly RAWTEXT_TAGS;
    private static readonly RCDATA_TAGS;
    /**
     * 执行词法分析，返回所有 token
     */
    tokenize(input: string): HTMLToken[];
    /**
     * 处理单个字符（状态机入口）
     * 根据当前状态分发到对应的处理函数
     */
    private processChar;
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
    private handleData;
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
    private handleTagOpen;
    /**
     * END_TAG_OPEN —— 刚读到 </
     *
     * 行为：
     *   - a-z/A-Z → 结束标签，切换到 TAG_NAME
     *   - > → 错误情况，直接回到 DATA
     *   - EOF → 解析错误
     */
    private handleEndTagOpen;
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
    private handleTagName;
    /**
     * BEFORE_ATTR_NAME —— 属性名之前
     *
     * 跳过空格，准备读取属性名。
     * 如果遇到 / 或 >，说明没有更多属性了。
     */
    private handleBeforeAttrName;
    /**
     * ATTR_NAME —— 正在读取属性名
     *
     * 属性名由字母、数字、连字符、下划线组成。
     * 遇到 = 表示接下来是属性值。
     */
    private handleAttrName;
    /**
     * AFTER_ATTR_NAME —— 属性名之后
     *
     * 完成当前属性的处理（可能有值，可能没有）。
     * 准备读取下一个属性或结束标签。
     */
    private handleAfterAttrName;
    /**
     * BEFORE_ATTR_VALUE —— 属性值之前
     *
     * 跳过 = 和空格，准备读取属性值。
     * 属性值可以是被引号包裹的，也可以是无引号的。
     */
    private handleBeforeAttrValue;
    /**
     * ATTR_VALUE_DOUBLE_QUOTED —— 双引号属性值 "..."
     */
    private handleAttrValueDQ;
    /**
     * ATTR_VALUE_SINGLE_QUOTED —— 单引号属性值 '...'
     */
    private handleAttrValueSQ;
    /**
     * ATTR_VALUE_UNQUOTED —— 无引号属性值
     *
     * 值到空格、> 或 / 为止
     */
    private handleAttrValueUQ;
    /**
     * SELF_CLOSING_START_TAG —— 标签末尾的 /
     *
     * 对应 <br/> <img/> 等自闭合标签。
     * HTML 规范中，只有 foreign elements（SVG/MathML）和少数 void elements
     * 的自闭合会被正确识别。对于普通 HTML 元素，/ 会被忽略。
     */
    private handleSelfClosing;
    /**
     * MARKUP_DECL_OPEN —— 读到了 <!
     *
     * 处理两种标记声明：
     *   - <!-- → 注释
     *   - <!DOCTYPE → 文档类型声明
     */
    private handleMarkupDecl;
    private handleCommentStart;
    private handleCommentStartDash;
    private handleComment;
    private handleCommentEndDash;
    private handleCommentEnd;
    private handleDOCTYPE;
    private handleBeforeDOCTYPEName;
    private handleDOCTYPEName;
    private handleAfterDOCTYPEName;
    private handleRawtext;
    private handleRawtextLT;
    private handleRawtextEndTagOpen;
    /**
     * RAWTEXT_END_TAG_NAME —— 检查是否匹配期望的结束标签名
     *
     * 例如：在 <style> 内部遇到 </style> 时，需要从 RAWTEXT 模式退出
     */
    private handleRawtextEndTagName;
    private handleRcdata;
    private handleRcdataLT;
    private handleRcdataEndTagOpen;
    private handleRcdataEndTagName;
    private processEOF;
    /**
     * 发射当前 token
     */
    private emitCurrentToken;
    /**
     * 将缓冲区中的字符文本发射为 Character token
     * 合并连续的字符可以提高解析性能
     */
    private flushCharacterBuffer;
    /**
     * 创建注释 token 并设为当前 token
     */
    private createCommentToken;
    /**
     * 查看前面第 N 个字符（N 从 1 开始）
     */
    private peek;
}
//# sourceMappingURL=Tokenizer.d.ts.map