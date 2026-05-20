"use strict";
/**
 * Node 基类 —— DOM 树的核心
 *
 * 对应 Chrome/Blink 中的 blink::Node 和 blink::ContainerNode
 *
 * Chrome 的关键设计：子节点使用双向链表存储，而不是数组。
 * 每个节点持有 firstChild、lastChild、previousSibling、nextSibling 指针。
 * 这样做的好处：
 *   - appendChild / removeChild 是 O(1) 操作（不需要移动数组元素）
 *   - 遍历子节点时内存局部性更好
 *   - 与 DOM 规范中 NodeList 的 live collection 概念天然匹配
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
const shared_1 = require("@browser/shared");
class Node {
    nodeValue = null;
    // ============================================================
    // 树结构指针 —— Blink 式链表
    // 所有节点通过这些指针组织成一棵树
    // ============================================================
    parentNode = null;
    firstChild = null;
    lastChild = null;
    previousSibling = null;
    nextSibling = null;
    // ============================================================
    // 所属文档 — 每个节点都属于某个 Document
    // 对应 Blink 的 Node::ownerDocument_
    // ============================================================
    ownerDocument = null;
    // ============================================================
    // 子节点操作
    // ============================================================
    /**
     * 在末尾追加子节点。
     * 如果 child 已经有父节点，会先从旧父节点移除（这是 DOM 规范的行为）。
     *
     * 时间复杂度：O(1) — 因为维护了 lastChild 指针
     */
    appendChild(child) {
        // 确保 child 没有其他地方引用它（DOM 规范要求先移除）
        if (child.parentNode) {
            child.parentNode.removeChild(child);
        }
        // 链接到当前节点
        child.parentNode = this;
        if (this.lastChild) {
            // 如果已有子节点，链到链表末尾
            child.previousSibling = this.lastChild;
            this.lastChild.nextSibling = child;
            this.lastChild = child;
        }
        else {
            // 这是第一个子节点
            this.firstChild = child;
            this.lastChild = child;
        }
        return child;
    }
    /**
     * 在 referenceNode 之前插入子节点。
     * 如果 referenceNode 为 null，则插入到末尾（同 appendChild）。
     *
     * Chrome 中这个方法用于实现 DOM 的 insertBefore
     */
    insertBefore(newNode, referenceNode) {
        // 如果 referenceNode 不是当前节点的子节点，抛异常（是 DOM 规范的行为）
        if (referenceNode && referenceNode.parentNode !== this) {
            throw new Error('insertBefore: referenceNode is not a child of this node');
        }
        // 如果是 null，等同于 appendChild
        if (!referenceNode) {
            return this.appendChild(newNode);
        }
        // 先解除旧关系
        if (newNode.parentNode) {
            newNode.parentNode.removeChild(newNode);
        }
        // 插入到 referenceNode 之前
        newNode.parentNode = this;
        newNode.nextSibling = referenceNode;
        newNode.previousSibling = referenceNode.previousSibling;
        if (referenceNode.previousSibling) {
            referenceNode.previousSibling.nextSibling = newNode;
        }
        else {
            // referenceNode 是 firstChild，更新 firstChild
            this.firstChild = newNode;
        }
        referenceNode.previousSibling = newNode;
        return newNode;
    }
    /**
     * 移除指定子节点。
     *
     * 时间复杂度：O(1) — 通过 sibling 指针重新链接
     */
    removeChild(child) {
        if (child.parentNode !== this) {
            throw new Error('removeChild: child is not a child of this node');
        }
        // 重新链接 sibling 指针，跳过 child
        if (child.previousSibling) {
            child.previousSibling.nextSibling = child.nextSibling;
        }
        else {
            this.firstChild = child.nextSibling;
        }
        if (child.nextSibling) {
            child.nextSibling.previousSibling = child.previousSibling;
        }
        else {
            this.lastChild = child.previousSibling;
        }
        // 清除 child 的树指针
        child.parentNode = null;
        child.previousSibling = null;
        child.nextSibling = null;
        return child;
    }
    /**
     * 用新节点替换旧节点
     */
    replaceChild(newNode, oldNode) {
        this.insertBefore(newNode, oldNode);
        this.removeChild(oldNode);
        return oldNode;
    }
    // ============================================================
    // 查询方法
    // ============================================================
    hasChildNodes() {
        return this.firstChild !== null;
    }
    /**
     * 判断当前节点是否包含另一个节点（可能是深层后代）
     */
    contains(other) {
        let current = other;
        while (current) {
            if (current === this)
                return true;
            current = current.parentNode;
        }
        return false;
    }
    /**
     * 文本内容 — 获取所有后代文本节点的内容连接
     * 对应 Node::textContent 的 getter
     */
    get textContent() {
        if (this.nodeType === shared_1.NodeType.TEXT_NODE) {
            return this.nodeValue || '';
        }
        let result = '';
        let child = this.firstChild;
        while (child) {
            result += child.textContent;
            child = child.nextSibling;
        }
        return result;
    }
    /**
     * 设置 textContent — 会删除所有子节点，替换为一个文本节点
     */
    set textContent(value) {
        // 删除所有现有子节点
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
        // 不是空字符串时创建一个文本节点
        if (value && this.ownerDocument) {
            const textNode = this.ownerDocument.createTextNode(value);
            textNode.parentNode = this; // 手动设置 parent，避免触发 appendChild 的额外的逻辑
            this.firstChild = textNode;
            this.lastChild = textNode;
        }
    }
}
exports.Node = Node;
//# sourceMappingURL=Node.js.map