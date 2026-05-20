"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLTitleElement = exports.HTMLHtmlElement = exports.HTMLHeadElement = exports.HTMLBodyElement = exports.HTMLEmElement = exports.HTMLStrongElement = exports.HTMLHRElement = exports.HTMLBRElement = exports.HTMLTableSectionElement = exports.HTMLTableCellElement = exports.HTMLTableRowElement = exports.HTMLTableElement = exports.HTMLLIElement = exports.HTMLOListElement = exports.HTMLUListElement = exports.HTMLHeadingElement = exports.HTMLParagraphElement = exports.HTMLSpanElement = exports.HTMLDivElement = exports.HTMLMetaElement = exports.HTMLAnchorElement = exports.HTMLImageElement = exports.HTMLLinkElement = exports.HTMLScriptElement = exports.HTMLStyleElement = void 0;
exports.createHTMLElement = createHTMLElement;
const Element_1 = require("./Element");
// ============================================================
// 特殊元素子类
// ============================================================
/**
 * HTMLStyleElement — <style> 元素
 * 存储内联 CSS 文本
 */
class HTMLStyleElement extends Element_1.Element {
    constructor() {
        super('style');
    }
    get sheet() {
        return this.textContent;
    }
}
exports.HTMLStyleElement = HTMLStyleElement;
/**
 * HTMLScriptElement — <script> 元素
 * 存储脚本文本或外部脚本 URL
 */
class HTMLScriptElement extends Element_1.Element {
    constructor() {
        super('script');
    }
    get src() {
        return this.getAttribute('src') || '';
    }
    set src(value) {
        this.setAttribute('src', value);
    }
}
exports.HTMLScriptElement = HTMLScriptElement;
/**
 * HTMLLinkElement — <link> 元素
 * 用于外部资源链接（主要是 CSS）
 */
class HTMLLinkElement extends Element_1.Element {
    constructor() {
        super('link');
    }
    get href() {
        return this.getAttribute('href') || '';
    }
    get rel() {
        return this.getAttribute('rel') || '';
    }
}
exports.HTMLLinkElement = HTMLLinkElement;
/**
 * HTMLImageElement — <img> 元素
 * 有固有的宽高属性
 */
class HTMLImageElement extends Element_1.Element {
    constructor() {
        super('img');
    }
    get src() {
        return this.getAttribute('src') || '';
    }
    get alt() {
        return this.getAttribute('alt') || '';
    }
}
exports.HTMLImageElement = HTMLImageElement;
/**
 * HTMLAnchorElement — <a> 元素
 */
class HTMLAnchorElement extends Element_1.Element {
    constructor() {
        super('a');
    }
    get href() {
        return this.getAttribute('href') || '';
    }
}
exports.HTMLAnchorElement = HTMLAnchorElement;
/**
 * HTMLMetaElement — <meta> 元素
 */
class HTMLMetaElement extends Element_1.Element {
    constructor() {
        super('meta');
    }
}
exports.HTMLMetaElement = HTMLMetaElement;
// ============================================================
// 通用元素（没有特殊行为，使用 Element 基类）
// ============================================================
class HTMLDivElement extends Element_1.Element {
    constructor() { super('div'); }
}
exports.HTMLDivElement = HTMLDivElement;
class HTMLSpanElement extends Element_1.Element {
    constructor() { super('span'); }
}
exports.HTMLSpanElement = HTMLSpanElement;
class HTMLParagraphElement extends Element_1.Element {
    constructor() { super('p'); }
}
exports.HTMLParagraphElement = HTMLParagraphElement;
class HTMLHeadingElement extends Element_1.Element {
    constructor(level) { super(`h${level}`); }
}
exports.HTMLHeadingElement = HTMLHeadingElement;
class HTMLUListElement extends Element_1.Element {
    constructor() { super('ul'); }
}
exports.HTMLUListElement = HTMLUListElement;
class HTMLOListElement extends Element_1.Element {
    constructor() { super('ol'); }
}
exports.HTMLOListElement = HTMLOListElement;
class HTMLLIElement extends Element_1.Element {
    constructor() { super('li'); }
}
exports.HTMLLIElement = HTMLLIElement;
class HTMLTableElement extends Element_1.Element {
    constructor() { super('table'); }
}
exports.HTMLTableElement = HTMLTableElement;
class HTMLTableRowElement extends Element_1.Element {
    constructor() { super('tr'); }
}
exports.HTMLTableRowElement = HTMLTableRowElement;
class HTMLTableCellElement extends Element_1.Element {
    constructor(isHeader = false) { super(isHeader ? 'th' : 'td'); }
}
exports.HTMLTableCellElement = HTMLTableCellElement;
class HTMLTableSectionElement extends Element_1.Element {
    constructor(tag) { super(tag); }
}
exports.HTMLTableSectionElement = HTMLTableSectionElement;
class HTMLBRElement extends Element_1.Element {
    constructor() { super('br'); }
}
exports.HTMLBRElement = HTMLBRElement;
class HTMLHRElement extends Element_1.Element {
    constructor() { super('hr'); }
}
exports.HTMLHRElement = HTMLHRElement;
class HTMLStrongElement extends Element_1.Element {
    constructor() { super('strong'); }
}
exports.HTMLStrongElement = HTMLStrongElement;
class HTMLEmElement extends Element_1.Element {
    constructor() { super('em'); }
}
exports.HTMLEmElement = HTMLEmElement;
class HTMLBodyElement extends Element_1.Element {
    constructor() { super('body'); }
}
exports.HTMLBodyElement = HTMLBodyElement;
class HTMLHeadElement extends Element_1.Element {
    constructor() { super('head'); }
}
exports.HTMLHeadElement = HTMLHeadElement;
class HTMLHtmlElement extends Element_1.Element {
    constructor() { super('html'); }
}
exports.HTMLHtmlElement = HTMLHtmlElement;
class HTMLTitleElement extends Element_1.Element {
    constructor() { super('title'); }
}
exports.HTMLTitleElement = HTMLTitleElement;
// ============================================================
// 元素工厂 — 根据标签名创建对应的元素类
//
// 对应 Chrome 中 Document::createElement 的标签分发逻辑
// Chrome 使用 HTMLTagNames 中的映射表来选择正确的 C++ 类
// ============================================================
/**
 * 标签名 → 元素构造函数的映射表
 */
const ELEMENT_FACTORY = {
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
function createHTMLElement(tagName) {
    const factory = ELEMENT_FACTORY[tagName.toLowerCase()];
    if (factory) {
        return factory();
    }
    // 未知标签使用通用 Element
    return new Element_1.Element(tagName);
}
//# sourceMappingURL=HTMLElements.js.map