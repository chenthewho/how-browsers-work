/**
 * DOM API 绑定（DOM Bindings）
 *
 * 对应 Chrome/Blink 中的 V8 bindings 层
 * 将 DOM C++ 对象暴露给 JavaScript 环境。
 *
 * 这里创建的是一个代理对象（proxy），将 JS 调用转换为对 DOM 树的操作。
 * Chrome 使用 Code Generation（从 IDL 生成绑定代码），这里手动实现。
 */

import type { IDocument, IElement, INode } from '@browser/shared';
import { NodeType } from '@browser/shared';

/**
 * 创建 document 对象的绑定（暴露给 JS 脚本的方法）
 *
 * 支持：
 *   - document.getElementById(id)
 *   - document.querySelector(selector)
 *   - document.querySelectorAll(selector)
 *   - document.createElement(tagName)
 *   - document.createTextNode(text)
 *   - document.body
 */
export function createDOMBindings(document: IDocument): object {
  return {
    // --- 查询方法 ---

    /**
     * 按 ID 查找元素
     * 用法：document.getElementById('main')
     */
    getElementById(id: string): object | null {
      const element = document.getElementById(id);
      return element ? createElementBindings(element) : null;
    },

    /**
     * 查询第一个匹配的元素
     * 用法：document.querySelector('.container')
     */
    querySelector(selector: string): object | null {
      // 从 body 开始查询
      const body = document.body;
      if (!body) return null;
      const element = body.querySelector(selector);
      return element ? createElementBindings(element) : null;
    },

    /**
     * 查询所有匹配的元素
     * 用法：document.querySelectorAll('p')
     */
    querySelectorAll(selector: string): object[] {
      const body = document.body;
      if (!body) return [];
      return body.querySelectorAll(selector).map(el => createElementBindings(el));
    },

    // --- 创建方法 ---

    /**
     * 创建新元素
     * 用法：document.createElement('div')
     */
    createElement(tagName: string): object {
      const element = document.createElement(tagName);
      return createElementBindings(element);
    },

    /**
     * 创建文本节点
     * 用法：document.createTextNode('Hello')
     */
    createTextNode(text: string): object {
      const node = document.createTextNode(text);
      return createTextBindings(node);
    },

    // --- 快捷属性 ---

    /**
     * 获取 body 元素
     * 用法：document.body
     */
    get body(): object | null {
      const body = document.body;
      return body ? createElementBindings(body) : null;
    },
  };
}

/**
 * 创建元素对象的绑定
 *
 * 暴露的方法：
 *   - element.tagName
 *   - element.id / element.className
 *   - element.getAttribute / setAttribute
 *   - element.querySelector / querySelectorAll
 *   - element.appendChild / removeChild
 *   - element.innerHTML / textContent
 *   - element.style (简化)
 */
function createElementBindings(element: IElement): object {
  return {
    // --- 属性 ---
    get tagName(): string {
      return element.tagName;
    },

    get id(): string {
      return element.id;
    },
    set id(value: string) {
      element.setAttribute('id', value);
    },

    get className(): string {
      return element.className;
    },
    set className(value: string) {
      element.className = value;
    },

    // --- 文本内容 ---

    /**
     * innerHTML —— 获取或设置元素的 HTML 内容
     * 简化实现：获取 textContent，设置时创建文本节点
     */
    get innerHTML(): string {
      return element.textContent;
    },
    set innerHTML(value: string) {
      // 清除所有子节点
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      // 添加文本节点
      const doc = element.ownerDocument;
      if (doc) {
        const text = doc.createTextNode(value);
        element.appendChild(text);
      }
    },

    get textContent(): string {
      return element.textContent;
    },
    set textContent(value: string) {
      // 清除所有子节点
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      const doc = element.ownerDocument;
      if (doc && value) {
        const text = doc.createTextNode(value);
        element.appendChild(text);
      }
    },

    // --- 属性操作 ---
    getAttribute(name: string): string | null {
      return element.getAttribute(name);
    },

    setAttribute(name: string, value: string): void {
      element.setAttribute(name, value);
    },

    removeAttribute(name: string): void {
      element.removeAttribute(name);
    },

    // --- 查询 ---
    querySelector(selector: string): object | null {
      const el = element.querySelector(selector);
      return el ? createElementBindings(el) : null;
    },

    querySelectorAll(selector: string): object[] {
      return element.querySelectorAll(selector).map(el => createElementBindings(el));
    },

    // --- 子节点操作 ---
    appendChild(child: any): object {
      // child 是通过 DOMBindings 创建的代理对象，需要提取原始节点
      if (child._rawNode) {
        element.appendChild(child._rawNode);
      }
      return child;
    },

    removeChild(child: any): object {
      if (child._rawNode) {
        element.removeChild(child._rawNode);
      }
      return child;
    },

    // --- 样式（简化）---
    get style(): object {
      return {
        get color(): string { return element.style.getPropertyValue('color'); },
        set color(v: string) { element.style.setProperty('color', v); },
        get backgroundColor(): string { return element.style.getPropertyValue('background-color'); },
        set backgroundColor(v: string) { element.style.setProperty('background-color', v); },
        get display(): string { return element.style.getPropertyValue('display'); },
        set display(v: string) { element.style.setProperty('display', v); },
        get fontSize(): string { return element.style.getPropertyValue('font-size'); },
        set fontSize(v: string) { element.style.setProperty('font-size', v); },
        getPropertyValue(p: string): string { return element.style.getPropertyValue(p); },
        setProperty(p: string, v: string): void { element.style.setProperty(p, v); },
      };
    },

    // --- 内部引用（用于 appendChild 等操作获取原始节点）---
    _rawNode: element,
  };
}

/**
 * 创建文本节点的绑定
 */
function createTextBindings(node: INode): object {
  return {
    get textContent(): string { return node.textContent; },
    set textContent(v: string) { node.nodeValue = v; },
    _rawNode: node,
  };
}
