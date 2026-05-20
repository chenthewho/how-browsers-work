"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
const Node_1 = require("./Node");
const Element_1 = require("./Element");
const Text_1 = require("./Text");
const Comment_1 = require("./Comment");
const shared_1 = require("@browser/shared");
class Document extends Node_1.Node {
    nodeType = shared_1.NodeType.DOCUMENT_NODE;
    nodeName = '#document';
    // ============================================================
    // 便利访问器 — 对应 Blink 的 Document::documentElement() 等
    // ============================================================
    /**
     * documentElement — 返回 <html> 元素
     */
    get documentElement() {
        let child = this.firstChild;
        while (child) {
            if (child.nodeType === shared_1.NodeType.ELEMENT_NODE &&
                child.tagName === 'HTML') {
                return child;
            }
            child = child.nextSibling;
        }
        return null;
    }
    /**
     * head — 返回 <head> 元素
     */
    get head() {
        const html = this.documentElement;
        if (!html)
            return null;
        let child = html.firstChild;
        while (child) {
            if (child.nodeType === shared_1.NodeType.ELEMENT_NODE &&
                child.tagName === 'HEAD') {
                return child;
            }
            child = child.nextSibling;
        }
        return null;
    }
    /**
     * body — 返回 <body> 元素
     */
    get body() {
        const html = this.documentElement;
        if (!html)
            return null;
        let child = html.firstChild;
        while (child) {
            if (child.nodeType === shared_1.NodeType.ELEMENT_NODE &&
                child.tagName === 'BODY') {
                return child;
            }
            child = child.nextSibling;
        }
        return null;
    }
    // ============================================================
    // 节点工厂方法
    // 对应 Blink 的 Document::createElement / createTextNode
    // 所有创建的节点都自动设置 ownerDocument = this
    // ============================================================
    createElement(tagName) {
        // 根据标签名创建对应的 Element 子类
        const element = new Element_1.Element(tagName);
        element.ownerDocument = this;
        return element;
    }
    createTextNode(data) {
        const text = new Text_1.Text(data);
        text.ownerDocument = this;
        return text;
    }
    createComment(data) {
        const comment = new Comment_1.Comment(data);
        comment.ownerDocument = this;
        return comment;
    }
    // ============================================================
    // 查询方法
    // ============================================================
    /**
     * getElementById — 通过 id 查找元素
     *
     * 对应 Blink 的 Document::getElementById
     * Chrome 内部通过 ID 映射表实现，这里用简单的树遍历
     */
    getElementById(id) {
        return this._findById(this, id);
    }
    /**
     * 在子树中递归查找指定 id 的元素
     */
    _findById(root, id) {
        let child = root.firstChild;
        while (child) {
            if (child.nodeType === shared_1.NodeType.ELEMENT_NODE &&
                child.id === id) {
                return child;
            }
            // 递归搜索子节点
            const found = this._findById(child, id);
            if (found)
                return found;
            child = child.nextSibling;
        }
        return null;
    }
    // ============================================================
    // cloneNode — Document 本身通常不被克隆，但提供基本实现
    // ============================================================
    cloneNode(deep) {
        const cloned = new Document();
        if (deep) {
            let child = this.firstChild;
            while (child) {
                cloned.appendChild(child.cloneNode(true));
                child = child.nextSibling;
            }
        }
        return cloned;
    }
}
exports.Document = Document;
//# sourceMappingURL=Document.js.map