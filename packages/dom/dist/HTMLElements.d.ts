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
/**
 * HTMLStyleElement — <style> 元素
 * 存储内联 CSS 文本
 */
export declare class HTMLStyleElement extends Element {
    constructor();
    get sheet(): string;
}
/**
 * HTMLScriptElement — <script> 元素
 * 存储脚本文本或外部脚本 URL
 */
export declare class HTMLScriptElement extends Element {
    constructor();
    get src(): string;
    set src(value: string);
}
/**
 * HTMLLinkElement — <link> 元素
 * 用于外部资源链接（主要是 CSS）
 */
export declare class HTMLLinkElement extends Element {
    constructor();
    get href(): string;
    get rel(): string;
}
/**
 * HTMLImageElement — <img> 元素
 * 有固有的宽高属性
 */
export declare class HTMLImageElement extends Element {
    constructor();
    get src(): string;
    get alt(): string;
}
/**
 * HTMLAnchorElement — <a> 元素
 */
export declare class HTMLAnchorElement extends Element {
    constructor();
    get href(): string;
}
/**
 * HTMLMetaElement — <meta> 元素
 */
export declare class HTMLMetaElement extends Element {
    constructor();
}
export declare class HTMLDivElement extends Element {
    constructor();
}
export declare class HTMLSpanElement extends Element {
    constructor();
}
export declare class HTMLParagraphElement extends Element {
    constructor();
}
export declare class HTMLHeadingElement extends Element {
    constructor(level: number);
}
export declare class HTMLUListElement extends Element {
    constructor();
}
export declare class HTMLOListElement extends Element {
    constructor();
}
export declare class HTMLLIElement extends Element {
    constructor();
}
export declare class HTMLTableElement extends Element {
    constructor();
}
export declare class HTMLTableRowElement extends Element {
    constructor();
}
export declare class HTMLTableCellElement extends Element {
    constructor(isHeader?: boolean);
}
export declare class HTMLTableSectionElement extends Element {
    constructor(tag: 'thead' | 'tbody' | 'tfoot');
}
export declare class HTMLBRElement extends Element {
    constructor();
}
export declare class HTMLHRElement extends Element {
    constructor();
}
export declare class HTMLStrongElement extends Element {
    constructor();
}
export declare class HTMLEmElement extends Element {
    constructor();
}
export declare class HTMLBodyElement extends Element {
    constructor();
}
export declare class HTMLHeadElement extends Element {
    constructor();
}
export declare class HTMLHtmlElement extends Element {
    constructor();
}
export declare class HTMLTitleElement extends Element {
    constructor();
}
/**
 * 根据标签名创建对应的 HTMLElement 实例。
 * 如果标签名没有特殊处理，使用通用的 Element 类。
 *
 * @param tagName HTML 标签名（大小写不敏感）
 * @returns 对应的元素实例
 */
export declare function createHTMLElement(tagName: string): IElement;
//# sourceMappingURL=HTMLElements.d.ts.map