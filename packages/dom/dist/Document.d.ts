/**
 * Document — DOM 树的根节点
 *
 * 对应 Chrome/Blink 中的 blink::Document
 * Document 是 DOM 树的根节点，它不直接对应任何 HTML 元素。
 * 但它是所有节点的 ownerDocument。
 *
 * Chrome 中 Document 的作用：
 *   1. 节点工厂 — createElement, createTextNode 等
 *   2. 树根 — 拥有 documentElement（<html>）
 *   3. 查询入口 — getElementById
 */
import { Node } from './Node';
import { NodeType } from '@browser/shared';
import type { INode, IDocument, IElement, IText, IComment } from '@browser/shared';
export declare class Document extends Node implements IDocument {
    readonly nodeType = NodeType.DOCUMENT_NODE;
    readonly nodeName = "#document";
    /**
     * documentElement — 返回 <html> 元素
     */
    get documentElement(): IElement | null;
    /**
     * head — 返回 <head> 元素
     */
    get head(): IElement | null;
    /**
     * body — 返回 <body> 元素
     */
    get body(): IElement | null;
    createElement(tagName: string): IElement;
    createTextNode(data: string): IText;
    createComment(data: string): IComment;
    /**
     * getElementById — 通过 id 查找元素
     *
     * 对应 Blink 的 Document::getElementById
     * Chrome 内部通过 ID 映射表实现，这里用简单的树遍历
     */
    getElementById(id: string): IElement | null;
    /**
     * 在子树中递归查找指定 id 的元素
     */
    private _findById;
    cloneNode(deep?: boolean): INode;
}
//# sourceMappingURL=Document.d.ts.map