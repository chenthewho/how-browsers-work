/**
 * HTML Token 类型定义
 *
 * 对应 Chrome/Blink 中的 HTMLToken
 * HTML 词法分析器将字符流转换为 token 流，树构造器消费 token 流构建 DOM 树。
 *
 * Chrome 的 HTMLTokenizer 产生五种 token 类型：
 *   - StartTag: <div id="main">
 *   - EndTag: </div>
 *   - Character: 普通文本字符
 *   - Comment: <!-- ... -->
 *   - DOCTYPE: <!DOCTYPE html>
 *   - EndOfFile: 流结束标记
 */
/**
 * Token 类型枚举
 */
export declare enum TokenType {
    START_TAG = "StartTag",
    END_TAG = "EndTag",
    CHARACTER = "Character",
    COMMENT = "Comment",
    DOCTYPE = "DOCTYPE",
    END_OF_FILE = "EndOfFile"
}
/**
 * 属性 token —— 标签的一个属性
 * 例如：id="main" 或 disabled
 */
export interface AttributeToken {
    name: string;
    value: string;
}
/**
 * 开始标签 token
 * 例如：<div id="main" class="container">
 *   tagName = "div"
 *   attributes = [{name: "id", value: "main"}, {name: "class", value: "container"}]
 *   selfClosing = false
 */
export interface StartTagToken {
    type: TokenType.START_TAG;
    tagName: string;
    attributes: AttributeToken[];
    selfClosing: boolean;
    originalTagName: string;
}
/**
 * 结束标签 token
 * 例如：</div>
 */
export interface EndTagToken {
    type: TokenType.END_TAG;
    tagName: string;
    attributes: AttributeToken[];
}
/**
 * 字符 token
 * 表示标签之间的文本内容
 */
export interface CharacterToken {
    type: TokenType.CHARACTER;
    data: string;
}
/**
 * 注释 token
 * 例如：<!-- 这是一段注释 -->
 */
export interface CommentToken {
    type: TokenType.COMMENT;
    data: string;
}
/**
 * DOCTYPE token
 * 例如：<!DOCTYPE html>
 */
export interface DOCTYPEToken {
    type: TokenType.DOCTYPE;
    name: string | null;
    publicId: string | null;
    systemId: string | null;
    forceQuirks: boolean;
}
/**
 * 文件结束 token
 */
export interface EndOfFileToken {
    type: TokenType.END_OF_FILE;
}
/**
 * 所有 token 类型的联合
 */
export type HTMLToken = StartTagToken | EndTagToken | CharacterToken | CommentToken | DOCTYPEToken | EndOfFileToken;
export declare function createStartTagToken(tagName: string, originalTagName?: string): StartTagToken;
export declare function createEndTagToken(tagName: string): EndTagToken;
export declare function createCharacterToken(data?: string): CharacterToken;
export declare function createCommentToken(data?: string): CommentToken;
export declare function createDOCTYPEToken(): DOCTYPEToken;
export declare function createEndOfFileToken(): EndOfFileToken;
//# sourceMappingURL=Token.d.ts.map