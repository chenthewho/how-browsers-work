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
import { NodeType } from '@browser/shared';
import type { INode, IDocument } from '@browser/shared';
export declare abstract class Node implements INode {
    abstract readonly nodeType: NodeType;
    abstract readonly nodeName: string;
    nodeValue: string | null;
    parentNode: INode | null;
    firstChild: INode | null;
    lastChild: INode | null;
    previousSibling: INode | null;
    nextSibling: INode | null;
    ownerDocument: IDocument | null;
    /**
     * 在末尾追加子节点。
     * 如果 child 已经有父节点，会先从旧父节点移除（这是 DOM 规范的行为）。
     *
     * 时间复杂度：O(1) — 因为维护了 lastChild 指针
     */
    appendChild(child: INode): INode;
    /**
     * 在 referenceNode 之前插入子节点。
     * 如果 referenceNode 为 null，则插入到末尾（同 appendChild）。
     *
     * Chrome 中这个方法用于实现 DOM 的 insertBefore
     */
    insertBefore(newNode: INode, referenceNode: INode | null): INode;
    /**
     * 移除指定子节点。
     *
     * 时间复杂度：O(1) — 通过 sibling 指针重新链接
     */
    removeChild(child: INode): INode;
    /**
     * 用新节点替换旧节点
     */
    replaceChild(newNode: INode, oldNode: INode): INode;
    hasChildNodes(): boolean;
    /**
     * 判断当前节点是否包含另一个节点（可能是深层后代）
     */
    contains(other: INode): boolean;
    /**
     * 文本内容 — 获取所有后代文本节点的内容连接
     * 对应 Node::textContent 的 getter
     */
    get textContent(): string;
    /**
     * 设置 textContent — 会删除所有子节点，替换为一个文本节点
     */
    set textContent(value: string);
    abstract cloneNode(deep?: boolean): INode;
}
//# sourceMappingURL=Node.d.ts.map