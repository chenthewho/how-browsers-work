/**
 * DOM 类型定义
 *
 * 对应 Chrome/Blink 中的 third_party/blink/renderer/core/dom/
 * 这里定义了 DOM 树中所有节点的接口，仿照 Blink 的 Node/Element 继承体系
 */

// ============================================================
// Node 类型常量 —— 对应 DOM 规范中的 nodeType
// ============================================================
export enum NodeType {
  ELEMENT_NODE = 1,                // 元素节点，如 <div>
  TEXT_NODE = 3,                   // 文本节点
  COMMENT_NODE = 8,                // 注释节点 <!-- -->
  DOCUMENT_NODE = 9,               // Document 节点，整个 DOM 树的根
  DOCUMENT_FRAGMENT_NODE = 11,     // DocumentFragment，轻量级容器
}

// ============================================================
// Node 接口 —— 对应 Blink 的 blink::Node
// Chrome 中 DOM 树的节点使用链表结构存储子节点：
// parentNode -> firstChild -> nextSibling -> ...
// 而不是数组。这样增删节点时不需要移动数组元素。
// ============================================================
export interface INode {
  // --- 节点基本属性 ---
  readonly nodeType: NodeType;       // 节点类型
  readonly nodeName: string;         // 节点名称（元素为大写标签名）
  nodeValue: string | null;          // 节点值（文本节点有值，元素为 null）

  // --- 树结构指针（链表方式，与 Blink 完全一致）---
  // Blink 的 ContainerNode 使用 firstChild/lastChild + sibling 链表
  // 而不是 childNodes 数组。这样增删节点是 O(1) 的。
  parentNode: INode | null;
  firstChild: INode | null;
  lastChild: INode | null;
  previousSibling: INode | null;
  nextSibling: INode | null;

  // --- 所属文档 ---
  ownerDocument: IDocument | null;

  // --- 子节点操作 ---
  // 以下方法仿照 DOM 标准，对应 Blink 的 ContainerNode 实现
  appendChild(child: INode): INode;
  insertBefore(newNode: INode, referenceNode: INode | null): INode;
  removeChild(child: INode): INode;
  replaceChild(newNode: INode, oldNode: INode): INode;

  // --- 查询方法 ---
  hasChildNodes(): boolean;
  contains(other: INode): boolean;
  readonly textContent: string;

  // --- 克隆 ---
  cloneNode(deep?: boolean): INode;
}

// ============================================================
// Element 接口 —— 对应 Blink 的 blink::Element
// 所有 HTML 元素的基类。维护属性映射、类名列表等。
// ============================================================
export interface IElement extends INode {
  readonly tagName: string;        // 标签名（大写），如 "DIV"
  readonly id: string;             // id 属性值
  className: string;               // class 属性值
  classList: IDOMTokenList;        // class 列表，支持 add/remove/toggle

  // --- 属性操作 ---
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  hasAttribute(name: string): boolean;

  // --- 子元素查询 ---
  // 对应 Blink 的 Element::getElementsByTagName 等方法
  getElementsByTagName(tagName: string): IElement[];
  getElementsByClassName(className: string): IElement[];
  querySelector(selector: string): IElement | null;
  querySelectorAll(selector: string): IElement[];

  // --- 内联样式 ---
  // 对应 HTML 元素的 style 属性，如 <div style="color: red">
  style: ICSSStyleDeclaration;

  // --- 计算后的样式（由样式解析阶段挂载）---
  // 在 Chrome 中，ComputedStyle 由 StyleResolver 计算后挂到 Element 上
  computedStyle: IComputedStyle | null;
}

// ============================================================
// Document 接口 —— 对应 Blink 的 blink::Document
// DOM 树的根节点。拥有 createElement、getElementById 等工厂方法。
// ============================================================
export interface IDocument extends INode {
  readonly documentElement: IElement | null;   // <html> 元素
  readonly head: IElement | null;              // <head> 元素
  readonly body: IElement | null;              // <body> 元素

  // 工厂方法 —— 创建各类节点
  createElement(tagName: string): IElement;
  createTextNode(data: string): IText;
  createComment(data: string): IComment;

  // 查询方法
  getElementById(id: string): IElement | null;
}

// ============================================================
// Text 接口 —— 对应 Blink 的 blink::Text
// ============================================================
export interface IText extends INode {
  data: string;            // 文本内容
  readonly length: number; // 文本长度
}

// ============================================================
// Comment 接口 —— 对应 Blink 的 blink::Comment
// ============================================================
export interface IComment extends INode {
  data: string;
}

// ============================================================
// DOMTokenList —— classList 的实现
// ============================================================
export interface IDOMTokenList {
  readonly length: number;
  item(index: number): string | null;
  contains(token: string): boolean;
  add(...tokens: string[]): void;
  remove(...tokens: string[]): void;
  toggle(token: string): boolean;
  toString(): string;
}

// ============================================================
// CSSStyleDeclaration —— element.style 的类型
// 对应内联样式，如 el.style.color = 'red'
// ============================================================
export interface ICSSStyleDeclaration {
  cssText: string;
  getPropertyValue(property: string): string;
  setProperty(property: string, value: string): void;
  removeProperty(property: string): string;
  // 动态属性访问：style.color = 'red'
  [key: string]: string | ((property: string) => string) |
    ((property: string, value: string) => void);
}

// ============================================================
// Event 接口 —— 基础的 DOM 事件
// ============================================================
export interface IEvent {
  readonly type: string;
  readonly target: IElement | null;
  readonly currentTarget: IElement | null;
  preventDefault(): void;
  stopPropagation(): void;
}

// ============================================================
// 计算后的样式，由样式解析阶段挂载到每个元素上
// 所有值都已解析为绝对值（em→px、百分比→数值等）
// ============================================================
export interface IComputedStyle {
  // --- 盒模型 ----
  display: 'block' | 'inline' | 'inline-block' | 'flex' | 'none';
  width: number | 'auto';
  height: number | 'auto';
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;

  // --- 内边距 ---
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;

  // --- 边框宽度 ---
  borderTopWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderLeftWidth: number;

  // --- 外边距 ---
  marginTop: number | 'auto';
  marginRight: number | 'auto';
  marginBottom: number | 'auto';
  marginLeft: number | 'auto';

  // --- 定位 ---
  position: 'static' | 'relative' | 'absolute' | 'fixed';
  top: number | 'auto';
  right: number | 'auto';
  bottom: number | 'auto';
  left: number | 'auto';

  // --- 排版 ---
  fontSize: number;           // 已解析为 px
  fontFamily: string;
  fontWeight: number;         // 100-900
  fontStyle: 'normal' | 'italic';
  lineHeight: number;         // 已解析为 px
  textAlign: 'left' | 'right' | 'center' | 'justify';
  whiteSpace: 'normal' | 'nowrap';

  // --- 颜色 ---
  color: { r: number; g: number; b: number; a: number };
  backgroundColor: { r: number; g: number; b: number; a: number } | null;

  // --- 其他 ---
  overflow: 'visible' | 'hidden' | 'scroll' | 'auto';
  opacity: number;            // 0-1
  zIndex: number;
  boxSizing: 'content-box' | 'border-box';

  // --- Flexbox（简化）---
  flexDirection: 'row' | 'column';
  justifyContent: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  alignItems: 'stretch' | 'flex-start' | 'flex-end' | 'center';
  flexGrow: number;
  flexShrink: number;
  flexBasis: number | 'auto';
}
