/**
 * DOM 类型定义
 *
 * 对应 Chrome/Blink 中的 third_party/blink/renderer/core/dom/
 * 这里定义了 DOM 树中所有节点的接口，仿照 Blink 的 Node/Element 继承体系
 */
export declare enum NodeType {
    ELEMENT_NODE = 1,// 元素节点，如 <div>
    TEXT_NODE = 3,// 文本节点
    COMMENT_NODE = 8,// 注释节点 <!-- -->
    DOCUMENT_NODE = 9,// Document 节点，整个 DOM 树的根
    DOCUMENT_FRAGMENT_NODE = 11
}
export interface INode {
    readonly nodeType: NodeType;
    readonly nodeName: string;
    nodeValue: string | null;
    parentNode: INode | null;
    firstChild: INode | null;
    lastChild: INode | null;
    previousSibling: INode | null;
    nextSibling: INode | null;
    ownerDocument: IDocument | null;
    appendChild(child: INode): INode;
    insertBefore(newNode: INode, referenceNode: INode | null): INode;
    removeChild(child: INode): INode;
    replaceChild(newNode: INode, oldNode: INode): INode;
    hasChildNodes(): boolean;
    contains(other: INode): boolean;
    readonly textContent: string;
    cloneNode(deep?: boolean): INode;
}
export interface IElement extends INode {
    readonly tagName: string;
    readonly id: string;
    className: string;
    classList: IDOMTokenList;
    getAttribute(name: string): string | null;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    hasAttribute(name: string): boolean;
    getElementsByTagName(tagName: string): IElement[];
    getElementsByClassName(className: string): IElement[];
    querySelector(selector: string): IElement | null;
    querySelectorAll(selector: string): IElement[];
    style: ICSSStyleDeclaration;
    computedStyle: IComputedStyle | null;
}
export interface IDocument extends INode {
    readonly documentElement: IElement | null;
    readonly head: IElement | null;
    readonly body: IElement | null;
    createElement(tagName: string): IElement;
    createTextNode(data: string): IText;
    createComment(data: string): IComment;
    getElementById(id: string): IElement | null;
}
export interface IText extends INode {
    data: string;
    readonly length: number;
}
export interface IComment extends INode {
    data: string;
}
export interface IDOMTokenList {
    readonly length: number;
    item(index: number): string | null;
    contains(token: string): boolean;
    add(...tokens: string[]): void;
    remove(...tokens: string[]): void;
    toggle(token: string): boolean;
    toString(): string;
}
export interface ICSSStyleDeclaration {
    cssText: string;
    getPropertyValue(property: string): string;
    setProperty(property: string, value: string): void;
    removeProperty(property: string): string;
    [key: string]: string | ((property: string) => string) | ((property: string, value: string) => void);
}
export interface IEvent {
    readonly type: string;
    readonly target: IElement | null;
    readonly currentTarget: IElement | null;
    preventDefault(): void;
    stopPropagation(): void;
}
export interface IComputedStyle {
    display: 'block' | 'inline' | 'inline-block' | 'flex' | 'none';
    width: number | 'auto';
    height: number | 'auto';
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    borderTopWidth: number;
    borderRightWidth: number;
    borderBottomWidth: number;
    borderLeftWidth: number;
    marginTop: number | 'auto';
    marginRight: number | 'auto';
    marginBottom: number | 'auto';
    marginLeft: number | 'auto';
    position: 'static' | 'relative' | 'absolute' | 'fixed';
    top: number | 'auto';
    right: number | 'auto';
    bottom: number | 'auto';
    left: number | 'auto';
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    fontStyle: 'normal' | 'italic';
    lineHeight: number;
    textAlign: 'left' | 'right' | 'center' | 'justify';
    whiteSpace: 'normal' | 'nowrap';
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    backgroundColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    } | null;
    overflow: 'visible' | 'hidden' | 'scroll' | 'auto';
    opacity: number;
    zIndex: number;
    boxSizing: 'content-box' | 'border-box';
    flexDirection: 'row' | 'column';
    justifyContent: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
    alignItems: 'stretch' | 'flex-start' | 'flex-end' | 'center';
    flexGrow: number;
    flexShrink: number;
    flexBasis: number | 'auto';
}
//# sourceMappingURL=dom.d.ts.map