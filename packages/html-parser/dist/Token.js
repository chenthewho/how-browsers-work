"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
exports.createStartTagToken = createStartTagToken;
exports.createEndTagToken = createEndTagToken;
exports.createCharacterToken = createCharacterToken;
exports.createCommentToken = createCommentToken;
exports.createDOCTYPEToken = createDOCTYPEToken;
exports.createEndOfFileToken = createEndOfFileToken;
/**
 * Token 类型枚举
 */
var TokenType;
(function (TokenType) {
    TokenType["START_TAG"] = "StartTag";
    TokenType["END_TAG"] = "EndTag";
    TokenType["CHARACTER"] = "Character";
    TokenType["COMMENT"] = "Comment";
    TokenType["DOCTYPE"] = "DOCTYPE";
    TokenType["END_OF_FILE"] = "EndOfFile";
})(TokenType || (exports.TokenType = TokenType = {}));
// ============================================================
// 工厂函数 —— 创建各种 token
// ============================================================
function createStartTagToken(tagName, originalTagName) {
    return {
        type: TokenType.START_TAG,
        tagName: tagName.toLowerCase(),
        attributes: [],
        selfClosing: false,
        originalTagName: originalTagName || tagName,
    };
}
function createEndTagToken(tagName) {
    return {
        type: TokenType.END_TAG,
        tagName: tagName.toLowerCase(),
        attributes: [],
    };
}
function createCharacterToken(data = '') {
    return { type: TokenType.CHARACTER, data };
}
function createCommentToken(data = '') {
    return { type: TokenType.COMMENT, data };
}
function createDOCTYPEToken() {
    return {
        type: TokenType.DOCTYPE,
        name: null,
        publicId: null,
        systemId: null,
        forceQuirks: false,
    };
}
function createEndOfFileToken() {
    return { type: TokenType.END_OF_FILE };
}
//# sourceMappingURL=Token.js.map