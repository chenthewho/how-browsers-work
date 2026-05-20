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
import type { IDocument } from '@browser/shared';
export declare class HTMLParser {
    private tokenizer;
    private treeBuilder;
    constructor();
    /**
     * 解析 HTML 字符串，返回 DOM Document
     *
     * @param html 完整的 HTML 源代码
     * @returns 构建好的 Document 对象（DOM 树的根）
     */
    parse(html: string): IDocument;
}
//# sourceMappingURL=Parser.d.ts.map