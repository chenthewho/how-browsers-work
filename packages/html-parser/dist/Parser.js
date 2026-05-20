"use strict";
/**
 * HTML 解析器入口
 *
 * 对应 Chrome/Blink 中的 HTMLDocumentParser
 *
 * 这是 HTML 解析器对外的统一接口。
 * 内部组合了词法分析器（Tokenizer）和树构造器（TreeBuilder），
 * 将 HTML 字符串解析为 DOM Document。
 *
 * 用法：
 *   const parser = new HTMLParser();
 *   const document = parser.parse('<!DOCTYPE html><html>...</html>');
 *
 * 数据流：
 *   HTML 字符串 → [Tokenizer] → Token 流 → [TreeBuilder] → Document
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLParser = void 0;
const dom_1 = require("@browser/dom");
const Tokenizer_1 = require("./Tokenizer");
const TreeBuilder_1 = require("./TreeBuilder");
class HTMLParser {
    tokenizer;
    treeBuilder;
    constructor() {
        this.tokenizer = new Tokenizer_1.HTMLTokenizer();
        this.treeBuilder = new TreeBuilder_1.HTMLTreeBuilder();
    }
    /**
     * 解析 HTML 字符串，返回 DOM Document
     *
     * @param html 完整的 HTML 源代码
     * @returns 构建好的 Document 对象（DOM 树的根）
     */
    parse(html) {
        // 第一步：词法分析 —— 将 HTML 字符串转为 token 流
        const tokens = this.tokenizer.tokenize(html);
        // 第二步：树构造 —— 将 token 流转为 DOM 树
        // 创建新的 Document 和 TreeBuilder，确保每次解析是独立的
        const document = new dom_1.Document();
        this.treeBuilder = new TreeBuilder_1.HTMLTreeBuilder(document);
        return this.treeBuilder.build(tokens);
    }
}
exports.HTMLParser = HTMLParser;
//# sourceMappingURL=Parser.js.map