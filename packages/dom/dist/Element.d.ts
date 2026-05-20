/**
 * Element 基类 —— 所有 HTML 元素的基类
 *
 * 对应 Chrome/Blink 中的 blink::Element
 *
 * Chrome 中 Element 继承自 ContainerNode（ContainerNode 继承自 Node）。
 * Element 增加了：
 *   - 标签名 tagName
 *   - 属性管理（attributes 在 Chrome 中用 ElementData 存储）
 *   - classList（通过 DOMTokenList 实现）
 *   - 子元素查询方法
 */
import { Node } from './Node';
import { NodeType } from '@browser/shared';
import type { INode, IElement, IDOMTokenList, ICSSStyleDeclaration, IComputedStyle } from '@browser/shared';
export declare class Element extends Node implements IElement {
    readonly nodeType = NodeType.ELEMENT_NODE;
    readonly tagName: string;
    private _attributes;
    private _classList;
    private _style;
    computedStyle: IComputedStyle | null;
    constructor(tagName: string);
    get nodeName(): string;
    get id(): string;
    set id(value: string);
    get className(): string;
    set className(value: string);
    get classList(): IDOMTokenList;
    get style(): ICSSStyleDeclaration;
    getAttribute(name: string): string | null;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    hasAttribute(name: string): boolean;
    /**
     * 按标签名查找子元素（深度优先遍历）
     * 对应 Blink 的 Element::getElementsByTagName
     */
    getElementsByTagName(tagName: string): IElement[];
    /**
     * 按类名查找子元素
     */
    getElementsByClassName(className: string): IElement[];
    /**
     * querySelector — 使用简单选择器查询第一个匹配元素
     * 支持：tag, #id, .class, [attr], [attr=value], 组合选择器（空格分隔）
     */
    querySelector(selector: string): IElement | null;
    /**
     * querySelectorAll — 查询所有匹配元素
     */
    querySelectorAll(selector: string): IElement[];
    cloneNode(deep?: boolean): INode;
    /**
     * 深度优先遍历，对每个子节点执行回调
     */
    private _walkDescendants;
    /**
     * 内部的选择器匹配实现
     *
     * 解析规则（简化版，后续会由完整的 CSS 选择器引擎替代）：
     * - 支持空格分隔的复合选择器（如 "div .class" 表示后代选择器）
     * - 支持 #id, .class, tag 的组合
     * - 支持 [attr] 和 [attr=value]
     */
    private _querySelectorAll;
    /**
     * 判断元素是否匹配简单选择器（不含组合器）
     * 支持：#id, .class, tag, [attr], [attr=value]
     */
    private _matchesSimpleSelector;
}
//# sourceMappingURL=Element.d.ts.map