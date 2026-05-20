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
import { DOMTokenList } from './DOMTokenList';
import { createCSSStyleDeclaration } from './CSSStyleDeclaration';
import { NodeType } from '@browser/shared';
import type {
  INode,
  IElement,
  IDOMTokenList,
  ICSSStyleDeclaration,
  IComputedStyle,
} from '@browser/shared';

export class Element extends Node implements IElement {
  readonly nodeType = NodeType.ELEMENT_NODE;
  readonly tagName: string;

  // ============================================================
  // 属性存储 —— 对应 Blink 的 ElementData
  // 使用 Map 存储，比 Blink 的 ElementData 简单但功能相同
  // 特殊属性 id 和 class 会同时被 Map.get 和属性访问器返回
  // ============================================================
  private _attributes: Map<string, string> = new Map();

  // ============================================================
  // classList —— 对应 Blink 的 DOMTokenList
  // ============================================================
  private _classList: DOMTokenList;

  // ============================================================
  // 内联样式 —— 对应 Blink 的 CSSStyleDeclaration
  // ============================================================
  private _style: ICSSStyleDeclaration;

  // ============================================================
  // 计算样式 —— 由 StyleResolver 挂载
  // ============================================================
  computedStyle: IComputedStyle | null = null;

  constructor(tagName: string) {
    super();
    this.tagName = tagName.toUpperCase();
    this._classList = new DOMTokenList(this, '');
    this._style = createCSSStyleDeclaration(this);
  }

  // ============================================================
  // nodeName — 元素的 nodeName 返回大写标签名
  // ============================================================
  get nodeName(): string {
    return this.tagName;
  }

  // ============================================================
  // id 属性 — 直接访问 getAttribute('id')
  // ============================================================
  get id(): string {
    return this.getAttribute('id') || '';
  }

  set id(value: string) {
    this.setAttribute('id', value);
  }

  // ============================================================
  // className — 直接访问 getAttribute('class')
  // ============================================================
  get className(): string {
    return this.getAttribute('class') || '';
  }

  set className(value: string) {
    this.setAttribute('class', value);
    // 同步到 classList（重新解析 token 集合）
    this._classList = new DOMTokenList(this, value);
  }

  // ============================================================
  // classList
  // ============================================================
  get classList(): IDOMTokenList {
    return this._classList;
  }

  // ============================================================
  // style — 内联样式
  // ============================================================
  get style(): ICSSStyleDeclaration {
    return this._style;
  }

  // ============================================================
  // 属性操作 —— 对应 Blink 的 Element::getAttribute 等
  // ============================================================

  getAttribute(name: string): string | null {
    return this._attributes.get(name.toLowerCase()) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this._attributes.set(name.toLowerCase(), value);
    // 如果设置的是 class 属性，同步更新 classList
    if (name.toLowerCase() === 'class') {
      this._classList = new DOMTokenList(this, value);
    }
  }

  removeAttribute(name: string): void {
    this._attributes.delete(name.toLowerCase());
  }

  hasAttribute(name: string): boolean {
    return this._attributes.has(name.toLowerCase());
  }

  // ============================================================
  // 子元素查询
  // 实现了最常用的 DOM 查询方法，用于 JavaScript 集成和选择器匹配
  // ============================================================

  /**
   * 按标签名查找子元素（深度优先遍历）
   * 对应 Blink 的 Element::getElementsByTagName
   */
  getElementsByTagName(tagName: string): IElement[] {
    const result: IElement[] = [];
    const searchTag = tagName.toUpperCase();

    this._walkDescendants((node) => {
      if (
        node.nodeType === NodeType.ELEMENT_NODE &&
        (node as IElement).tagName === searchTag
      ) {
        result.push(node as IElement);
      }
    });

    return result;
  }

  /**
   * 按类名查找子元素
   */
  getElementsByClassName(className: string): IElement[] {
    const result: IElement[] = [];

    this._walkDescendants((node) => {
      if (
        node.nodeType === NodeType.ELEMENT_NODE &&
        (node as IElement).classList.contains(className)
      ) {
        result.push(node as IElement);
      }
    });

    return result;
  }

  /**
   * querySelector — 使用简单选择器查询第一个匹配元素
   * 支持：tag, #id, .class, [attr], [attr=value], 组合选择器（空格分隔）
   */
  querySelector(selector: string): IElement | null {
    return this._querySelectorAll(selector, true)[0] || null;
  }

  /**
   * querySelectorAll — 查询所有匹配元素
   */
  querySelectorAll(selector: string): IElement[] {
    return this._querySelectorAll(selector, false);
  }

  // ============================================================
  // cloneNode
  // ============================================================
  cloneNode(deep?: boolean): INode {
    const cloned = new Element(this.tagName);

    // 复制所有属性
    this._attributes.forEach((value, key) => {
      cloned.setAttribute(key, value);
    });

    // 复制内联样式
    cloned._style.cssText = this._style.cssText;

    cloned.ownerDocument = this.ownerDocument;

    if (deep) {
      // 深度克隆：递归克隆所有子节点
      let child = this.firstChild;
      while (child) {
        cloned.appendChild(child.cloneNode(true));
        child = child.nextSibling;
      }
    }

    return cloned;
  }

  // ============================================================
  // 私有辅助方法
  // ============================================================

  /**
   * 深度优先遍历，对每个子节点执行回调
   */
  private _walkDescendants(callback: (node: INode) => void): void {
    let child = this.firstChild;
    while (child) {
      callback(child);
      // 递归遍历子节点的子节点
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        (child as IElement as Element)._walkDescendants(callback);
      }
      child = child.nextSibling;
    }
  }

  /**
   * 内部的选择器匹配实现
   *
   * 解析规则（简化版，后续会由完整的 CSS 选择器引擎替代）：
   * - 支持空格分隔的复合选择器（如 "div .class" 表示后代选择器）
   * - 支持 #id, .class, tag 的组合
   * - 支持 [attr] 和 [attr=value]
   */
  private _querySelectorAll(selector: string, firstOnly: boolean): IElement[] {
    const result: IElement[] = [];
    const parts = selector.trim().split(/\s+/);

    this._walkDescendants((node) => {
      if (node.nodeType !== NodeType.ELEMENT_NODE) return;
      const element = node as IElement;

      // 每个部分都必须在元素或其祖先上匹配
      let allMatch = true;
      let current: INode | null = element;

      // 从右向左遍历选择器部分
      for (let i = parts.length - 1; i >= 0 && allMatch; i--) {
        const part = parts[i];
        let matched = false;

        // 从当前节点向上查找，匹配选择器部分
        while (current) {
          if (current.nodeType === NodeType.ELEMENT_NODE) {
            if (this._matchesSimpleSelector(current as IElement, part)) {
              matched = true;
              break;
            }
          }
          current = current.parentNode;
        }

        if (!matched) {
          allMatch = false;
        }

        // 如果不是第一个部分（不是最右边的），移动到上级检查下一个部分
        if (i > 0 && matched && current) {
          current = current.parentNode;
        }
      }

      if (allMatch) {
        result.push(element);
      }
    });

    return result;
  }

  /**
   * 判断元素是否匹配简单选择器（不含组合器）
   * 支持：#id, .class, tag, [attr], [attr=value]
   */
  private _matchesSimpleSelector(element: IElement, selector: string): boolean {
    // #id
    if (selector.startsWith('#')) {
      return element.id === selector.substring(1);
    }
    // .class
    if (selector.startsWith('.')) {
      return element.classList.contains(selector.substring(1));
    }
    // [attr=value] 或 [attr]
    if (selector.startsWith('[') && selector.endsWith(']')) {
      const inner = selector.substring(1, selector.length - 1);
      const eqIdx = inner.indexOf('=');
      if (eqIdx === -1) {
        return element.hasAttribute(inner);
      }
      const attr = inner.substring(0, eqIdx).trim();
      // 去掉引号
      let val = inner.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      return element.getAttribute(attr) === val;
    }
    // tag（默认）
    return element.tagName === selector.toUpperCase();
  }
}
