/**
 * HTML 元素子类
 *
 * 对应 Chrome/Blink 中的 HTMLElement 子类，如 HTMLDivElement、HTMLSpanElement 等。
 *
 * 在 Chrome 中，每个 HTML 标签都有对应的 C++ 类，如：
 *   <div> → HTMLDivElement
 *   <span> → HTMLSpanElement
 *   <a> → HTMLAnchorElement
 *
 * 我们的实现中，大部分元素都直接使用 Element 基类。
 * 只有需要特殊行为的元素才创建子类（如 <style> 需要存储样式文本，<script> 需要存储脚本）。
 *
 * 创建元素的工厂函数 createHTMLElement 根据标签名返回合适的元素类型。
 */

import { Element } from './Element';
import type { IElement } from '@browser/shared';

// ============================================================
// 特殊元素子类
// ============================================================

/**
 * HTMLStyleElement — <style> 元素
 * 存储内联 CSS 文本
 */
export class HTMLStyleElement extends Element {
  constructor() {
    super('style');
  }

  get sheet(): string {
    return this.textContent;
  }
}

/**
 * HTMLScriptElement — <script> 元素
 * 存储脚本文本或外部脚本 URL
 */
export class HTMLScriptElement extends Element {
  constructor() {
    super('script');
  }

  get src(): string {
    return this.getAttribute('src') || '';
  }

  set src(value: string) {
    this.setAttribute('src', value);
  }
}

/**
 * HTMLLinkElement — <link> 元素
 * 用于外部资源链接（主要是 CSS）
 */
export class HTMLLinkElement extends Element {
  constructor() {
    super('link');
  }

  get href(): string {
    return this.getAttribute('href') || '';
  }

  get rel(): string {
    return this.getAttribute('rel') || '';
  }
}

/**
 * HTMLImageElement — <img> 元素
 * 有固有的宽高属性
 */
export class HTMLImageElement extends Element {
  constructor() {
    super('img');
  }

  get src(): string {
    return this.getAttribute('src') || '';
  }

  get alt(): string {
    return this.getAttribute('alt') || '';
  }
}

/**
 * HTMLAnchorElement — <a> 元素
 */
export class HTMLAnchorElement extends Element {
  constructor() {
    super('a');
  }

  get href(): string {
    return this.getAttribute('href') || '';
  }
}

/**
 * HTMLMetaElement — <meta> 元素
 */
export class HTMLMetaElement extends Element {
  constructor() {
    super('meta');
  }
}

// ============================================================
// 通用元素（没有特殊行为，使用 Element 基类）
// ============================================================

export class HTMLDivElement extends Element { constructor() { super('div'); } }
export class HTMLSpanElement extends Element { constructor() { super('span'); } }
export class HTMLParagraphElement extends Element { constructor() { super('p'); } }
export class HTMLHeadingElement extends Element {
  constructor(level: number) { super(`h${level}`); }
}
export class HTMLUListElement extends Element { constructor() { super('ul'); } }
export class HTMLOListElement extends Element { constructor() { super('ol'); } }
export class HTMLLIElement extends Element { constructor() { super('li'); } }
export class HTMLTableElement extends Element { constructor() { super('table'); } }
export class HTMLTableRowElement extends Element { constructor() { super('tr'); } }
export class HTMLTableCellElement extends Element {
  constructor(isHeader: boolean = false) { super(isHeader ? 'th' : 'td'); }
}
export class HTMLTableSectionElement extends Element {
  constructor(tag: 'thead' | 'tbody' | 'tfoot') { super(tag); }
}
export class HTMLBRElement extends Element { constructor() { super('br'); } }
export class HTMLHRElement extends Element { constructor() { super('hr'); } }
export class HTMLStrongElement extends Element { constructor() { super('strong'); } }
export class HTMLEmElement extends Element { constructor() { super('em'); } }
export class HTMLBodyElement extends Element { constructor() { super('body'); } }
export class HTMLHeadElement extends Element { constructor() { super('head'); } }
export class HTMLHtmlElement extends Element { constructor() { super('html'); } }
export class HTMLTitleElement extends Element { constructor() { super('title'); } }

// ============================================================
// 元素工厂 — 根据标签名创建对应的元素类
//
// 对应 Chrome 中 Document::createElement 的标签分发逻辑
// Chrome 使用 HTMLTagNames 中的映射表来选择正确的 C++ 类
// ============================================================

/**
 * 标签名 → 元素构造函数的映射表
 */
const ELEMENT_FACTORY: Record<string, () => IElement> = {
  'html': () => new HTMLHtmlElement(),
  'head': () => new HTMLHeadElement(),
  'body': () => new HTMLBodyElement(),
  'title': () => new HTMLTitleElement(),
  'meta': () => new HTMLMetaElement(),
  'link': () => new HTMLLinkElement(),
  'style': () => new HTMLStyleElement(),
  'script': () => new HTMLScriptElement(),
  'div': () => new HTMLDivElement(),
  'span': () => new HTMLSpanElement(),
  'p': () => new HTMLParagraphElement(),
  'a': () => new HTMLAnchorElement(),
  'img': () => new HTMLImageElement(),
  'h1': () => new HTMLHeadingElement(1),
  'h2': () => new HTMLHeadingElement(2),
  'h3': () => new HTMLHeadingElement(3),
  'h4': () => new HTMLHeadingElement(4),
  'h5': () => new HTMLHeadingElement(5),
  'h6': () => new HTMLHeadingElement(6),
  'ul': () => new HTMLUListElement(),
  'ol': () => new HTMLOListElement(),
  'li': () => new HTMLLIElement(),
  'table': () => new HTMLTableElement(),
  'thead': () => new HTMLTableSectionElement('thead'),
  'tbody': () => new HTMLTableSectionElement('tbody'),
  'tfoot': () => new HTMLTableSectionElement('tfoot'),
  'tr': () => new HTMLTableRowElement(),
  'td': () => new HTMLTableCellElement(false),
  'th': () => new HTMLTableCellElement(true),
  'br': () => new HTMLBRElement(),
  'hr': () => new HTMLHRElement(),
  'strong': () => new HTMLStrongElement(),
  'em': () => new HTMLEmElement(),
};

/**
 * 根据标签名创建对应的 HTMLElement 实例。
 * 如果标签名没有特殊处理，使用通用的 Element 类。
 *
 * @param tagName HTML 标签名（大小写不敏感）
 * @returns 对应的元素实例
 */
export function createHTMLElement(tagName: string): IElement {
  const factory = ELEMENT_FACTORY[tagName.toLowerCase()];
  if (factory) {
    return factory();
  }
  // 未知标签使用通用 Element
  return new Element(tagName);
}
